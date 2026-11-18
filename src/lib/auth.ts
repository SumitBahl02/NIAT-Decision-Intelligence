import { cookies } from "next/headers";
import crypto from "crypto";

const AUTH_COOKIE_NAME = "niat_admin_session";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "CRITICAL: AUTH_SECRET environment variable is missing or insecure. It must be set and at least 16 characters."
    );
  }
  return secret;
}

export function createSessionToken(): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;

  const [timestamp, signature] = token.split(".");
  const timeNum = parseInt(timestamp, 10);
  if (isNaN(timeNum)) return false;

  // Session valid for 24 hours
  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - timeNum > maxAgeMs) return false;

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

export async function isUserAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export { AUTH_COOKIE_NAME };
