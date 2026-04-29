import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
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
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function vendorMessage(status: string, reference: string, tracking: string | null): string | null {
  if (status === "shipped") {
    return `🚚 Commande ${reference} prise en charge par Yalidine.\nNuméro de suivi : ${tracking ?? "N/A"}\nSuivez sur : yalidine.app`;
  }
  if (status === "delivered") {
    return `✅ Commande ${reference} livrée avec succès !\nPensez à confirmer le paiement reçu.`;
  }
  if (status === "returned") {
    return `⚠️ Échec de livraison pour la commande ${reference}.\nLe colis est en cours de retour. Connectez-vous à LIVRA pour plus de détails.`;
  }
  return null;
}

function clientMessage(status: string, tracking: string | null, shopName: string): string | null {
  if (status === "shipped") {
    return `🚚 Votre commande est en route !\nNuméro de suivi Yalidine : ${tracking ?? "N/A"}\nSuivez votre colis sur : yalidine.app/?tracking=${tracking ?? ""}`;
  }
  if (status === "delivered") {
    return `✅ Votre commande a été livrée. Merci pour votre confiance !\n— ${shopName} via LIVRA 🛡️`;
  }
  if (status === "returned") {
    return `⚠️ Notre livreur n'a pas pu vous joindre aujourd'hui.\nContactez ${shopName} pour reprogrammer la livraison.`;
  }
  return null;
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
    const tracking = body?.tracking ?? body?.id;
    const yalidineStatus = body?.status ?? body?.last_status;

    if (!tracking || !yalidineStatus) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const livraStatus = STATUS_MAP[yalidineStatus];
    if (!livraStatus) {
      return NextResponse.json({ ok: true, note: "Statut ignoré" });
    }

    const supabase = await createClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, reference, tracking_number, user_id, client:clients(phone), profiles:profiles(phone, store_name)")
      .eq("tracking_number", tracking)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ ok: true, note: "Commande non trouvée" });
    }

    const currentRank = STATUS_RANK[order.status] ?? 0;
    const newRank = STATUS_RANK[livraStatus] ?? 0;

    if (newRank <= currentRank && order.status !== "pending") {
      return NextResponse.json({ ok: true, note: "Pas de régression" });
    }

    // Mettre à jour le statut
    await supabase
      .from("orders")
      .update({ status: livraStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    // Notifications WhatsApp
    const clientRaw = Array.isArray(order.client) ? order.client[0] : order.client;
    const profileRaw = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    const shopName = (profileRaw as { store_name?: string })?.store_name ?? "LIVRA";
    const vendorPhone = (profileRaw as { phone?: string })?.phone;
    const clientPhone = (clientRaw as { phone?: string })?.phone;

    const vMsg = vendorMessage(livraStatus, order.reference, order.tracking_number);
    const cMsg = clientMessage(livraStatus, order.tracking_number, shopName);

    if (vendorPhone && vMsg) {
      await sendWhatsAppNotification(vendorPhone, vMsg);
    }

    if (clientPhone && cMsg) {
      await sendWhatsAppNotification(clientPhone, cMsg);
    }

    console.log(`[Yalidine Webhook] ${order.id} → ${livraStatus}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[Yalidine Webhook] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
