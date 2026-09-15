import { z } from "zod";

// LOT 13 · Porte n°0 — bouts PARTAGÉS entre POST (création), DELETE (révocation) et
// PATCH (changement de domaine) de /api/vendor/inbound-sources. Extrait pour éviter la
// duplication de la validation de domaine et de la construction d'adresse (DRY).

// L'adresse de réception (035_inbound_sources.email_slug est l'identité de la porte email).
export const ORDERS_DOMAIN = "orders.golivra.app";

export function addressOf(slug: string): string {
  return `${slug}@${ORDERS_DOMAIN}`;
}

// ─── Validation du domaine expéditeur ────────────────────────────────────────
// Domaine nu, lowercase, ≥1 point, TLD alphabétique ≥2 (donc PAS une IP), sans
// schéma/chemin/port/@ (rejetés par le regex : ni « / » ni « : » ni « @ » admis).
// Sous-domaines autorisés (ex. mail.boutique-dz.com) — l'expéditeur peut en être un.
export const DOMAIN_RE =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export const domainBodySchema = z.object({
  expected_sender_domain: z
    .string()
    .trim()
    .toLowerCase()
    .refine((s) => DOMAIN_RE.test(s), { message: "invalid domain" }),
});

// Liste des chemins invalides d'un safeParse raté (sans doublon), défaut = le champ domaine.
export function domainValidationFields(error: z.ZodError): string[] {
  const fields = Array.from(
    new Set(error.issues.map((i) => i.path.map(String).join(".")).filter(Boolean))
  );
  return fields.length ? fields : ["expected_sender_domain"];
}
