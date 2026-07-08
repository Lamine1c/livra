import { NextRequest, NextResponse } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { getAuthenticatedUser } from "@/lib/auth";
import { requireActiveSubscription, SUBSCRIPTION_EXPIRED_ERROR } from "@/lib/billing-guard";

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
    .select("id, otp_code, otp_expires_at, otp_verified_at")
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

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "order_otp_verified",
    properties: { order_id: id },
  });
  await posthog.shutdown();

  return NextResponse.json({ success: true });
}
