import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mapping statuts Yalidine → statuts LIVRA
const STATUS_MAP: Record<string, string> = {
  "En attente":           "pending",
  "Expédié":              "shipped",
  "En cours de livraison":"shipped",
  "Sorti en livraison":   "shipped",
  "Livré":                "delivered",
  "Retourné":             "returned",
  "Annulé":               "cancelled",
  "Échec livraison":      "returned",
  "Client absent (échoué)":"returned",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Yalidine Webhook]", JSON.stringify(body));

    // Yalidine envoie : { tracking, status, ... }
    const tracking = body?.tracking ?? body?.id;
    const yalidineStatus = body?.status ?? body?.last_status;

    if (!tracking || !yalidineStatus) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const livraStatus = STATUS_MAP[yalidineStatus];
    if (!livraStatus) {
      // Statut inconnu — on log mais on répond 200 pour éviter les retries
      console.warn("[Yalidine Webhook] Statut inconnu:", yalidineStatus);
      return NextResponse.json({ ok: true, note: "Statut ignoré" });
    }

    const supabase = await createClient();

    // Trouver la commande par tracking_number
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("tracking_number", tracking)
      .single();

    if (fetchError || !order) {
      console.warn("[Yalidine Webhook] Commande introuvable pour tracking:", tracking);
      return NextResponse.json({ ok: true, note: "Commande non trouvée" });
    }

    // Pas de régression de statut (ex: "delivered" → "shipped")
    const STATUS_RANK: Record<string, number> = {
      pending: 0, confirmed: 1, processing: 2,
      shipped: 3, delivered: 4, cancelled: 5, returned: 5,
    };

    const currentRank = STATUS_RANK[order.status] ?? 0;
    const newRank = STATUS_RANK[livraStatus] ?? 0;

    if (newRank <= currentRank && order.status !== "pending") {
      return NextResponse.json({ ok: true, note: "Pas de régression de statut" });
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: livraStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updateError) {
      console.error("[Yalidine Webhook] Erreur update:", updateError);
      return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
    }

    console.log(`[Yalidine Webhook] Commande ${order.id} → ${livraStatus}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[Yalidine Webhook] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
