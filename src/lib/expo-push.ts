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

  // Mesure la latence serveur → Expo (preuve d'envoi immédiat). Aucun PII loggé
  // (ni token, ni corps) : uniquement le type d'event + le temps d'aller-retour.
  // Un délai de livraison côté device (ex. optimisation batterie ZTE) est alors
  // isolable en comparant ce timestamp à l'event déclencheur.
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

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Expo API ${res.status}: ${errText}` };
    }

    const json = await res.json();
    if (json?.data?.status === "error") {
      return { success: false, error: json.data.message ?? "Expo push error" };
    }

    console.log(`[expo-push] envoyé type=${kind} en ${Date.now() - startedAt}ms (accepté par Expo)`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
