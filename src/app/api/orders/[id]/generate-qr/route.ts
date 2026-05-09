import { NextRequest, NextResponse } from "next/server";
import { generateQrToken } from "@/lib/qr-token";
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
    .select("id, user_id, delivery_mode")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.delivery_mode === "yalidine") {
    return NextResponse.json({ error: "Mode de livraison déjà défini" }, { status: 400 });
  }

  const qrToken = generateQrToken(order.id, user.id);

  const { error: updateError } = await supabase
    .from("orders")
    .update({ delivery_mode: "moto_perso", qr_token: qrToken })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  return NextResponse.json({ qrToken });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("orders")
    .update({ delivery_mode: null, qr_token: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
