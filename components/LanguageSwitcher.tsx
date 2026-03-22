"use client";

import { useLocale } from "@/components/LocaleProvider";
import { locales } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`flex gap-1 ${className ?? ""}`}>
      {locales.map((option) => (
        <Button
          key={option}
          type="button"
          variant={locale === option ? "default" : "outline"}
          size="sm"
          onClick={() => setLocale(option)}
          className="min-w-[2.25rem]"
        >
          {option.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
