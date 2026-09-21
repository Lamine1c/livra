import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendWhatsAppTemplate, sendWhatsAppInteractiveButtons, isOutOfWindow } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";

// POST /api/orders/[id]/decision — [N49W] DÉCISION VENDEUR APRÈS REFUS ACHETEUR.
// Règle mère (Lamine 21/09) : après un refus, le système n'envoie plus rien tout seul et n'annule
// plus tout seul (N45W a retiré l'annulation auto). Le vendeur est notifié, il CHOISIT, et SA décision
// déclenche le message WhatsApp. CET endpoint EST le déclencheur (sendWinbackOffer n'est appelé nulle part).
// Auth : JWT vendeur + ownership user_id (client RLS). Idempotence : 1 seul ENVOI par commande (winback_sent_at).
//
// Motifs / actions :
//  - `found_cheaper` → action "offer" : envoie order_winback_offer (TEMPLATE approuvé, 4 var, ZÉRO
//    resoumission Meta). {{3}}=offre (« -10% »/« -15% », choix vendeur), {{4}}=date limite (validity_days).
//    Un template délivre EN ET HORS fenêtre 24h → toujours envoyé.
//  - `not_available` → action "slots" : 3 boutons INTERACTIFS (Demain/Après-demain/Contactez) via
//    sendWhatsAppInteractiveButtons (message de SESSION). HORS FENÊTRE 24h → on N'ENVOIE RIEN et AUCUN
//    repli template (décision Lamine) : on répond `{ok:false, reason:"out_of_window"}` → le mobile invite
//    à rappeler l'acheteur. ⚠️ La fenêtre fermée n'est connue qu'APRÈS l'échec Meta (isOutOfWindow), pas avant.
//  - "cancel" → status="cancelled" (le vendeur clôt lui-même).

export const dynamic = "force-dynamic";

// Date DD-MM-YYYY au fuseau Algérie (UTC+1, pas de DST).
function formatDzDate(ms: number): string {
  const d = new Date(ms + 60 * 60 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

const bodySchema = z.object({
  action: z.enum(["offer", "slots", "cancel"]),
  discount_rate: z.number().int().min(1).max(90).optional(),
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
  const { action, discount_rate } = parsed;

  // Ownership : la commande doit appartenir au vendeur authentifié (client RLS).
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, user_id, reference, decline_reason, winback_sent_at, client:clients(full_name, phone)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const reason = order.decline_reason as string | null;
  const client = (Array.isArray(order.client) ? order.client[0] : order.client) as
    | { full_name?: string; phone?: string }
    | null;
  const nowIso = new Date().toISOString();

  // ─── ANNULER : le vendeur clôt lui-même ───
  if (action === "cancel") {
    const { error } = await supabase.from("orders").update({ status: "cancelled", updated_at: nowIso }).eq("id", id);
    if (error) return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    return NextResponse.json({ ok: true, decision: "cancelled" });
  }

  // Envoi (offer/slots) : téléphone acheteur requis + idempotence (1 envoi max par commande).
  if (!client?.phone) return NextResponse.json({ error: "Client sans téléphone" }, { status: 400 });
  if (order.winback_sent_at) return NextResponse.json({ ok: false, reason: "already_sent" }, { status: 409 });

  // Marque l'ENVOI (idempotence) — appelée après un envoi réussi, garde .is(null) contre les races.
  const markSent = () => supabase.from("orders").update({ winback_sent_at: nowIso }).eq("id", id).is("winback_sent_at", null);

  // ─── OFFER (found_cheaper) → order_winback_offer (template, délivre in/out fenêtre) ───
  if (action === "offer") {
    if (reason !== "found_cheaper") return NextResponse.json({ error: "Action incohérente avec le motif de refus" }, { status: 409 });

    // Défauts pré-remplis du vendeur (prepared_responses) ; le body peut écraser le taux.
    const { data: pr } = await supabase
      .from("prepared_responses")
      .select("discount_rate, validity_days")
      .eq("user_id", order.user_id)
      .eq("trigger_reason", "found_cheaper")
      .eq("active", true)
      .maybeSingle();
    const rate = discount_rate ?? (pr?.discount_rate as number | null | undefined) ?? null;
    if (rate == null) return NextResponse.json({ error: "Taux de remise manquant" }, { status: 400 });
    const dateLimite = formatDzDate(Date.now() + ((pr?.validity_days as number | null | undefined) ?? 3) * 24 * 60 * 60 * 1000);

    const { data: vendor } = await supabase.from("profiles").select("store_name, full_name").eq("id", order.user_id).maybeSingle();
    const boutique = vendor?.store_name ?? vendor?.full_name ?? "votre vendeur";
    const prenom = (client.full_name ?? "").split(" ")[0] ?? "";

    const r = await sendWhatsAppTemplate(client.phone, TEMPLATES.order_winback_offer, [prenom, boutique, `-${rate}%`, dateLimite]);
    if (!r.success) {
      console.error(`[orders/decision] offer send échec order=${id}:`, r.error);
      return NextResponse.json({ error: "Échec envoi WhatsApp", detail: r.error }, { status: 502 });
    }
    await markSent();
    return NextResponse.json({ ok: true, decision: "offer_sent", offer: `-${rate}%`, deadline: dateLimite });
  }

  // ─── SLOTS (not_available) → 3 boutons interactifs (session, in-window uniquement) ───
  if (action === "slots") {
    if (reason !== "not_available") return NextResponse.json({ error: "Action incohérente avec le motif de refus" }, { status: 409 });

    const r = await sendWhatsAppInteractiveButtons(client.phone, TEMPLATES.order_reschedule_slots, []);
    if (!r.success) {
      // Fenêtre fermée → RIEN, pas de repli template (Lamine). On ne marque PAS → le vendeur pourra
      // réessayer quand l'acheteur réécrira (fenêtre rouverte).
      if (isOutOfWindow(r.code)) return NextResponse.json({ ok: false, reason: "out_of_window" }, { status: 409 });
      console.error(`[orders/decision] slots send échec order=${id}:`, r.error);
      return NextResponse.json({ error: "Échec envoi WhatsApp", detail: r.error }, { status: 502 });
    }
    await markSent();
    return NextResponse.json({ ok: true, decision: "slots_sent" });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
