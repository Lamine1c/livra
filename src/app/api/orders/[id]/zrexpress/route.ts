import { NextRequest, NextResponse } from "next/server";
import { createProcolisParcel } from "@/lib/procolis";
import { Order } from "@/types";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { generateBuyerToken } from "@/lib/qr-token";
import { buyerTrackingZrExpress } from "@/lib/whatsapp-templates";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("zr_token, zr_key")
    .eq("id", user.id)
    .single();

  if (!profile?.zr_token || !profile?.zr_key) {
    return NextResponse.json(
      { error: "Compte ZR Express non connecté. Rendez-vous dans Réglages pour le connecter." },
      { status: 400 }
    );
  }

  let tracking: string;
  try {
    const result = await createProcolisParcel(order as Order, {
      token: profile.zr_token,
      key: profile.zr_key,
    });
    tracking = result.tracking;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur ZR Express inconnue";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ tracking_number: tracking, delivery_mode: "zrexpress", status: "shipped", updated_at: now })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Tracking créé mais erreur de sauvegarde." }, { status: 500 });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "zrexpress_parcel_created",
    properties: {
      order_id: id,
      tracking_number: tracking,
      total_amount: order.total_amount,
    },
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
      await sendWhatsAppNotification(clientData.phone, buyerTrackingZrExpress(vendorName, trackingUrl));
    }
  } catch (err) {
    console.error("[zrexpress] buyer WA failed:", err);
  }

  return NextResponse.json({ tracking });
}
