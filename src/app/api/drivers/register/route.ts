import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  generateOTP,
  normalizePhoneNumber,
  sendOtpWhatsApp,
} from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { prenom, whatsapp, wilaya, couleur, device_id } = body as {
    prenom?: string;
    whatsapp?: string;
    wilaya?: string;
    couleur?: string;
    device_id?: string;
  };

  // 1. Validation
  if (
    !prenom?.trim() ||
    !whatsapp?.trim() ||
    !wilaya?.trim() ||
    !couleur?.trim() ||
    !device_id?.trim()
  ) {
    return NextResponse.json(
      { error: "Tous les champs sont requis (prenom, whatsapp, wilaya, couleur, device_id)" },
      { status: 400 }
    );
  }

  // 2. Normaliser le numéro
  const normalizedPhone = normalizePhoneNumber(whatsapp);

  const supabase = createServiceClient();

  // 3. Rate limit : OTP envoyé il y a moins de 1 minute
  const { data: recent } = await supabase
    .from("driver_otps")
    .select("created_at")
    .eq("whatsapp", normalizedPhone)
    .gt("expires_at", new Date(Date.now() - 9 * 60 * 1000).toISOString())
    .maybeSingle();

  if (recent) {
    return NextResponse.json(
      { error: "Attends 1 minute avant de renvoyer." },
      { status: 429 }
    );
  }

  // 4. Générer l'OTP
  const otp = generateOTP();

  // 5. Hasher l'OTP (phone comme salt par utilisateur)
  const otpHash = crypto
    .createHash("sha256")
    .update(otp + normalizedPhone)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // 6. Upsert dans driver_otps
  const { error: upsertError } = await supabase
    .from("driver_otps")
    .upsert(
      {
        whatsapp: normalizedPhone,
        prenom: prenom.trim(),
        wilaya: wilaya.trim(),
        couleur_casque: couleur.trim(),
        device_id: device_id.trim(),
        otp_hash: otpHash,
        expires_at: expiresAt,
      },
      { onConflict: "whatsapp" }
    );

  if (upsertError) {
    console.error("[register] upsert error:", upsertError.message);
    return NextResponse.json(
      { error: "Erreur interne. Réessaie." },
      { status: 500 }
    );
  }

  // 7. Envoyer l'OTP via WhatsApp
  const result = await sendOtpWhatsApp(normalizedPhone, prenom.trim(), otp);

  // 8. Twilio / Meta en erreur → supprimer le record et retourner 500
  if (!result.success) {
    await supabase
      .from("driver_otps")
      .delete()
      .eq("whatsapp", normalizedPhone);

    console.error("[register] sendOtpWhatsApp failed:", result.error);
    return NextResponse.json(
      { error: "Erreur envoi WhatsApp" },
      { status: 500 }
    );
  }

  // 9. Succès — ne jamais retourner l'OTP ou son hash
  return NextResponse.json(
    { success: true, maskedPhone: result.maskedPhone },
    { status: 200 }
  );
}
