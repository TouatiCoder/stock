import { Resend } from "resend";

type ResendSender = "security" | "invitations" | "admin";

const senderEnv: Record<ResendSender, string> = {
  security: "RESEND_FROM_EMAIL",
  invitations: "RESEND_FROM_INVITATIONS",
  admin: "RESEND_FROM_ADMIN",
};

const senderLabels: Record<ResendSender, string> = {
  security: "BuildStock Pro",
  invitations: "BuildStock Pro Invitations",
  admin: "BuildStock Pro Admin",
};

const senderLocalPartFallback: Record<ResendSender, string> = {
  security: "noreply",
  invitations: "invitations",
  admin: "admin",
};

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Email service is not configured: RESEND_API_KEY is missing");
  }
  return new Resend(apiKey);
}

export function getResendSender(kind: ResendSender = "security"): string {
  const domain = process.env.RESEND_DOMAIN?.trim().replace(/^@+|@+$/g, "");
  if (!domain) {
    throw new Error("Email service is not configured: RESEND_DOMAIN is missing");
  }

  const configuredLocalPart = process.env[senderEnv[kind]]?.trim();
  const localPart = configuredLocalPart || senderLocalPartFallback[kind];

  // Allow a full email address too, in case an existing deployment still uses one.
  if (localPart.includes("@")) {
    return localPart.includes("<") ? localPart : `${senderLabels[kind]} <${localPart}>`;
  }

  return `${senderLabels[kind]} <${localPart}@${domain}>`;
}

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return configuredUrl.replace(/\/+$/, "");
}
