import { z } from "zod";
import { inboundOrderSchema, type InboundOrderInput } from "./schema";

// LOT 13 · Porte n°0 (email catch-all) — extraction d'une commande depuis le CORPS d'un
// email, via un appel DIRECT à l'API Anthropic (pas de SDK, aucune nouvelle dépendance).
//
// DOCTRINE PII : on parse, on jette. Le corps de l'email n'est JAMAIS logué ni persisté ;
// seul le payload structuré (validé par la porte 1) repart vers createInboundOrder.
//
// DÉCISIONS Lamine (3/09) : commande créée même incomplète SAUF téléphone illisible
// (→ parse_failed). confidence < 0.6 ou champs manquants → payload quand même, avec une
// note « à compléter » propagée dans buyer.notes.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;
const PLACEHOLDER = "À compléter";
const WARN_NOTE = "⚠️ à compléter — email partiellement lu";
const CONFIDENCE_FLOOR = 0.6;

// Prompt VERSIONNÉ (constante) — toute évolution = nouvelle version explicite.
export const PARSER_PROMPT_V1 = `Tu es un extracteur de commandes e-commerce pour l'Algérie. On te donne le SUJET et le CORPS d'un email de notification de commande (français, arabe, ou darija algérienne). Tu renvoies UNIQUEMENT un objet JSON valide, sans texte autour, sans balises markdown.

Schéma de sortie (n'invente jamais une valeur ; mets null si l'info est absente ou illisible) :
{
  "external_order_id": string|null,   // n° de commande de la boutique s'il figure (ex: "CMD-1043", "#1043")
  "buyer": {
    "full_name": string|null,
    "phone": string|null,             // numéro de l'acheteur, chiffres uniquement si possible
    "wilaya": string|null,            // wilaya / province de livraison
    "commune": string|null,           // commune / ville de livraison
    "address": string|null,           // adresse détaillée si présente
    "notes": string|null              // instructions de livraison éventuelles
  },
  "items": [ { "product_name": string, "quantity": number, "unit_price": number|null } ],
  "total_amount": number|null,        // montant total en DZD si indiqué
  "delivery_fee": number|null,        // frais de livraison en DZD si indiqués
  "confidence": number                // 0 à 1 : ta confiance globale dans l'extraction
}

Règles :
- Le TÉLÉPHONE est critique. Extrais-le tel qu'écrit (garde les chiffres). Si aucun numéro n'est présent ou s'il est manifestement illisible/incomplet, mets phone=null.
- Si un champ manque, mets null (ne devine pas). Ne mets JAMAIS de fausse wilaya/commune.
- items : au moins le nom du produit. quantity par défaut = 1. Si aucun article identifiable, renvoie [].
- Montants : nombres seulement (retire « DA », « DZD », espaces). Pas de séparateur de milliers dans le JSON.
- darija : « ولاية »=wilaya, « بلدية »=commune, « الهاتف/الرقم »=phone, « الاسم »=nom.

Exemples de fragments → extraction :
- « Nouvelle commande #1043 — Amine Belkacem, 0661 23 45 67, Alger / Bab Ezzouar » → external_order_id:"1043", full_name:"Amine Belkacem", phone:"0661234567", wilaya:"Alger", commune:"Bab Ezzouar".
- « الزبون: كريم — الهاتف 0555112233 — ولاية وهران بلدية بئر الجير » → full_name:"كريم", phone:"0555112233", wilaya:"وهران", commune:"بئر الجير".
- « commande reçue, on te rappelle » (aucun détail) → tous les champs null, items:[], confidence proche de 0.`;

// Payload renvoyé = payload porte 1 SANS external_order_id : la route email l'assigne
// (n° extrait sinon sha256(message_id)).
export type EmailOrderPayload = Omit<InboundOrderInput, "external_order_id"> & {
  external_order_id?: string;
};

export type ParseOrderResult =
  | { payload: EmailOrderPayload; confidence: number }
  | { error: "parse_failed" };

// Extraction brute du LLM — permissive (tout peut être null/absent). On normalise ensuite.
const llmSchema = z.object({
  external_order_id: z.string().nullish(),
  buyer: z
    .object({
      full_name: z.string().nullish(),
      phone: z.string().nullish(),
      wilaya: z.string().nullish(),
      commune: z.string().nullish(),
      address: z.string().nullish(),
      notes: z.string().nullish(),
    })
    .nullish(),
  items: z
    .array(
      z.object({
        product_name: z.string().nullish(),
        quantity: z.number().nullish(),
        unit_price: z.number().nullish(),
      })
    )
    .nullish(),
  total_amount: z.number().nullish(),
  delivery_fee: z.number().nullish(),
  confidence: z.number().nullish(),
});

