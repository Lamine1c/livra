import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { driverName } = await req.json();

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("reference, client:clients(full_name, phone)")
    .eq("id", id)
    .single();

  if (!order || !order.client) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const client = Array.isArray(order.client) ? order.client[0] : order.client;

  const message = `🛵 Votre livreur *${driverName}* est au pick-up !\n\nVotre commande *${order.reference}* sera livrée très prochainement.\n\n— LIVRA 🛡️`;

  await sendWhatsAppNotification(client.phone, message);

  return NextResponse.json({ success: true });
}
