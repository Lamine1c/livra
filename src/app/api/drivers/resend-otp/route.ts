import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateOTP, sendOtpWhatsApp } from "@/lib/whatsapp";

// Renvoi d'OTP par device_id SEUL, pour un livreur déjà inscrit qui a perdu sa session
// (logout : device_id conservé, token effacé). On reconnaît le device en DB et on renvoie
// le code sur le WhatsApp DÉJÀ stocké → le livreur saute le formulaire d'embauche (bug #6).
//
// Sécurité : le device_id est un secret haute-entropie détenu par l'appareil, PAS énumérable
// (contrairement à un numéro ou un id séquentiel). `found:false` ne divulgue rien d'exploitable,
// et `found:true` n'envoie l'OTP qu'au numéro DU livreur (pas au caller). Rate-limité comme register.
export async function POST(req: NextRequest) {
  let body: { device_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { device_id } = body;
  if (!device_id?.trim()) {
    return NextResponse.json({ error: "device_id requis" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Device déjà inscrit ? (le plus récent si un device a servi à plusieurs numéros).
  const { data: driver } = await supabase
    .from("drivers")
    .select("prenom, whatsapp, wilaya, couleur_casque")
    .eq("device_id", device_id.trim())
    .eq("whatsapp_verified", true)
    .order("last_scan_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!driver) {
    // Device inconnu → le mobile enverra vers le formulaire. Pas d'énumération possible
    // (il faut déjà POSSÉDER un device_id valide pour interroger).
    return NextResponse.json({ found: false }, { status: 200 });
  }

  // Rate limit : OTP envoyé il y a moins de 1 minute (même règle que register).
  // « créé il y a < 1min » ⟺ expires_at > now + 9min (expires_at = created + 10min).
  const { data: recent } = await supabase
    .from("driver_otps")
    .select("expires_at")
    .eq("whatsapp", driver.whatsapp)
    .gt("expires_at", new Date(Date.now() + 9 * 60 * 1000).toISOString())
    .maybeSingle();

  if (recent) {
    // P2 — temps réel restant (cf. register). expires_at (frais), pas created_at (figé).
    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(recent.expires_at as string).getTime() - 9 * 60 * 1000 - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: `Attends ${retryAfter} s avant de renvoyer.`, code: "OTP_RATE_LIMIT", retryAfter },
      { status: 429 }
    );
  }

  const otp = generateOTP();
  const otpHash = crypto
    .createHash("sha256")
    .update(otp + driver.whatsapp)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Restage l'OTP avec les infos DÉJÀ en DB → verify-otp (inchangé) pourra re-upsert drivers.
  const { error: upsertError } = await supabase
    .from("driver_otps")
    .upsert(
      {
        whatsapp: driver.whatsapp,
        prenom: driver.prenom,
        wilaya: driver.wilaya,
        couleur_casque: driver.couleur_casque,
        device_id: device_id.trim(),
        otp_hash: otpHash,
        expires_at: expiresAt,
      },
      { onConflict: "whatsapp" }
    );

  if (upsertError) {
    console.error("[resend-otp] upsert error:", upsertError.message);
    return NextResponse.json({ error: "Erreur interne. Réessaie." }, { status: 500 });
  }

  const result = await sendOtpWhatsApp(driver.whatsapp, driver.prenom, otp);
  if (!result.success) {
    await supabase.from("driver_otps").delete().eq("whatsapp", driver.whatsapp);
    console.error("[resend-otp] sendOtpWhatsApp failed:", result.error);
    return NextResponse.json({ error: "Erreur envoi WhatsApp" }, { status: 500 });
  }

  // whatsapp = le propre numéro du livreur, requis en body par verify-otp (match par whatsapp).
  return NextResponse.json(
    { found: true, whatsapp: driver.whatsapp, prenom: driver.prenom, maskedPhone: result.maskedPhone },
    { status: 200 }
  );
}
