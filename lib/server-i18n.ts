import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, normalizeLocale, type Locale } from "@/lib/i18n";

export async function getCurrentLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const localeStr = cookieStore.get(LOCALE_COOKIE)?.value;
    return normalizeLocale(localeStr) ?? defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export async function getTranslations(namespace: string) {
  const locale = await getCurrentLocale();
  try {
    const messagesModule = await import(`@/messages/${locale}.json`);
    const messages = messagesModule.default || messagesModule;
    return messages[namespace] || {};
  } catch (error) {
    console.error(`Failed to load translations for namespace "${namespace}" and locale "${locale}":`, error);
    return {};
  }
}

export async function t(ns: string, key: string): Promise<string> {
  const messages = await getTranslations(ns);
  const segments = key.split(".");
  let value: unknown = messages;

  for (const segment of segments) {
    value = (value as Record<string, unknown>)?.[segment];
  }

  return typeof value === "string" ? value : key;
}
