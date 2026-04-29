import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const STATUS_MAP: Record<string, string> = {
  "En attente":              "pending",
  "Expédié":                 "shipped",
  "En cours de livraison":   "shipped",
  "Sorti en livraison":      "shipped",
  "Livré":                   "delivered",
  "Retourné":                "returned",
  "Annulé":                  "cancelled",
  "Échec livraison":         "returned",
  "Client absent (échoué)":  "returned",
};

const STATUS_RANK: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2,
  shipped: 3, delivered: 4, cancelled: 5, returned: 5,
};

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.YALIDINE_WEBHOOK_SECRET;

    if (secret) {
      const signature = req.headers.get("x-yalidine-signature") ?? "";
      if (!verifySignature(rawBody, signature, secret)) {
        console.warn("[Yalidine Webhook] Signature invalide");
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    console.log("[Yalidine Webhook]", JSON.stringify(body));

    const tracking = body?.tracking ?? body?.id;
    const yalidineStatus = body?.status ?? body?.last_status;

    if (!tracking || !yalidineStatus) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const livraStatus = STATUS_MAP[yalidineStatus];
    if (!livraStatus) {
      console.warn("[Yalidine Webhook] Statut inconnu:", yalidineStatus);
      return NextResponse.json({ ok: true, note: "Statut ignoré" });
    }

    const supabase = await createClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("tracking_number", tracking)
      .single();

    if (fetchError || !order) {
      console.warn("[Yalidine Webhook] Commande introuvable:", tracking);
      return NextResponse.json({ ok: true, note: "Commande non trouvée" });
    }

    const currentRank = STATUS_RANK[order.status] ?? 0;
    const newRank = STATUS_RANK[livraStatus] ?? 0;

    if (newRank <= currentRank && order.status !== "pending") {
      return NextResponse.json({ ok: true, note: "Pas de régression" });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: livraStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json({ error: "Erreur update" }, { status: 500 });
    }

    console.log(`[Yalidine Webhook] ${order.id} → ${livraStatus}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[Yalidine Webhook] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
