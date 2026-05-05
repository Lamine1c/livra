import crypto from "crypto";

const EXPIRY_MS = 24 * 60 * 60 * 1000;

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
