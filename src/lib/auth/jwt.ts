import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function signTempToken(email: string): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign({ email, type: "otp-verified" }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "10m",
  });
}

export function verifyTempToken(token: string): { email: string } | null {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.email !== "string" || payload.type !== "otp-verified") {
      return null;
    }
    return { email: payload.email };
  } catch {
    return null;
  }
}
