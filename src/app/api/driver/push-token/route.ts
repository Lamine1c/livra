import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";
import { observeBody } from "@/lib/zod-observe";

// Enregistre le token Expo Push du livreur (drivers.expo_push_token).
// Auth : Bearer deviceToken HMAC — même pattern que /api/driver/position.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const result = verifyDriverToken(authHeader.slice(7));
  if (!result.valid) {
    const status = result.expired ? 401 : 403;
    return NextResponse.json(
      { error: result.expired ? "Token expired" : "Invalid token" },
      { status }
    );
  }
  const { driverId } = result;

  let body: { expoPushToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  observeBody("driver/push-token", z.object({ expoPushToken: z.string() }).passthrough(), body);

  const token =
    typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : null;

  // Format Expo attendu : ExponentPushToken[...] (ou ExpoPushToken[...] legacy).
  if (!token || !/^Expo(nent)?PushToken\[.+\]$/.test(token)) {
    return NextResponse.json({ error: "Invalid Expo push token" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("drivers")
    .update({ expo_push_token: token })
    .eq("id", driverId);

  if (error) {
    console.error("[driver/push-token] update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // [N32W.2] Multi-device : upsert dans push_tokens (best-effort, non bloquant). Table absente
  // (migration 043 non appliquée) → ignoré, la colonne unique ci-dessus reste la source (fallback).
  const { error: ptErr } = await supabase
    .from("push_tokens")
    .upsert(
      { owner_type: "driver", owner_id: driverId, token, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    );
  if (ptErr && !/42P01|PGRST205|does not exist|Could not find the table/i.test(`${ptErr.code ?? ""} ${ptErr.message ?? ""}`)) {
    console.error("[driver/push-token] upsert push_tokens:", ptErr.message);
  }

  return NextResponse.json({ ok: true });
}

// [T1-1] Déconnexion livreur → efface le token Expo (drivers.expo_push_token) pour couper les notifs.
// MÊME auth que le POST (Bearer deviceToken HMAC). Body optionnel : accepte { token? } (contrat T1-1)
// ET { expoPushToken? } (cohérent avec le POST) ; si fourni, n'efface que si le token stocké == ce
// token (un autre appareil garde le sien) ; sinon efface le token du livreur authentifié.
// Idempotent → 200 { ok: true }.
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const result = verifyDriverToken(authHeader.slice(7));
  if (!result.valid) {
    const status = result.expired ? 401 : 403;
    return NextResponse.json(
      { error: result.expired ? "Token expired" : "Invalid token" },
      { status }
    );
  }
  const { driverId } = result;

  // Body facultatif : un DELETE peut arriver sans corps.
  let body: { token?: unknown; expoPushToken?: unknown } = {};
  try {
    const raw = await req.text();
    if (raw.trim()) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  observeBody(
    "driver/push-token:DELETE",
    z.object({ token: z.string().optional(), expoPushToken: z.string().optional() }).passthrough(),
    body
  );

  const rawToken = typeof body.token === "string" ? body.token : typeof body.expoPushToken === "string" ? body.expoPushToken : null;
  const token = rawToken ? rawToken.trim() : null;

  const supabase = createServiceClient();

  // Colonne unique (source fallback) : efface uniquement si elle vaut CE token (ou si aucun token fourni).
  let driverUpdate = supabase.from("drivers").update({ expo_push_token: null }).eq("id", driverId);
  if (token) driverUpdate = driverUpdate.eq("expo_push_token", token);
  const { error } = await driverUpdate;
  if (error) {
    console.error("[driver/push-token] DELETE update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Multi-device : retire la ligne de CE token (ou toutes celles du livreur). Table absente → ignoré.
  let del = supabase.from("push_tokens").delete().eq("owner_type", "driver").eq("owner_id", driverId);
  if (token) del = del.eq("token", token);
  const { error: ptErr } = await del;
  if (ptErr && !/42P01|PGRST205|does not exist|Could not find the table/i.test(`${ptErr.code ?? ""} ${ptErr.message ?? ""}`)) {
    console.error("[driver/push-token] DELETE push_tokens:", ptErr.message);
  }

  return NextResponse.json({ ok: true });
}
