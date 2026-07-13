import { NextRequest, NextResponse } from "next/server";
import { generateOTP, sendWhatsAppTemplate, normalizePhoneNumber } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";
import { getAuthenticatedUser } from "@/lib/auth";
import { requireActiveSubscription, SUBSCRIPTION_EXPIRED_ERROR } from "@/lib/billing-guard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  // Trial gate : abonnement expiré → pas d'envoi de confirmation WhatsApp.
  if (user.email) {
    const gate = await requireActiveSubscription(user.email);
    if (!gate.allowed) {
      return NextResponse.json({ error: SUBSCRIPTION_EXPIRED_ERROR }, { status: 403 });
    }
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, status, otp_verified_at, otp_sent_at, otp_code, otp_expires_at, total_amount, client:clients(full_name, phone), items:order_items(product_name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.otp_verified_at) {
    return NextResponse.json({ error: "Commande déjà confirmée" }, { status: 400 });
  }

  // Cooldown 60 secondes entre chaque envoi OTP
  if (order.otp_sent_at) {
    const sentAt = new Date(order.otp_sent_at).getTime();
    const elapsed = Date.now() - sentAt;
    if (elapsed < 60_000) {
      const wait = Math.ceil((60_000 - elapsed) / 1000);
      return NextResponse.json(
        { error: `Attendez ${wait} secondes avant de renvoyer.` },
        { status: 429 }
      );
    }
  }

  const clientRaw = order.client;
  const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as
    | { full_name: string; phone: string }
    | null
    | undefined;

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
  }

  // Idempotence : si un code ACTIF (non expiré, non encore vérifié) existe déjà
  // pour cette commande, on le RÉUTILISE au lieu d'en régénérer un — sinon un
  // renvoi (ou un double-clic / retry) invaliderait le code que le client a
  // peut-être déjà reçu. On ne prolonge pas l'expiration d'un code réutilisé.
  const nowMs = Date.now();
  const activeCode =
    order.otp_code && order.otp_expires_at && new Date(order.otp_expires_at).getTime() > nowMs
      ? order.otp_code
      : null;
  const otp = activeCode ?? generateOTP();
  const expiresAt =
    activeCode && order.otp_expires_at
      ? order.otp_expires_at
      : new Date(nowMs + 10 * 60 * 1000).toISOString();
  const sentAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({ otp_code: otp, otp_expires_at: expiresAt, otp_sent_at: sentAt })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  // Contexte du message V1 : boutique (profil vendeur) + total + produit (optionnel).
  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id)
    .single();
  const boutique = vendor?.store_name ?? vendor?.full_name ?? "votre vendeur";

  const itemsRaw = (order as { items?: unknown }).items;
  const items = (Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : []) as { product_name: string }[];
  const produit = items[0]?.product_name ?? null;

  // MSG 1 — Confirmation de commande (OUI/NON), bilingue AR+FR.
  // L'OTP reste généré + stocké en DB ci-dessus ; le code part ensuite via MSG 2
  // (order_otp_code) quand le client répond OUI (géré côté webhook inbound).
  const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
  // en-US (virgule, "3,300") et PAS fr-FR : fr-FR insère un espace insécable étroit
  // U+202F qui casse le wrap LTR ‪‬ de la ligne arabe (le bidi ré-ordonne).
  const totalTxt = new Intl.NumberFormat("en-US").format(Math.round(order.total_amount));
  const produitTxt = produit ?? "";

  // MSG 1 = TEMPLATE approuvé order_confirmation_request. Business-initiated,
  // hors fenêtre 24h → DOIT partir en template (le texte libre serait rejeté).
  const result = await sendWhatsAppTemplate(client.phone, TEMPLATES.order_confirmation_request, [
    prenom,
    boutique,
    produitTxt,
    totalTxt,
  ]);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Échec envoi WhatsApp" },
      { status: 502 }
    );
  }

  // maskedPhone : calculé localement pour garder la même API de retour.
  const normalized = normalizePhoneNumber(client.phone);
  const masked = "+" + normalized.slice(0, 5) + "XXXXX" + normalized.slice(-2);

  return NextResponse.json({ maskedPhone: masked });
}
