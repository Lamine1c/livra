// Helper to send push notifications via Expo Push API.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
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
  };

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

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
