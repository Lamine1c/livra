import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { requireActiveSubscription, SUBSCRIPTION_EXPIRED_ERROR } from "@/lib/billing-guard";
import { sendOrderConfirmationOtp } from "@/lib/send-order-otp";

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

  // Gardes propres à la route (auth/ownership/cooldown/déjà-confirmée) : fetch réduit aux champs de
  // garde. La génération + l'envoi MSG 1 sont délégués au helper partagé (T1-3) pour n'avoir qu'une
  // seule logique d'envoi, réutilisée par refusal-reply (auto-envoi sur « oui » à l'offre winback).
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, otp_verified_at, otp_sent_at")
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

  const res = await sendOrderConfirmationOtp(supabase, id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }
  return NextResponse.json({ maskedPhone: res.maskedPhone });
}
