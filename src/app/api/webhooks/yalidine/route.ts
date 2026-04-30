import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import crypto from "crypto";

const STATUS_MAP: Record<string, string> = {
  "En attente": "pending",
  "Expedie": "shipped",
  "En cours de livraison": "shipped",
  "Sorti en livraison": "shipped",
  "Livre": "delivered",
  "Retourne": "returned",
  "Annule": "cancelled",
  "Echec livraison": "returned",
  "Client absent (echoue)": "returned",
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
  if (status === "shipped") return `Commande ${reference} prise en charge par Yalidine. Tracking: ${tracking ?? "N/A"}`;
  if (status === "delivered") return `Commande ${reference} livree avec succes ! Pensez a confirmer le paiement recu.`;
  if (status === "returned") return `Echec de livraison pour la commande ${reference}. Le colis est en cours de retour.`;
  return null;
}

function clientMessage(status: string, tracking: string | null, shopName: string): string | null {
  if (status === "shipped") return `Votre commande est en route ! Tracking Yalidine: ${tracking ?? "N/A"}`;
  if (status === "delivered") return `Votre commande a ete livree. Merci pour votre confiance ! - ${shopName} via LIVRA`;
  if (status === "returned") return `Notre livreur n a pas pu vous joindre. Contactez ${shopName} pour reprogrammer.`;
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subscribe = searchParams.get("subscribe");
  const crcToken = searchParams.get("crc_token");

  if (subscribe !== null && crcToken) {
    return new Response(crcToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return Response.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.YALIDINE_WEBHOOK_SECRET;

    if (secret) {
      const signature = req.headers.get("x-yalidine-signature") ?? "";
      if (!verifySignature(rawBody, signature, secret!)) {
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
      return NextResponse.json({ ok: true, note: "Statut ignore" });
    }

    const supabase = createServiceClient();

    // Query 1: order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, reference, tracking_number, user_id, client_id")
      .eq("tracking_number", tracking)
      .single();

    if (orderErr || !order) {
      console.warn("[Webhook] Order not found", { tracking, error: orderErr });
      return NextResponse.json({ ok: true, note: "Commande non trouvee", debug: orderErr });
    }

    // Pas de regression de statut
    const currentRank = STATUS_RANK[order.status] ?? 0;
    const newRank = STATUS_RANK[livraStatus] ?? 0;
    if (newRank <= currentRank && order.status !== "pending") {
      return NextResponse.json({ ok: true, note: "Pas de regression" });
    }

    // Update status
    await supabase
      .from("orders")
      .update({ status: livraStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    // Query 2: profile (vendor)
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, store_name")
      .eq("id", order.user_id)
      .single();

    // Query 3: client (buyer)
    const { data: client } = await supabase
      .from("clients")
      .select("phone")
      .eq("id", order.client_id)
      .single();

    const shopName = profile?.store_name ?? "LIVRA";
    const vMsg = vendorMessage(livraStatus, order.reference, order.tracking_number);
    const cMsg = clientMessage(livraStatus, order.tracking_number, shopName);

    if (profile?.phone && vMsg) {
      await sendWhatsAppNotification(profile.phone, vMsg);
    }
    if (client?.phone && cMsg) {
      await sendWhatsAppNotification(client.phone, cMsg);
    }

    return NextResponse.json({
      ok: true,
      status: livraStatus,
      vendor_notified: !!profile?.phone,
      client_notified: !!client?.phone,
    });

  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Erreur serveur", detail: String(err) }, { status: 500 });
  }
}
