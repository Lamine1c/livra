import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  generateOTP,
  normalizePhoneNumber,
  sendOtpWhatsApp,
} from "@/lib/whatsapp";

// Versions légales acceptées par le livreur, ENVOYÉES PAR L'APP (seule elle sait quel
// texte elle a affiché — une app pas à jour peut montrer la v3 quand le serveur est en
// v4 ; stocker la constante serveur produirait une preuve fausse). Valeurs client → on
// VALIDE : chaîne courte (≤ 32) au format vN-AAAA-MM-JJ. Format invalide → ignoré
// silencieusement (jamais d'erreur, jamais de blocage d'inscription).
const LEGAL_VERSION_RE = /^v\d+-\d{4}-\d{2}-\d{2}$/;
function isValidLegalVersion(v: unknown): v is string {
  return typeof v === "string" && v.length <= 32 && LEGAL_VERSION_RE.test(v);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { prenom, whatsapp, wilaya, couleur, device_id, terms_version, privacy_version } = body as {
    prenom?: string;
    whatsapp?: string;
    wilaya?: string;
    couleur?: string;
    device_id?: string;
    terms_version?: unknown;
    privacy_version?: unknown;
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

  // 3. Rate limit : OTP envoyé il y a moins de 1 minute.
  // expires_at = created + 10min. « créé il y a < 1min » ⟺ expires_at > now + 9min.
  // (L'ancien « now - 9min » restait vrai 19min : 10 de vie + 9 de marge → blocage 19min.)
  const { data: recent } = await supabase
    .from("driver_otps")
    .select("expires_at")
    .eq("whatsapp", normalizedPhone)
    .gt("expires_at", new Date(Date.now() + 9 * 60 * 1000).toISOString())
    .maybeSingle();

  if (recent) {
    // P2 — message = temps RÉEL restant, pas un « 1 minute » fixe. Fenêtre de renvoi =
    // dernier envoi + 60 s = expires_at - 9 min (expires_at = dernier envoi + 10 min).
    // On lit expires_at (mis à jour à chaque upsert), pas created_at (figé au 1er insert
    // par onConflict → serait faux sur un renvoi). code + retryAfter pour i18n mobile.
    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(recent.expires_at as string).getTime() - 9 * 60 * 1000 - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: `Attends ${retryAfter} s avant de renvoyer.`, code: "OTP_RATE_LIMIT", retryAfter },
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

  // Acceptation (optionnelle) : enregistrée seulement si LES DEUX versions sont
  // présentes ET valides — une demi-acceptation n'est pas une preuve. Absentes ou
  // invalides → on n'écrit rien et l'inscription continue exactement comme avant
  // (les clés omises ne clobbent pas une acceptation déjà en staging à l'onConflict).
  const consent =
    isValidLegalVersion(terms_version) && isValidLegalVersion(privacy_version)
      ? { terms_version, privacy_version }
      : {};

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
        ...consent,
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
