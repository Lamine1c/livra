import { NextRequest, NextResponse } from "next/server";
import { generateLocateToken } from "@/lib/qr-token";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { locatePinpointTemplate } from "@/lib/whatsapp-templates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, buyer_lat, user_id, client:clients(phone, full_name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const locateToken = generateLocateToken(order.id as string);
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "https://golivra.app";
  const url = `${base}/locate?t=${locateToken}`;

  // Idempotence: client already confirmed position — skip WA
  if (order.buyer_lat != null) {
    return NextResponse.json({ url, alreadyConfirmed: true });
  }

  const client = order.client
    ? (Array.isArray(order.client) ? order.client[0] : order.client)
    : null;

  if (!client?.phone) {
    console.error("[locate-link] client phone missing, WA skipped");
    return NextResponse.json({ url });
  }

  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id)
    .single();
  const vendorName = vendor?.store_name ?? vendor?.full_name ?? "votre boutique";

  const message = locatePinpointTemplate(vendorName, url);
  const waResult = await sendWhatsAppNotification(client.phone, message);

  if (!waResult.success) {
    console.error("[locate-link] WhatsApp send failed:", waResult.error);
    return NextResponse.json(
      { error: "Impossible d'envoyer le message WhatsApp au client", detail: waResult.error },
      { status: 502 }
    );
  }

  return NextResponse.json({ url });
}
