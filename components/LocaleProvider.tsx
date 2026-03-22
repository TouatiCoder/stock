"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  type Locale,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isRtl,
  normalizeLocale,
} from "@/lib/i18n";
import type { Messages } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (ns: keyof Messages, key: string) => string;
  dir: "ltr" | "rtl";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale | null;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const fromStorage = getStoredLocale();
    if (fromStorage) return fromStorage;
    const fromCookie = normalizeLocale(initialLocale ?? getCookie(LOCALE_COOKIE));
    return fromCookie ?? defaultLocale;
  });
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    const fromStorage = getStoredLocale();
    const fromCookie = normalizeLocale(getCookie(LOCALE_COOKIE));
    const resolved = fromStorage ?? fromCookie ?? defaultLocale;
    if (resolved !== locale) {
      setLocaleState(resolved);
    }
  }, [locale]);

  useEffect(() => {
    let isMounted = true;
    
    const loadMessages = async () => {
      try {
        const module = await import(`@/messages/${locale}.json`);
        if (isMounted) {
          setMessages(module.default as Messages);
        }
      } catch (error) {
        console.error(`Failed to load messages for locale ${locale}:`, error);
        // Load default locale messages as fallback
        try {
          const module = await import(`@/messages/${defaultLocale}.json`);
          if (isMounted) {
            setMessages(module.default as Messages);
          }
        } catch (fallbackError) {
          console.error(`Failed to load default messages:`, fallbackError);
        }
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [locale]); // This dependency will cause the effect to run when locale changes

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", locale);
    root.setAttribute("dir", isRtl(locale) ? "rtl" : "ltr");
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, l);
    }
    setCookie(LOCALE_COOKIE, l);
  }, []);

  const t = useCallback(
    (ns: keyof Messages, key: string): string => {
      if (!messages) return key;
      const o = (messages as Record<string, unknown>)[ns as string];
      if (!o || typeof o !== "object") return key;
      
      // Handle nested keys (e.g., "login.title")
      if (key.includes(".")) {
        const segs = key.split(".");
        let v: unknown = o;
        for (const s of segs) {
          v = (v as Record<string, unknown>)?.[s];
        }
        return typeof v === "string" ? v : key;
      }
      
      // Handle simple keys
      const value = (o as Record<string, unknown>)[key];
      return typeof value === "string" ? value : key;
    },
    [messages]
  );

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t,
    dir: isRtl(locale) ? "rtl" : "ltr",
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const c = useContext(LocaleContext);
  if (!c) throw new Error("useLocale must be used inside LocaleProvider");
  return c;
}

/** Use in auth UI: t('auth', 'login.title') */
export function useAuthTranslations(ns: keyof Messages["auth"]) {
  const { t } = useLocale();
  return (key: string) => t("auth", `${ns}.${key}`);
}

export function useCommonTranslations() {
  const { t } = useLocale();
  return (key: string) => t("common", key);
}

export function useProjectTranslations() {
  const { t } = useLocale();
  return (key: string) => t("project", key);
}

export function useInventoryTranslations() {
  const { t } = useLocale();
  return (key: string) => t("inventory", key);
}

export function useWarehouseTranslations() {
  const { t } = useLocale();
  return (key: string) => t("warehouse", key);
}

export function useSettingsTranslations() {
  const { t } = useLocale();
  return (key: string) => t("settings", key);
}

export function useCostsTranslations() {
  const { t } = useLocale();
  return (key: string) => t("costs", key);
}
