import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { requireActiveSubscription, SUBSCRIPTION_EXPIRED_ERROR } from "@/lib/billing-guard";
import { sendTunnelMessage } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  // Trial gate : abonnement expiré → pas de confirmation de commande.
  if (user.email) {
    const gate = await requireActiveSubscription(user.email);
    if (!gate.allowed) {
      return NextResponse.json({ error: SUBSCRIPTION_EXPIRED_ERROR }, { status: 403 });
    }
  }

  const body = await req.json();
  const { code } = body as { code: string };

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, otp_code, otp_expires_at, otp_verified_at, client:clients(phone)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.otp_verified_at) {
    return NextResponse.json({ error: "Commande déjà confirmée" }, { status: 400 });
  }

  if (!order.otp_code || !order.otp_expires_at) {
    return NextResponse.json(
      { error: "Aucun code en cours. Renvoyez un code." },
      { status: 400 }
    );
  }

  if (new Date(order.otp_expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expiré. Renvoyez un nouveau code." }, { status: 400 });
  }

  if (order.otp_code !== code) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      otp_verified_at: now,
      otp_code: null,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  // [N28W.2] Accusé ACHETEUR « commande confirmée ». Le chemin WhatsApp (confirm-order.ts) l'envoie
  // déjà, mais la vérif OTP DIRECTE (le vendeur saisit le code dans l'app) ne le faisait pas → l'acheteur
  // n'était jamais accusé. Même patron `sendTunnelMessage` (copy figée `order_confirmed_verified`, fenêtre
  // 24h → repli template). Best-effort STRICT : un échec d'envoi ne casse PAS la confirmation déjà persistée.
  const client = Array.isArray(order.client) ? order.client[0] : order.client;
  const buyerPhone = (client as { phone?: string } | null)?.phone;
  if (buyerPhone) {
    const r = await sendTunnelMessage(buyerPhone, TEMPLATES.order_confirmed_verified, []);
    if (!r.success) console.error(`[orders/verify-otp] accusé order_confirmed_verified échec order=${id}:`, r.error);
  }

  return NextResponse.json({ success: true });
}
