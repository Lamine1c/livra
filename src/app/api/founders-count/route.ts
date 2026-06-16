import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://golivra.app",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  console.log("[founders-count] Received request");
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.rpc("get_founders_count");

  if (error) {
    console.log("[founders-count] RPC error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const count = Number(data);
  console.log("[founders-count] Count:", count);

  return NextResponse.json(
    { count, max: 100 },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
