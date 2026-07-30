import crypto from "crypto";

const EXPIRY_MS = 24 * 60 * 60 * 1000;
const BUYER_EXPIRY_MS = 48 * 60 * 60 * 1000;
// TTL 30 j (décision Lamine, 30 juil) : à 24 h un livreur inactif >1 jour était
// déconnecté chaque jour, et le refresh (deviceId) ne le sauvait qu'en ligne. 30 j
// couvre pauses/week-ends sans re-login ; le device reste révocable (device_id en base)
// et le refresh reste le filet. Cf. résilience hub P3 côté mobile.
const DRIVER_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.QR_SIGNING_SECRET;
  if (!s) throw new Error("QR_SIGNING_SECRET is not set");
  return s;
}

export function generateQrToken(orderId: string, vendorId: string): string {
  const payload = `${orderId}|${vendorId}|${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export type VerifyResult =
  | { valid: true; orderId: string; vendorId: string }
  | { valid: false; expired?: boolean; orderId?: string; vendorId?: string };

export function verifyQrToken(token: string): VerifyResult {
  if (!token || typeof token !== "string") return { valid: false };

  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false };

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { valid: false };
  }

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  } catch {
    return { valid: false };
  }

  // SHA-256 HMAC base64url is always 43 chars; length mismatch = invalid
  if (sig.length !== expectedSig.length) return { valid: false };
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return { valid: false };
  const [orderId, vendorId, tsStr] = parts;
  const ts = parseInt(tsStr, 10);
  if (!orderId || !vendorId || isNaN(ts)) return { valid: false };

  if (Date.now() - ts > EXPIRY_MS) {
    return { valid: false, expired: true, orderId, vendorId };
  }

  return { valid: true, orderId, vendorId };
}

// ── Buyer token (scope sentinel = "__buyer__", expiry = 48h) ──

export function generateBuyerToken(orderId: string): string {
  const payload = `${orderId}|__buyer__|${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export type BuyerVerifyResult =
  | { valid: true; orderId: string }
  | { valid: false; expired?: boolean };

export function verifyBuyerToken(token: string): BuyerVerifyResult {
  if (!token || typeof token !== "string") return { valid: false };

  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false };

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { valid: false };
  }

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  } catch {
    return { valid: false };
  }

  if (sig.length !== expectedSig.length) return { valid: false };
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return { valid: false };
  const [orderId, scope, tsStr] = parts;
  if (scope !== "__buyer__") return { valid: false };
  const ts = parseInt(tsStr, 10);
  if (!orderId || isNaN(ts)) return { valid: false };

  if (Date.now() - ts > BUYER_EXPIRY_MS) {
    return { valid: false, expired: true };
  }

  return { valid: true, orderId };
}

// ── Locate token (scope sentinel = "__locate__", expiry = 7d) ──
// Used by the buyer to confirm their GPS position via /locate?t=<token>

const LOCATE_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function generateLocateToken(orderId: string): string {
  const payload = `${orderId}|__locate__|${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export type LocateTokenVerifyResult =
  | { valid: true; orderId: string }
  | { valid: false; expired?: boolean };

export function verifyLocateToken(token: string): LocateTokenVerifyResult {
  if (!token || typeof token !== "string") return { valid: false };

  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false };

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { valid: false };
  }

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  } catch {
    return { valid: false };
  }

  if (sig.length !== expectedSig.length) return { valid: false };
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return { valid: false };
  const [orderId, scope, tsStr] = parts;
  if (scope !== "__locate__") return { valid: false };
  const ts = parseInt(tsStr, 10);
  if (!orderId || isNaN(ts)) return { valid: false };

  if (Date.now() - ts > LOCATE_TOKEN_EXPIRY_MS) {
    return { valid: false, expired: true };
  }

  return { valid: true, orderId };
}

// ── Driver token (scope sentinel = "__driver__", expiry = 24h) ──
// Used by mobile to authenticate GPS position writes via /api/driver/position

export function generateDriverToken(driverId: string): string {
  const payload = `${driverId}|__driver__|${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export type DriverTokenVerifyResult =
  | { valid: true; driverId: string }
  | { valid: false; expired?: boolean };

export function verifyDriverToken(token: string): DriverTokenVerifyResult {
  if (!token || typeof token !== "string") return { valid: false };

  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false };

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { valid: false };
  }

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  } catch {
    return { valid: false };
  }

  if (sig.length !== expectedSig.length) return { valid: false };
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return { valid: false };
  const [driverId, scope, tsStr] = parts;
  if (scope !== "__driver__") return { valid: false };
  const ts = parseInt(tsStr, 10);
  if (!driverId || isNaN(ts)) return { valid: false };

  if (Date.now() - ts > DRIVER_TOKEN_EXPIRY_MS) {
    return { valid: false, expired: true };
  }

  return { valid: true, driverId };
}

// ── Billing activation token (scope sentinel = "__billing__", expiry = 7d) ──
// Envoyé dans les emails/WA de rappel de fin d'essai : les emails ne portent
// pas de session vendeur, le token signé identifie le vendeur (email) sur
// /billing/activer?t=<token> qui crée le checkout Chargily et redirige.

const BILLING_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function generateBillingActivationToken(email: string): string {
  const payload = `${email}|__billing__|${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export type BillingTokenVerifyResult =
  | { valid: true; email: string }
  | { valid: false; expired?: boolean };

export function verifyBillingActivationToken(token: string): BillingTokenVerifyResult {
  if (!token || typeof token !== "string") return { valid: false };

  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false };

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { valid: false };
  }

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  } catch {
    return { valid: false };
  }

  if (sig.length !== expectedSig.length) return { valid: false };
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return { valid: false };
  const [email, scope, tsStr] = parts;
  if (scope !== "__billing__") return { valid: false };
  const ts = parseInt(tsStr, 10);
  if (!email || isNaN(ts)) return { valid: false };

  if (Date.now() - ts > BILLING_TOKEN_EXPIRY_MS) {
    return { valid: false, expired: true };
  }

  return { valid: true, email };
}

/**
 * Vérifie la signature HMAC d'un driver token MAIS accepte les tokens
 * expirés. Usage : /api/driver/refresh-token, pour permettre à un livreur
 * de demander un nouveau token tant qu'il prouve qu'il détenait déjà un
 * token légitime émis pour lui (HMAC valide).
 *
 * NE PAS utiliser pour autoriser des actions ! Uniquement pour le refresh.
 */
export function verifyDriverTokenAllowExpired(token: string):
  { valid: true; driverId: string } | { valid: false } {
  if (!token || typeof token !== "string") return { valid: false };
  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false };
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try { payload = Buffer.from(encoded, "base64url").toString("utf8"); }
  catch { return { valid: false }; }
  let expectedSig: string;
  try { expectedSig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url"); }
  catch { return { valid: false }; }
  if (sig.length !== expectedSig.length) return { valid: false };
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return { valid: false };
  const parts = payload.split("|");
  if (parts.length !== 3) return { valid: false };
  const [driverId, scope] = parts;
  if (scope !== "__driver__") return { valid: false };
  if (!driverId) return { valid: false };
  return { valid: true, driverId };
}
