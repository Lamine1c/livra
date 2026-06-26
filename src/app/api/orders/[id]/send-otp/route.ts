import { NextRequest, NextResponse } from "next/server";
import { generateOTP, sendWhatsAppNotification, normalizePhoneNumber } from "@/lib/whatsapp";
import { TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, status, otp_verified_at, otp_sent_at, total_amount, client:clients(full_name, phone), items:order_items(product_name)")
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

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
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
  const totalTxt = new Intl.NumberFormat("fr-FR").format(Math.round(order.total_amount));
  const produitTxt = produit ?? "";

  const message = renderTemplateText(TEMPLATES.order_confirmation_request, [
    prenom,
    boutique,
    produitTxt,
    totalTxt,
  ]);

  const result = await sendWhatsAppNotification(client.phone, message);

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
