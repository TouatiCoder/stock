import { Resend } from "resend";

type ResendSender = "security" | "invitations" | "admin";

const senderEnv: Record<ResendSender, string> = {
  security: "RESEND_FROM_EMAIL",
  invitations: "RESEND_FROM_INVITATIONS",
  admin: "RESEND_FROM_ADMIN",
};

const senderFallback: Record<ResendSender, string> = {
  security: "BuildStock Pro <noreply@touatiayoub.com>",
  invitations: "BuildStock Pro <invitations@touatiayoub.com>",
  admin: "BuildStock Pro <admin@touatiayoub.com>",
};

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Email service is not configured: RESEND_API_KEY is missing");
  }
  return new Resend(apiKey);
}

export function getResendSender(kind: ResendSender = "security"): string {
  return process.env[senderEnv[kind]]?.trim() || senderFallback[kind];
}

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return configuredUrl.replace(/\/+$/, "");
}
