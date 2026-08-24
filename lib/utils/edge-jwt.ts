import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  companyId?: string;
  isPlatformAdmin?: boolean;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate a signed HS256 JWT token.
 * Accepts either a plain userId string (backward compat) or a full payload object.
 * Token expires in 7 days.
 */
export async function generateToken(
  payload: string | Omit<JwtPayload, "exp" | "iat">
): Promise<string> {
  const tokenPayload: Omit<JwtPayload, "exp" | "iat"> =
    typeof payload === "string" ? { userId: payload } : { ...payload };

  return new SignJWT(tokenPayload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/**
 * Verify a JWT token and return its payload.
 * Returns null if the token is invalid, expired, or tampered.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
