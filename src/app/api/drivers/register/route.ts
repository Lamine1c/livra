import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  generateOTP,
  normalizePhoneNumber,
  sendOtpWhatsApp,
} from "@/lib/whatsapp";
import { generateWaToken, waTokenExpiry, waLink } from "@/lib/driver-registration";
import { z } from "zod";
import { observeBody } from "@/lib/zod-observe";

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
  observeBody("drivers/register", z.object({ prenom: z.string(), whatsapp: z.string(), wilaya: z.string(), couleur: z.string(), device_id: z.string(), terms_version: z.string().optional(), privacy_version: z.string().optional(), wa_flow: z.boolean().optional() }).passthrough(), body);

  const { prenom, whatsapp, wilaya, couleur, device_id, terms_version, privacy_version, wa_flow } = body as {
    prenom?: string;
    whatsapp?: string;
    wilaya?: string;
    couleur?: string;
    device_id?: string;
    terms_version?: unknown;
    privacy_version?: unknown;
    wa_flow?: unknown;
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

  // Acceptation (optionnelle) : LES DEUX versions valides sinon rien (cf. plus bas, ancien flux).
  const consent =
    isValidLegalVersion(terms_version) && isValidLegalVersion(privacy_version)
      ? { terms_version, privacy_version }
      : {};

  // ─── N6 · WAME-INVERSE — NOUVEAU FLUX gaté par le flag `wa_flow` ───────────────────────
  // Au lieu d'envoyer l'OTP maintenant (business-initiated, souvent hors fenêtre 24h → perdu),
  // on stocke l'inscription en attente + un token wa.me et on renvoie `wa_link`. L'OTP partira
  // quand le livreur ÉCRIRA à LIVRA (message entrant → fenêtre 24h ouverte, cf. webhook inbound).
  // 🔴 RÉTRO-COMPAT : ce bloc — SEUL à toucher les colonnes wa_* (migration 039) — n'est atteint
  // que si l'app envoie `wa_flow:true`. L'app en circulation ne l'envoie pas → l'ancien flux
  // ci-dessous s'exécute à l'identique, sans référencer aucune colonne wa_* → /register reste
  // fonctionnel même AVANT l'application de 039.
  if (wa_flow === true) {
    const waToken = generateWaToken();
    // otp_hash est NOT NULL : hash factice (aucun OTP envoyé) + expires_at déjà expiré → aucun
    // OTP valide tant que le livreur n'a pas écrit. Le vrai OTP est posé au message entrant.
    const placeholderHash = crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex");
    const { error: upsertError } = await supabase
      .from("driver_otps")
      .upsert(
        {
          whatsapp: normalizedPhone,
          prenom: prenom.trim(),
          wilaya: wilaya.trim(),
          couleur_casque: couleur.trim(),
          device_id: device_id.trim(),
          otp_hash: placeholderHash,
          expires_at: new Date().toISOString(),
          wa_token: waToken,
          wa_token_expires_at: waTokenExpiry(),
          wa_send_count: null,
          wa_send_window_start: null,
          ...consent,
        },
        { onConflict: "whatsapp" }
      );
    if (upsertError) {
      console.error("[register/wa] upsert error:", upsertError.message);
      return NextResponse.json({ error: "Erreur interne. Réessaie." }, { status: 500 });
    }
    // Pas d'OTP envoyé ici : il partira au message entrant « LIVRA <token> ».
    return NextResponse.json({ success: true, wa_link: waLink(waToken) }, { status: 200 });
  }

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

  // Acceptation (optionnelle) : `consent` calculé plus haut (LES DEUX versions valides sinon {}).
  // Une demi-acceptation n'est pas une preuve ; les clés omises ne clobbent pas une acceptation
  // déjà en staging à l'onConflict.

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

  // 8. Envoi WhatsApp (Meta) en erreur → supprimer le record et retourner 500
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
