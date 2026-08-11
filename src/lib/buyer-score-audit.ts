import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── LOT12 phase 1 — OBSERVER l'usage de /api/orders/buyer-score ──────────────
// Le contrat de l'API ne change pas (numéro en entrée) ; on installe les yeux :
//   1) log d'audit (phone HASHÉ, jamais en clair) ;
//   2) canaris (numéros pièges) → alarme SILENCIEUSE (le scraper ne doit rien voir) ;
//   3) compteur de volume → une alerte par vendeur/jour (phase 2 = sanction, pas ici).
// Best-effort STRICT : rien ici ne throw, rien ne bloque ni ne ralentit l'évaluation
// (l'appelant exécute cette fonction dans after(), hors du chemin critique du vendeur).

const DEFAULT_THRESHOLD = 150;

// phone_hash = HMAC-SHA256(clé = sel serveur secret, message = numéro normalisé).
// HMAC (et pas un simple SHA-256(sel+num)) car la plage des numéros DZ est petite :
// sans la clé secrète, un hash brut serait pré-calculable/brute-forçable. La clé vit
// en env (BUYER_SCORE_HASH_SALT), jamais en dur, jamais commitée. Absente → on skip
// l'observation (jamais d'échec d'évaluation, jamais de numéro en clair en base).
function hashPhone(normalized: string): string | null {
  const salt = process.env.BUYER_SCORE_HASH_SALT;
  if (!salt) return null;
  return crypto.createHmac("sha256", salt).update(normalized).digest("hex");
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

type DB = SupabaseClient;

export async function observeBuyerScoreLookup(
  supabase: DB,
  opts: { userId: string; normalized: string; level: string }
): Promise<void> {
  try {
    const phoneHash = hashPhone(opts.normalized);
    if (!phoneHash) {
      console.warn("[buyer-score-audit] BUYER_SCORE_HASH_SALT manquant — observation ignorée");
      return;
    }

    // 1) Log d'audit (numéro HASHÉ). L'échec n'interrompt rien (on est dans after()).
    const { error: insErr } = await supabase
      .from("buyer_score_lookups")
      .insert({ user_id: opts.userId, phone_hash: phoneHash, level: opts.level });
    if (insErr) {
      // Sans ce log, les compteurs canari/volume ci-dessous seraient faussés (ils
      // comptent les lignes) → on s'arrête. Jamais d'échec d'évaluation : after().
      console.error("[buyer-score-audit] insert lookup failed:", insErr.message);
      return;
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 2) Canari : le numéro correspond-il à un piège ? Réponse client déjà renvoyée,
    //    identique à un numéro inconnu ("nouveau") → aucun signe visible. Alarme
    //    silencieuse côté serveur. Dédup robuste à la concurrence : on alerte sur les
    //    3 premières consultations de CE canari par CE vendeur sur 24 h (le lookup
    //    vient d'être inséré → count ≥ 1) ; le fingerprint (vendeur, jour) regroupe le
    //    tout en UNE seule issue Sentry → au pire 3 events, pas de spam, pas de miss.
    const { data: canary } = await supabase
      .from("buyer_score_canaries")
      .select("phone_normalized")
      .eq("phone_normalized", opts.normalized)
      .maybeSingle();

    if (canary) {
      const { count: sameHashCount } = await supabase
        .from("buyer_score_lookups")
        .select("id", { count: "exact", head: true })
        .eq("user_id", opts.userId)
        .eq("phone_hash", phoneHash)
        .gte("created_at", since24h);

      if ((sameHashCount ?? 0) >= 1 && (sameHashCount ?? 0) <= 3) {
        Sentry.captureMessage("[buyer-score] canary consulté — énumération détectée", {
          level: "error",
          tags: { feature: "buyer-score", signal: "canary", userId: opts.userId },
          fingerprint: ["buyer-score-canary", opts.userId, dayKey()],
        });
      }
    }

    // 3) Volume : ce vendeur franchit le seuil sur 24 h glissantes. Fenêtre
    //    [threshold .. threshold+5) au lieu d'une égalité exacte → robuste à la
    //    concurrence (deux requêtes simultanées ne peuvent pas "sauter" le seuil et
    //    rater l'alerte) ; le fingerprint (vendeur, jour) regroupe en UNE issue → au
    //    pire ~5 events/jour/vendeur. Aucun blocage ni dégradation ici — c'est la phase 2.
    const threshold = Number(process.env.BUYER_SCORE_ALERT_THRESHOLD) || DEFAULT_THRESHOLD;
    const { count: windowCount } = await supabase
      .from("buyer_score_lookups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", opts.userId)
      .gte("created_at", since24h);

    if ((windowCount ?? 0) >= threshold && (windowCount ?? 0) < threshold + 5) {
      Sentry.captureMessage("[buyer-score] volume élevé — surveillance énumération", {
        level: "warning",
        tags: { feature: "buyer-score", signal: "volume", userId: opts.userId },
        extra: { windowCount, threshold },
        fingerprint: ["buyer-score-volume", opts.userId, dayKey()],
      });
    }
  } catch (e) {
    // Best-effort STRICT : jamais d'exception propagée à l'évaluation.
    console.error("[buyer-score-audit] observation failed:", e);
  }
}
