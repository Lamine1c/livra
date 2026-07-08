// Chargily Pay v2 — MODE TEST.
// Doc : https://dev.chargily.com/pay-v2/api-reference/introduction
//   Test : https://pay.chargily.net/test/api/v2
//   Live : https://pay.chargily.net/api/v2 (bascule = changer URL + clés)
// Auth : Authorization: Bearer <CHARGILY_SECRET> (clé secrète, Developers Corner).
// Webhook : header `signature` = HMAC-SHA256 hex du corps BRUT, clé = CHARGILY_SECRET.
export const CHARGILY_API_BASE = "https://pay.chargily.net/test/api/v2";

// Clés lues au runtime uniquement (jamais au module level — cf. CLAUDE.md).
// CHARGILY_SECRET  : clé secrète (Bearer + HMAC webhook) — OBLIGATOIRE.
// CHARGILY_API_KEY : clé publique (non utilisée côté serveur pour l'instant).
export function getChargilySecret(): string | null {
  const secret = process.env.CHARGILY_SECRET;
  return secret && secret.trim() !== "" ? secret : null;
}
