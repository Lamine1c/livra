import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBuyerToken } from "@/lib/qr-token";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
