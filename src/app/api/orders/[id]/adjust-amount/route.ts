import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendWhatsAppNotification, isOutOfWindow } from "@/lib/whatsapp";
import { TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";

// POST /api/orders/[id]/adjust-amount — [G5W] CHEMIN OFFICIEL de modification du MONTANT COD après
// négociation (« prix arrangé au téléphone »). Porte les règles pour que le mobile n'écrive JAMAIS
// l'argent en direct (la policy RLS `for all using auth.uid()=user_id` reste ouverte — non restreinte
// dans ce lot, décision Lamine — mais ce endpoint est la voie SÛRE que le mobile doit emprunter).
// Auth : JWT vendeur + ownership user_id.
//
// Garde-fous :
//  - BORNÉ aux statuts pré-expédition : shipped+ → le COD est déjà annoncé au transporteur (yalidine/
//    ecotrack) → on REFUSE (409) plutôt que créer un écart COD annoncé/encaissé (même doctrine que G3W).
//  - `original_total_amount` : on préserve le COD tout-premier (coalesce) — compatible G3W (remise winback).
//  - TRACE : chaque avant→après écrit dans order_amount_history (048, best-effort — dégrade si non appliquée).
//  - ACHETEUR prévenu du NOUVEAU montant (texte libre order_amount_updated, FR+AR, session — 0 soumission Meta ;
//    hors fenêtre → rien, il verra le montant à la livraison / le vendeur lui a dit au téléphone).
//
// PÉRIMÈTRE (découpe, cf. RAPPORT) : ce lot = LE MONTANT uniquement. Produit/quantité (order_items →
// recalcul), adresse/téléphone (portés par `clients`, PARTAGÉS entre toutes les commandes du client →
// besoin d'un snapshot par commande), mode de livraison (flux cancel-carrier existant) = tranches suivantes.

export const dynamic = "force-dynamic";

// Statuts où la commande n'est PAS encore partie chez le transporteur (COD encore modifiable sans écart).
const PRE_SHIP_STATUSES = ["pending", "pending_confirmation", "confirmed", "processing"];

const bodySchema = z.object({
  new_amount: z.number().min(0).max(99999999),
  reason: z.string().trim().max(500).optional(),
});

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
  const newAmount = Math.round(parsed.new_amount * 100) / 100; // borne numeric(12,2)

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, user_id, status, total_amount, original_total_amount, client:clients(full_name, phone)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const status = order.status as string | null;
  if (status == null || !PRE_SHIP_STATUSES.includes(status)) {
    // shipped / delivered / cancelled / returned → COD figé côté transporteur : on ne le touche pas.
    return NextResponse.json({ ok: false, reason: "shipped_locked", status }, { status: 409 });
  }

  const oldAmount = Number(order.total_amount ?? 0);
  if (newAmount === oldAmount) {
    return NextResponse.json({ ok: true, changed: false, old_amount: oldAmount, new_amount: newAmount });
  }

  const nowIso = new Date().toISOString();
  const updateFields: Record<string, unknown> = { total_amount: newAmount, updated_at: nowIso };
  // Préserve le COD tout-premier (avant TOUTE modif/remise) : coalesce côté applicatif.
  if (order.original_total_amount == null) updateFields.original_total_amount = oldAmount;

  // UPDATE atomique BORNÉ : le .in("status", PRE_SHIP) re-garde contre une expédition concurrente.
  const { data: rows, error: updErr } = await supabase
    .from("orders")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", PRE_SHIP_STATUSES)
    .select("id");
  if (updErr) return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: false, reason: "shipped_locked" }, { status: 409 });
  }

  // TRACE (best-effort) : dégrade proprement si la migration 048 n'est pas appliquée.
  const { error: traceErr } = await supabase.from("order_amount_history").insert({
    order_id: id,
    old_amount: oldAmount,
    new_amount: newAmount,
    reason: parsed.reason ?? null,
    changed_by: user.id,
  });
  if (traceErr && !/42P01|PGRST205|does not exist|Could not find the table/i.test(`${traceErr.code ?? ""} ${traceErr.message ?? ""}`)) {
    console.error("[orders/adjust-amount] trace order_amount_history échouée:", traceErr.message);
  }

  // Prévenir l'ACHETEUR du nouveau COD (session, texte libre). Hors fenêtre → rien (défensif).
  const client = (Array.isArray(order.client) ? order.client[0] : order.client) as { full_name?: string; phone?: string } | null;
  if (client?.phone) {
    const { data: vendor } = await supabase.from("profiles").select("store_name, full_name").eq("id", order.user_id).maybeSingle();
    const boutique = (vendor?.store_name as string | null) ?? (vendor?.full_name as string | null) ?? "votre vendeur";
    const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
    const priceTxt = new Intl.NumberFormat("en-US").format(Math.round(newAmount));
    const r = await sendWhatsAppNotification(client.phone, renderTemplateText(TEMPLATES.order_amount_updated, [prenom, boutique, priceTxt]));
    if (!r.success && !isOutOfWindow(r.code)) console.error("[orders/adjust-amount] msg acheteur échec:", r.error);
  }

  return NextResponse.json({ ok: true, changed: true, old_amount: oldAmount, new_amount: newAmount });
}
