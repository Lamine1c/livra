import crypto from "crypto";

const GRAPH_API = "https://graph.facebook.com/v23.0";

export async function graphFetch(
  path: string,
  params?: Record<string, string>,
  method: "GET" | "POST" | "DELETE" = "GET"
): Promise<{ data: unknown; ok: boolean; status: number }> {
  const url = new URL(`${GRAPH_API}/${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), { method, cache: "no-store" });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { data, ok: res.ok, status: res.status };
}

export async function exchangeShortToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; token_type: string }> {
  const res = await graphFetch("oauth/access_token", {
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(res.data)}`);
  return res.data as { access_token: string; token_type: string };
}

// PKCE variant — used by the mobile OAuth flow (expo-auth-session)
export async function exchangeShortTokenPKCE(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{ access_token: string; token_type: string }> {
  const res = await graphFetch("oauth/access_token", {
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });
  if (!res.ok) throw new Error(`PKCE token exchange failed: ${JSON.stringify(res.data)}`);
  return res.data as { access_token: string; token_type: string };
}

export async function exchangeLongLivedToken(
  shortToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await graphFetch("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  });
  if (!res.ok) throw new Error(`Long-lived token exchange failed: ${JSON.stringify(res.data)}`);
  return res.data as { access_token: string; expires_in: number };
}

export async function getUserPages(
  accessToken: string
): Promise<Array<{ id: string; name: string; access_token: string }>> {
  const res = await graphFetch("me/accounts", {
    fields: "id,name,access_token",
    access_token: accessToken,
  });
  if (!res.ok) throw new Error(`Get pages failed: ${JSON.stringify(res.data)}`);
  const d = res.data as { data: Array<{ id: string; name: string; access_token: string }> };
  return d.data ?? [];
}

export async function getLeadData(
  leadgenId: string,
  pageAccessToken: string
): Promise<{ name: string | null; phone: string | null; city: string | null; raw: unknown }> {
  const res = await graphFetch(leadgenId, {
    fields: "field_data,created_time",
    access_token: pageAccessToken,
  });
  if (!res.ok) throw new Error(`Get lead failed: ${JSON.stringify(res.data)}`);

  const d = res.data as { field_data?: Array<{ name: string; values: string[] }> };
  const fields = d.field_data ?? [];

  function find(...keys: string[]): string | null {
    for (const key of keys) {
      const f = fields.find((x) => x.name.toLowerCase() === key.toLowerCase());
      if (f?.values?.[0]) return f.values[0];
    }
    return null;
  }

  const firstName = find("first_name", "prenom", "prénom");
  const lastName = find("last_name", "nom");
  const fullName =
  find("full_name", "nom_complet") ??
  ([firstName, lastName].filter(Boolean).join(" ") || null);

  return {
    name: fullName,
    phone: find("phone_number", "phone", "telephone", "téléphone", "numéro"),
    city: find("city", "ville", "wilaya"),
    raw: d,
  };
}

// Verifies a Supabase JWT from an Authorization: Bearer header.
// Returns the user_id (UUID) if valid, null otherwise.
export async function verifySupabaseJwt(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const jwt = authHeader.slice(7);
  // createServiceClient can call auth.getUser() with an arbitrary JWT
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user } } = await supabase.auth.getUser(jwt);
  return user?.id ?? null;
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  appSecret: string
): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}
