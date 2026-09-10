import { z } from "zod";

// LOT 13 · Porte n°1 — validation du payload d'une commande entrante via API.
// Décisions Lamine (3/09) : unit_price OPTIONNEL, wilaya TEXTE LIBRE.

const item = z.object({
  product_name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).default(1),
  unit_price: z.number().min(0).optional(),
});

export const inboundOrderSchema = z.object({
  external_order_id: z.string().min(1).max(128),
  buyer: z.object({
    full_name: z.string().min(1).max(120),
    phone: z.string().min(6).max(20),
    wilaya: z.string().min(1).max(60), // texte libre
    commune: z.string().min(1).max(80),
    address: z.string().max(300).optional(),
    notes: z.string().max(500).optional(),
  }),
  items: z.array(item).min(1).max(50),
  total_amount: z.number().min(0).optional(),
  delivery_fee: z.number().min(0).optional(),
  source_label: z.string().max(120).optional(),
  // ISO datetime — validé via Date.parse (indépendant de la version zod).
  occurred_at: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), { message: "invalid datetime" })
    .optional(),
});

export type InboundOrderInput = z.infer<typeof inboundOrderSchema>;

// Parse strict → soit les données, soit la LISTE des chemins invalides
// (ex. ["buyer.phone", "items.0.product_name"]), sans doublon.
export function parseInboundOrder(
  raw: unknown
): { ok: true; data: InboundOrderInput } | { ok: false; fields: string[] } {
  const r = inboundOrderSchema.safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  const fields = Array.from(
    new Set(r.error.issues.map((i) => i.path.map(String).join(".")).filter(Boolean))
  );
  return { ok: false, fields: fields.length ? fields : ["(root)"] };
}
