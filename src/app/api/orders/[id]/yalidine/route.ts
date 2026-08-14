import { NextRequest, NextResponse } from "next/server";
import { createYalidineParcel } from "@/lib/yalidine";
import { Order } from "@/types";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { generateBuyerToken } from "@/lib/qr-token";
import { TEMPLATES } from "@/lib/whatsapp-templates";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const stopDesk = (body as { stopDesk?: boolean })?.stopDesk === true;

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
    return NextResponse.json({ error: "Un bon Yalidine existe déjà pour cette commande." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("yalidine_api_id, yalidine_api_token")
    .eq("id", user.id)
    .single();

  if (!profile?.yalidine_api_id || !profile?.yalidine_api_token) {
    return NextResponse.json(
      { error: "Credentials Yalidine non configurés. Rendez-vous dans Paramètres pour les ajouter." },
      { status: 400 }
    );
  }

  let tracking: string;
  try {
    const result = await createYalidineParcel(order as Order, {
      centerId: profile.yalidine_api_id,
      token: profile.yalidine_api_token,
    }, { stopDesk });
    tracking = result.tracking;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Yalidine inconnue";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ tracking_number: tracking, status: "shipped", updated_at: now })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Tracking créé mais erreur de sauvegarde." }, { status: 500 });
  }

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
      const prenom = (clientData.full_name ?? "").split(" ")[0] ?? "";
      await sendWhatsAppTemplate(clientData.phone, TEMPLATES.delivery_mode_carrier, [prenom, vendorName, "Yalidine", trackingUrl]);
    }
  } catch (err) {
    console.error("[yalidine] buyer WA failed:", err);
  }

  return NextResponse.json({ tracking });
}
