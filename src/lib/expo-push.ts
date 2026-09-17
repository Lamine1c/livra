// Helper to send push notifications via Expo Push API.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

import { createServiceClient } from "@/lib/supabase/service";

type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
  channelId?: string;
};

// `expoError` = code technique renvoyé par Expo dans le ticket (ex. "DeviceNotRegistered")
// — sert au nettoyage des tokens morts côté multi-device. `error` reste le message humain.
type PushResult = { success: boolean; error?: string; expoError?: string };

export async function sendExpoPush(
  token: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<PushResult> {
  if (!token) {
    return { success: false, error: "No push token" };
  }

  if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
    return { success: false, error: "Invalid Expo token format" };
  }

  const payload: PushPayload = {
    to: token,
    title,
    body,
    data,
    sound: "default",
    // Android : priorité FCM haute + canal "commandes-v1" (importance MAX,
    // créé par l'app mobile) → heads-up/bannière hors app. Le canal "default"
    // hérité d'anciennes installs peut être resté en importance basse (son
    // sans bannière) et Android interdit de le remonter — d'où le canal neuf.
    priority: "high",
    channelId: "commandes-v1",
  };

  // Instrumentation de la chaîne push (diagnostic latence). Aucun PII loggé (ni
  // token, ni corps) : type d'event, temps serveur→Expo, priorité/canal, et le
  // TICKET Expo (id + status). Le ticket prouve qu'Expo a accepté immédiatement ;
  // un token périmé ressort ici en `status:error` (ex. DeviceNotRegistered) →
  // c'est LE point où un retard de 3 min se logerait, pas côté serveur.
  const startedAt = Date.now();
  const kind = typeof data.type === "string" ? data.type : "?";

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startedAt;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[expo-push] type=${kind} HTTP ${res.status} en ${elapsed}ms: ${errText}`);
      return { success: false, error: `Expo API ${res.status}: ${errText}` };
    }

    const json = await res.json();
    const ticket = json?.data as { id?: string; status?: string; message?: string; details?: { error?: string } } | undefined;
    if (ticket?.status === "error") {
      // Cause probable d'un push muet/perdu : token périmé côté serveur.
      console.error(
        `[expo-push] type=${kind} REJETÉ par Expo en ${elapsed}ms: ${ticket.message} (${ticket.details?.error ?? "?"})`
      );
      return { success: false, error: ticket.message ?? "Expo push error", expoError: ticket.details?.error };
    }

    // Accepté : ticket=<id> à donner à l'API receipts si besoin de tracer la
    // livraison FCM réelle. prio=high canal=commandes-v1 attendus.
    console.log(
      `[expo-push] type=${kind} accepté par Expo en ${elapsed}ms · ticket=${ticket?.id ?? "?"} ` +
        `prio=${payload.priority} canal=${payload.channelId}`
    );
    return { success: true };
  } catch (e) {
    console.error(`[expo-push] type=${kind} exception en ${Date.now() - startedAt}ms:`, e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ─── [N32W.2] ENVOI MULTI-DEVICE ──────────────────────────────────────────────
// Envoie à TOUS les tokens d'un owner (table push_tokens, migration 043).
// FALLBACK zéro-régression : tant que 043 n'est pas appliquée (table absente) OU qu'aucun
// token n'y est enregistré, on retombe sur `fallbackToken` (colonne unique legacy
// profiles/drivers.expo_push_token) → comportement identique à l'actuel.
// Nettoyage best-effort des tokens morts (DeviceNotRegistered) dans push_tokens.
export type PushOwner = { type: "profile" | "driver"; id: string; fallbackToken?: string | null };

// Erreurs Postgres/PostgREST « table absente » (043 non appliquée) → on ne bruite pas les logs.
const TABLE_ABSENT_RE = /42P01|PGRST205|relation .* does not exist|Could not find the table/i;

export async function sendExpoPushToOwner(
  owner: PushOwner,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<{ success: boolean; sent: number; error?: string }> {
  const supabase = createServiceClient();

  let tokens: string[] = [];
  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("owner_type", owner.type)
    .eq("owner_id", owner.id);

  if (error) {
    if (!TABLE_ABSENT_RE.test(`${error.code ?? ""} ${error.message ?? ""}`)) {
      console.error("[expo-push] lecture push_tokens échouée:", error.message);
    }
  } else if (rows) {
    tokens = rows.map((r) => (r as { token: string }).token).filter(Boolean);
  }

  // Fallback legacy : aucun token multi-device → colonne unique.
  if (tokens.length === 0 && owner.fallbackToken) tokens = [owner.fallbackToken];
  // Dédup (le legacy peut aussi être présent dans push_tokens une fois 043 appliquée).
  tokens = Array.from(new Set(tokens));
  if (tokens.length === 0) return { success: false, sent: 0, error: "No push token" };

  let sent = 0;
  const dead: string[] = [];
  for (const t of tokens) {
    const r = await sendExpoPush(t, title, body, data);
    if (r.success) sent++;
    else if (r.expoError === "DeviceNotRegistered") dead.push(t);
  }

  // Purge best-effort des tokens morts (ne bloque jamais l'appelant).
  if (dead.length > 0) {
    const { error: delErr } = await supabase.from("push_tokens").delete().in("token", dead);
    if (delErr && !TABLE_ABSENT_RE.test(`${delErr.code ?? ""} ${delErr.message ?? ""}`)) {
      console.error("[expo-push] purge tokens morts échouée:", delErr.message);
    }
  }

  return { success: sent > 0, sent };
}
