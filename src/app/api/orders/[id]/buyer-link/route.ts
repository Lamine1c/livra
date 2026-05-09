import { NextRequest, NextResponse } from "next/server";
import { generateBuyerToken } from "@/lib/qr-token";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, delivery_mode")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const buyerToken = generateBuyerToken(order.id);
  const url = `https://golivra.app/track?t=${buyerToken}`;

  return NextResponse.json({ buyerToken, url });
}
