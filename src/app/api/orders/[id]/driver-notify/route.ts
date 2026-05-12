import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { generateBuyerToken } from "@/lib/qr-token";
import { buyerTrackingMotoPerso } from "@/lib/whatsapp-templates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { driverName } = await req.json();

  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, user_id, picked_up_at, client:clients(full_name, phone)")
    .eq("id", id)
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
  const message = `🛵 Votre livreur *${driverName}* est en route !\n\n${buyerTrackingMotoPerso(vendorName, trackingUrl)}`;

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
