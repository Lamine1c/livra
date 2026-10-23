import type { SupabaseClient } from "@supabase/supabase-js";

// [T0A-1] Plafond DURABLE d'essais de code OTP acheteur (en base).
//
// L'OTP du tunnel acheteur est passé de 10 min à 24 h : le rate-limit mémoire
// (lib/rate-limit.ts) ne protège plus du brute-force d'un code 6 chiffres sur
// une fenêtre aussi longue (Vercel = instances éphémères, Map non partagée).
// On persiste le nombre d'essais PAR COMMANDE (colonne orders.otp_attempts,
// migration 052) via une RPC atomique, et on bloque au-delà de OTP_MAX_ATTEMPTS.
//
// REPLI GRACIEUX : tant que la migration 052 n'est pas appliquée, la RPC n'existe
// pas → l'appel renvoie une erreur → { locked:false, durable:false }. L'appelant
// retombe alors sur le comportement actuel (rate-limit mémoire côté verify-otp,
// silencieux côté inbound). Zéro régression à l'attente de l'application du SQL.

export const OTP_MAX_ATTEMPTS = 10;

/**
 * Incrémente le compteur durable d'essais OTP d'une commande et dit si le
 * plafond est désormais dépassé. Best-effort : une RPC absente (migration non
 * appliquée) ou en erreur ne bloque jamais (durable:false).
 */
export async function registerOtpAttempt(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ locked: boolean; durable: boolean }> {
  const { data, error } = await supabase.rpc("register_otp_attempt", {
    p_order_id: orderId,
  });
  if (error || typeof data !== "number") {
    if (error) {
      console.warn("[otp-attempts] compteur durable indisponible (migration 052 non appliquée ?):", error.message);
    }
    return { locked: false, durable: false };
  }
  return { locked: data > OTP_MAX_ATTEMPTS, durable: true };
}
