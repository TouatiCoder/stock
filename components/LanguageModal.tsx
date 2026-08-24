"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { locales, LOCALE_COOKIE, LOCALE_STORAGE_KEY, normalizeLocale, type Locale } from "@/lib/i18n";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function hasPersistedLocale(): boolean {
  if (typeof window === "undefined") return true;
  const fromStorage = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  const fromCookie = normalizeLocale(getCookie(LOCALE_COOKIE));
  return Boolean(fromStorage ?? fromCookie);
}

function shouldSkipAutoOpen(pathname: string | null): boolean {
  if (!pathname) return false;

  return [
    "/invite",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function LanguageModal() {
  const { setLocale, locale } = useLocale();
  const t = useCommonTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldSkipAutoOpen(pathname)) {
      setOpen(false);
      return;
    }

    setOpen(!hasPersistedLocale());
  }, [pathname]);

  const select = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !hasPersistedLocale()) return;
        setOpen(nextOpen);
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t("settings")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {locales.map((option) => (
            <Button
              key={option}
              variant={locale === option ? "default" : "outline"}
              onClick={() => select(option)}
            >
              {option.toUpperCase()}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
