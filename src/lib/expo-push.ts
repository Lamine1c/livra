// Helper to send push notifications via Expo Push API.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

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

type PushResult = { success: boolean; error?: string };

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
      return { success: false, error: ticket.message ?? "Expo push error" };
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
