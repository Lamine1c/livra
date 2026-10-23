import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendWhatsAppNotification, isOutOfWindow } from "@/lib/whatsapp";
import { TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";

// POST /api/orders/[id]/adjust-items — [G7W-S2] modifier le CONTENU (produit/quantité) d'une commande
// après négociation, avec RECALCUL cohérent du COD. Tranche S2 de la découpe G5W.
// Auth : JWT vendeur + ownership. Le contenu et le montant restent COHÉRENTS (sinon étiquette/bon/COD
// racontent 3 histoires) : le total est recalculé = Σ(quantity×unit_price) — c'est le contenu qui fait foi.
//
// ATOMICITÉ : tout passe par la fonction SQL `modify_order_content` (migration 049) = UNE transaction
// (lignes + total + trace) → jamais de demi-écriture. La fonction porte AUSSI les gardes (pré-expédition,
// pas d'étiquette générée) sous verrou FOR UPDATE. Tant que 049 n'est pas appliquée → 503 propre.
//
// PÉRIMÈTRE : contenu + montant uniquement. Adresse/téléphone (S3), RLS (S4) = hors lot.

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  product_name: z.string().trim().min(1).max(300),
  quantity: z.number().int().min(1).max(100000),
  unit_price: z.number().min(0).max(99999999),
});
const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
  reason: z.string().trim().max(500).optional(),
});

const ABSENT_RE = /PGRST202|42883|function .* does not exist|Could not find the function/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 422 });
  }

  // [HOTFIX 23/10] OWNERSHIP. getAuthenticatedUser renvoie le client SERVICE (RLS off) : la RPC
  // modify_order_content ne filtre que par id → sans ce check, n'importe quel compte pouvait réécrire
  // le contenu et le COD de la commande d'un autre vendeur. On vérifie AVANT tout appel.
  const { data: owned, error: ownErr } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownErr) return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  if (!owned) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  // Appel ATOMIQUE de la fonction (RLS du vendeur → ownership + verrou + gardes dans la même transaction).
  const { data, error } = await supabase.rpc("modify_order_content", {
    p_order_id: id,
    p_items: parsed.items,
    p_reason: parsed.reason ?? null,
  });

  if (error) {
    if (ABSENT_RE.test(`${error.code ?? ""} ${error.message ?? ""}`)) {
      return NextResponse.json({ error: "Fonction indisponible (migration 049 non appliquée)" }, { status: 503 });
    }
    console.error("[orders/adjust-items] rpc modify_order_content échouée:", error.message);
    return NextResponse.json({ error: "Erreur base de données", detail: error.message }, { status: 500 });
  }

  const result = (data ?? {}) as { ok?: boolean; reason?: string; status?: string; old_total?: number; new_total?: number };
  if (!result.ok) {
    const map: Record<string, number> = { not_found: 404, shipped_locked: 409, label_generated: 409, empty_items: 422 };
    return NextResponse.json({ ok: false, reason: result.reason, status: result.status }, { status: map[result.reason ?? ""] ?? 400 });
  }

  // Prévenir l'ACHETEUR du NOUVEAU MONTANT (le contenu a été convenu au téléphone ; le COD est l'info
  // actionnable à la livraison). Texte libre réutilisé (order_amount_updated), session, 0 soumission Meta.
  const { data: order } = await supabase
    .from("orders")
    .select("user_id, client:clients(full_name, phone)")
    .eq("id", id)
    .maybeSingle();
  const client = (Array.isArray(order?.client) ? order?.client[0] : order?.client) as { full_name?: string; phone?: string } | null;
  if (client?.phone && order?.user_id) {
    const { data: vendor } = await supabase.from("profiles").select("store_name, full_name").eq("id", order.user_id).maybeSingle();
    const boutique = (vendor?.store_name as string | null) ?? (vendor?.full_name as string | null) ?? "votre vendeur";
    const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
    const priceTxt = new Intl.NumberFormat("en-US").format(Math.round(Number(result.new_total ?? 0)));
    const r = await sendWhatsAppNotification(client.phone, renderTemplateText(TEMPLATES.order_amount_updated, [prenom, boutique, priceTxt]));
    if (!r.success && !isOutOfWindow(r.code)) console.error("[orders/adjust-items] msg acheteur échec:", r.error);
  }

  return NextResponse.json({ ok: true, old_total: result.old_total, new_total: result.new_total });
}
