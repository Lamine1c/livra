import type { ZodTypeAny } from "zod";

// ─── [N43W] Zod en MODE OBSERVATION (log-only, ZÉRO rejet) ────────────────────
// Valide le corps entrant contre un schéma SANS jamais changer le comportement : si invalide,
// on `console.warn` les issues et la route continue exactement comme avant. Aucun 422 nouveau,
// aucune réponse modifiée. Objectif : mesurer en prod ce que les schémas rejetteraient AVANT de
// durcir (rejet) dans un lot ultérieur. Les schémas sont en `.passthrough()` (on ne connaît pas
// encore tous les champs réels) et fidèles à l'usage du handler.
export function observeBody(route: string, schema: ZodTypeAny, body: unknown): void {
  const r = schema.safeParse(body);
  if (!r.success) {
    console.warn(`[zod-observe] ${route}:`, r.error.issues);
  }
}
