// ─── Rate-limit minimal en mémoire (fenêtre glissante) ───────────────────────
//
// LIMITE SERVERLESS : la Map vit dans la mémoire de l'instance. Sur Vercel,
// chaque instance lambda a sa propre Map (pas de partage entre régions ni
// entre cold starts) — c'est donc un rate-limit "best-effort" qui bloque les
// abus évidents (boucles, spam d'un même client chaud), pas une garantie
// absolue. Pour une garantie forte, passer par un store partagé
// (Upstash Redis, table Supabase — cf. throttle OTP en base dans
// /api/auth/signup qui, lui, est durable).

type Bucket = number[]; // timestamps (ms) des hits dans la fenêtre

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000; // garde-fou mémoire

/**
 * Retourne `true` si l'appel est autorisé (et le comptabilise),
 * `false` si la limite est atteinte pour cette clé.
 *
 * @param key      clé unique (ex. "signup:ip:1.2.3.4", "signup:email:a@b.c")
 * @param limit    nombre max d'appels dans la fenêtre (ex. 5)
 * @param windowMs taille de la fenêtre glissante en ms (ex. 3 600 000 = 1 h)
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (bucket.length >= limit) {
    store.set(key, bucket);
    return false;
  }

  bucket.push(now);

  // Garde-fou : purge les clés dont la fenêtre est vide si la Map grossit trop.
  if (store.size >= MAX_KEYS && !store.has(key)) {
    for (const [k, b] of store) {
      if (b.every((t) => t <= cutoff)) store.delete(k);
    }
  }

  store.set(key, bucket);
  return true;
}
