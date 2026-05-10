import { NextRequest, NextResponse } from "next/server";
import { generateLocateToken } from "@/lib/qr-token";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const locateToken = generateLocateToken(order.id as string);
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "https://golivra.app";
  const url = `${base}/locate?t=${locateToken}`;

  return NextResponse.json({ url });
}
