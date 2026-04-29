import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOTP, sendOtpWhatsApp } from "@/lib/whatsapp";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, status, otp_verified_at, otp_sent_at, client:clients(full_name, phone)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.otp_verified_at) {
    return NextResponse.json({ error: "Commande déjà confirmée" }, { status: 400 });
  }

  // Cooldown 60 secondes entre chaque envoi OTP
  if (order.otp_sent_at) {
    const sentAt = new Date(order.otp_sent_at).getTime();
    const elapsed = Date.now() - sentAt;
    if (elapsed < 60_000) {
      const wait = Math.ceil((60_000 - elapsed) / 1000);
      return NextResponse.json(
        { error: `Attendez ${wait} secondes avant de renvoyer.` },
        { status: 429 }
      );
    }
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
  const sentAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({ otp_code: otp, otp_expires_at: expiresAt, otp_sent_at: sentAt })
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
