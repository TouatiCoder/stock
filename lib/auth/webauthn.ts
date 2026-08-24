import type { NextRequest } from "next/server";

export const AUTH_METHODS = ["password_only", "biometric_only", "biometric_password"] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export function isValidAuthMethod(value: unknown): value is AuthMethod {
  return typeof value === "string" && (AUTH_METHODS as readonly string[]).includes(value);
}

export function getRpIdAndOrigin(req: Request | NextRequest) {
  const url = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host");
  const directHost = req.headers.get("host");
  const host = (forwardedHost || directHost || url.host).trim();
  const proto = (req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http").trim();

  const hostName = host.split(":")[0];
  const isLocalRequest = hostName === "localhost" || hostName === "127.0.0.1";
  const defaultRpID = isLocalRequest ? "localhost" : hostName;
  const defaultOrigin = isLocalRequest ? "http://localhost:3000" : `${proto}://${host}`;
  const rpID = (process.env.WEBAUTHN_RP_ID || defaultRpID).trim();
  const origin = (process.env.WEBAUTHN_ORIGIN || defaultOrigin).trim();

  const isLocalhost = rpID === "localhost" || origin.startsWith("http://localhost");
  if (!isLocalhost && !origin.startsWith("https://")) {
    throw new Error("WebAuthn requires HTTPS outside localhost");
  }

  return { rpID, origin };
}

export function parseTransports(transports?: string | null): AuthenticatorTransport[] {
  if (!transports) return [];
  return transports
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean) as AuthenticatorTransport[];
}
