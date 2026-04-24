import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOTP, sendOtpWhatsApp } from "@/lib/whatsapp";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Fetch order + client (RLS garantit que l'ordre appartient au user)
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, status, otp_verified_at, client:clients(full_name, phone)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.otp_verified_at) {
    return NextResponse.json({ error: "Commande déjà confirmée" }, { status: 400 });
  }

  const clientRaw = order.client;
  const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as
    | { full_name: string; phone: string }
    | null
    | undefined;
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Persiste l'OTP avant d'envoyer (évite race condition)
  const { error: updateError } = await supabase
    .from("orders")
    .update({ otp_code: otp, otp_expires_at: expiresAt })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  const result = await sendOtpWhatsApp(client.phone, client.full_name, otp);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Échec envoi WhatsApp" },
      { status: 502 }
    );
  }

  return NextResponse.json({ maskedPhone: result.maskedPhone });
}
