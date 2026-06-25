import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { generateBuyerToken } from "@/lib/qr-token";
import { TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const { driverName } = await req.json();
  if (typeof driverName !== "string" || !driverName.trim()) {
    return NextResponse.json({ error: "driverName requis" }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, user_id, picked_up_at, client:clients(full_name, phone)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order || !order.client) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Idempotence : picked_up_at déjà enregistré = WA déjà envoyé
  if (order.picked_up_at) {
    return NextResponse.json({ success: true });
  }

  const client = Array.isArray(order.client) ? order.client[0] : order.client;

  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id)
    .single();

  const vendorName = vendor?.store_name ?? vendor?.full_name ?? "votre vendeur";

  const buyerToken = generateBuyerToken(order.id);
  const trackingUrl = `https://golivra.app/track?t=${buyerToken}`;
  const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
  const message = renderTemplateText(TEMPLATES.delivery_perso_enroute, [prenom, vendorName, trackingUrl]);

  const waResult = await sendWhatsAppNotification(client.phone, message);

  if (!waResult.success) {
    console.error("[driver-notify] WhatsApp send failed:", waResult.error);
    return NextResponse.json(
      { error: "Impossible d'envoyer le message WhatsApp au client", detail: waResult.error },
      { status: 502 }
    );
  }

  await supabase
    .from("orders")
    .update({ picked_up_at: new Date().toISOString(), status: "processing" })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