// Payload de sortie = shapes porte 1, external_order_id rendu optionnel (assigné par la route).
const emailPayloadSchema = inboundOrderSchema.extend({
  external_order_id: z.string().min(1).max(128).optional(),
});

function clean(v: string | null | undefined): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function posNum(v: number | null | undefined): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;
}

/**
 * Extrait une commande depuis le corps + sujet d'un email.
 * Retour : { payload, confidence } ou { error:"parse_failed" } (téléphone illisible,
 * clé absente, appel/JSON invalide). Ne logue JAMAIS le contenu de l'email.
 */
export async function parseOrderEmail(text: string, subject: string): Promise<ParseOrderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[email-parser] ANTHROPIC_API_KEY manquant — parsing impossible");
    return { error: "parse_failed" };
  }

  const userContent = `SUJET: ${subject ?? ""}\n\nCORPS:\n${text ?? ""}`.slice(0, 24_000);

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: PARSER_PROMPT_V1,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (e) {
    console.error("[email-parser] appel Anthropic échoué:", e instanceof Error ? e.message : "?");
    return { error: "parse_failed" };
  }

  if (!res.ok) {
    console.error(`[email-parser] Anthropic HTTP ${res.status}`);
    return { error: "parse_failed" };
  }

  let raw: string;
  try {
    const json = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const block = json.content?.find((b) => b?.type === "text");
    raw = block?.text ?? "";
  } catch {
    console.error("[email-parser] réponse Anthropic non-JSON");
    return { error: "parse_failed" };
  }

  // Isole le premier objet JSON (le modèle peut entourer de texte malgré la consigne).
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { error: "parse_failed" };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { error: "parse_failed" };
  }

  const llm = llmSchema.safeParse(parsedJson);
  if (!llm.success) return { error: "parse_failed" };
  const out = llm.data;
  const buyer = out.buyer ?? {};

  // TÉLÉPHONE = champ critique. Illisible/absent → parse_failed (décision Lamine).
  const phoneRaw = clean(buyer.phone);
  const phoneDigits = (phoneRaw ?? "").replace(/\D/g, "");
  if (!phoneRaw || phoneDigits.length < 6) return { error: "parse_failed" };
  const phone = phoneRaw.slice(0, 20);

  // Items : garde ceux avec un nom ; sinon un article placeholder.
  const rawItems = (out.items ?? [])
    .map((it) => {
      const name = clean(it?.product_name);
      if (!name) return null;
      const q = typeof it?.quantity === "number" && it.quantity >= 1 ? Math.floor(it.quantity) : 1;
      return { product_name: name.slice(0, 200), quantity: q, unit_price: posNum(it?.unit_price) };
    })
    .filter((x): x is { product_name: string; quantity: number; unit_price: number | undefined } => x !== null);
  const items = rawItems.length
    ? rawItems
    : [{ product_name: PLACEHOLDER, quantity: 1, unit_price: undefined }];

  const fullName = clean(buyer.full_name);
  const wilaya = clean(buyer.wilaya);
  const commune = clean(buyer.commune);

  const confidence = Math.min(1, Math.max(0, out.confidence ?? 0));
  const incomplete = !fullName || !wilaya || !commune || rawItems.length === 0;

  // Note « à compléter » propagée si champs manquants OU confiance faible.
  let notes = clean(buyer.notes) ?? "";
  if (incomplete || confidence < CONFIDENCE_FLOOR) {
    notes = notes ? `${WARN_NOTE} · ${notes}` : WARN_NOTE;
  }

  const candidate = {
    external_order_id: clean(out.external_order_id)?.slice(0, 128),
    buyer: {
      full_name: (fullName ?? PLACEHOLDER).slice(0, 120),
      phone,
      wilaya: (wilaya ?? PLACEHOLDER).slice(0, 60),
      commune: (commune ?? PLACEHOLDER).slice(0, 80),
      address: clean(buyer.address)?.slice(0, 300),
      notes: notes ? notes.slice(0, 500) : undefined,
    },
    items,
    total_amount: posNum(out.total_amount),
    delivery_fee: posNum(out.delivery_fee),
  };

  const validated = emailPayloadSchema.safeParse(candidate);
  if (!validated.success) {
    // Ne devrait pas arriver (placeholders posés) ; ne logue AUCUN champ (PII).
    console.error("[email-parser] payload post-normalisation invalide");
    return { error: "parse_failed" };
  }

  return { payload: validated.data, confidence };
}
