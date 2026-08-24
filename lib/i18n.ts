/**
 * Minimal i18n: cookie-based locale (fr | en | ar), no URL change.
 * Default: French. Arabic uses RTL (set on <html> by client).
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "app.locale";
export type Locale = "fr" | "en" | "ar";
export const defaultLocale: Locale = "fr";
export const locales: Locale[] = ["fr", "en", "ar"];

export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  if (input === "eng") return "en";
  return locales.includes(input as Locale) ? (input as Locale) : null;
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

// Messages are loaded in client component to avoid async in static context
export type AuthMessages = {
  login: Record<string, string>;
  signup: Record<string, string>;
  signupClosed: Record<string, string>;
  forgotPassword: Record<string, string>;
  resetPassword: Record<string, string>;
  invite: Record<string, string>;
  updatePassword: Record<string, string>;
  setPassword: Record<string, string>;
  authCodeError: Record<string, string>;
};

export type CommonMessages = Record<string, string>;
export type ProjectMessages = Record<string, string>;
export type InventoryMessages = Record<string, string>;
export type WarehouseMessages = Record<string, string>;
export type SettingsMessages = Record<string, string>;
export type CostsMessages = Record<string, string>;
export type ReportsMessages = Record<string, string>;
export type BillingMessages = Record<string, string>;
export type HomeMessages = Record<string, string>;
export type PlatformMessages = Record<string, string>;
export type PricingMessages = Record<string, string>;

export type Messages = {
  auth: AuthMessages;
  common: CommonMessages;
  project: ProjectMessages;
  inventory: InventoryMessages;
  warehouse: WarehouseMessages;
  settings: SettingsMessages;
  costs: CostsMessages;
  reports: ReportsMessages;
  billing: BillingMessages;
  home: HomeMessages;
  platform: PlatformMessages;
  pricing: PricingMessages;
};
