const EXCLUDED_PREFIXES = [
  "/platform",
  "/billing",
  "/api/auth",
  "/api/webhooks",
  "/api/platform",
  "/api/internal/platform-access",
  "/auth",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/invite",
];

export function isExcludedFromSubscriptionEnforcement(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}