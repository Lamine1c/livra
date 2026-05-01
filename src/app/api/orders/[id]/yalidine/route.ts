import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createYalidineParcel } from "@/lib/yalidine";
import { Order } from "@/types";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, client:clients(*), items:order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.tracking_number) {
    return NextResponse.json({ error: "Un bon Yalidine existe déjà pour cette commande." }, { status: 400 });
  }

  // Lire les credentials depuis le profil du vendeur
  const { data: profile } = await supabase
    .from("profiles")
    .select("yalidine_api_id, yalidine_api_token")
    .eq("id", user.id)
    .single();

  if (!profile?.yalidine_api_id || !profile?.yalidine_api_token) {
    return NextResponse.json(
      { error: "Credentials Yalidine non configurés. Rendez-vous dans Paramètres pour les ajouter." },
      { status: 400 }
    );
  }

  let tracking: string;
  try {
    const result = await createYalidineParcel(order as Order, {
      centerId: profile.yalidine_api_id,
      token: profile.yalidine_api_token,
    });
    tracking = result.tracking;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Yalidine inconnue";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ tracking_number: tracking, status: "shipped", updated_at: now })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Tracking créé mais erreur de sauvegarde." }, { status: 500 });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "yalidine_parcel_created",
    properties: {
      order_id: id,
      tracking_number: tracking,
      total_amount: order.total_amount,
    },
  });
  await posthog.shutdown();

  return NextResponse.json({ tracking });
}
