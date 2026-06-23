import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEcotrackOrder, ECOTRACK_SLUG_BASE_URL } from "@/lib/ecotrack";
import { Order } from "@/types";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { generateBuyerToken } from "@/lib/qr-token";
import { buyerTrackingEcotrack } from "@/lib/whatsapp-templates";
import { getAuthenticatedUser } from "@/lib/auth";

const CARRIER_LABELS: Record<string, string> = { dhd: "DHD", anderson: "Anderson" };

const bodySchema = z.object({
  carrier: z.enum(Object.keys(ECOTRACK_SLUG_BASE_URL) as [string, ...string[]]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Transporteur invalide." }, { status: 400 });
  }
  const carrier = parsed.data.carrier;
  const carrierLabel = CARRIER_LABELS[carrier] ?? carrier;

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, client:clients(*), items:order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.tracking_number) {
    return NextResponse.json({ error: "Un bon de livraison existe déjà pour cette commande." }, { status: 400 });
  }

  const { data: carrierToken } = await supabase
    .from("carrier_tokens")
    .select("token")
    .eq("user_id", user.id)
    .eq("carrier_slug", carrier)
    .maybeSingle();

  if (!carrierToken?.token) {
    return NextResponse.json(
      { error: `Compte ${carrierLabel} non connecté. Rendez-vous dans Réglages pour le connecter.` },
      { status: 400 }
    );
  }

  let tracking: string;
  try {
    const result = await createEcotrackOrder(carrier, order as Order, carrierToken.token);
    tracking = result.tracking;
  } catch (err) {
    const msg = err instanceof Error ? err.message : `Erreur ${carrierLabel} inconnue`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ tracking_number: tracking, delivery_mode: carrier, status: "shipped", updated_at: now })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Tracking créé mais erreur de sauvegarde." }, { status: 500 });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "ecotrack_parcel_created",
    properties: { order_id: id, carrier, tracking_number: tracking, total_amount: order.total_amount },
  });
  await posthog.shutdown();

  // Notifier l'acheteur avec le lien de tracking (best-effort)
  try {
    const { data: profileForNotif } = await supabase
      .from("profiles")
      .select("store_name, full_name")
      .eq("id", user.id)
      .single();

    const vendorName = profileForNotif?.store_name ?? profileForNotif?.full_name ?? "votre vendeur";
    const clientData = Array.isArray(order.client) ? order.client[0] : order.client;

    if (clientData?.phone) {
      const buyerToken = generateBuyerToken(order.id);
      const trackingUrl = `https://golivra.app/track?t=${buyerToken}`;
      await sendWhatsAppNotification(clientData.phone, buyerTrackingEcotrack(vendorName, carrierLabel, trackingUrl));
    }
  } catch (err) {
    console.error("[ecotrack] buyer WA failed:", err);
  }

  return NextResponse.json({ tracking });
}
