export type SupportedUnitLocale = "fr" | "en" | "ar"

const TRANSLATABLE_UNITS = {
  unit: {
    fr: { singular: "unité", plural: "unités" },
    en: { singular: "unit", plural: "units" },
    ar: { singular: "وحدة", plural: "وحدات" },
  },
  bag: {
    fr: { singular: "sac", plural: "sacs" },
    en: { singular: "bag", plural: "bags" },
    ar: { singular: "كيس", plural: "أكياس" },
  },
  pallet: {
    fr: { singular: "palette", plural: "palettes" },
    en: { singular: "pallet", plural: "pallets" },
    ar: { singular: "منصة نقالة", plural: "منصات نقالة" },
  },
  other: {
    fr: { singular: "unité", plural: "unités" },
    en: { singular: "unit", plural: "units" },
    ar: { singular: "وحدة", plural: "وحدات" },
  },
} as const

const FIXED_UNITS: Record<string, Record<SupportedUnitLocale, string>> = {
  kg: { fr: "kg", en: "kg", ar: "كغ" },
  ton: { fr: "tonne", en: "ton", ar: "طن" },
  m3: { fr: "m³", en: "m3", ar: "م3" },
  m2: { fr: "m²", en: "m2", ar: "م2" },
  m: { fr: "m", en: "m", ar: "م" },
}

export function normalizeUnitLocale(locale?: string | null): SupportedUnitLocale {
  if (locale === "ar" || locale === "en") return locale
  return "fr"
}

export function normalizeUnitCode(unit?: string | null): string {
  if (!unit) return ""

  const normalized = unit.trim().toLowerCase()
  if (normalized === "m³") return "m3"
  if (normalized === "m²") return "m2"
  return normalized
}

export function getLocalizedUnitLabel(
  unit?: string | null,
  locale?: string | null,
  quantity?: number | null,
): string {
  const resolvedLocale = normalizeUnitLocale(locale)
  const code = normalizeUnitCode(unit)

  if (!code) {
    return TRANSLATABLE_UNITS.unit[resolvedLocale].singular
  }

  if (code in FIXED_UNITS) {
    return FIXED_UNITS[code][resolvedLocale]
  }

  if (code in TRANSLATABLE_UNITS) {
    const forms = TRANSLATABLE_UNITS[code as keyof typeof TRANSLATABLE_UNITS][resolvedLocale]
    const usePlural = quantity != null && Math.abs(quantity) !== 1
    return usePlural ? forms.plural : forms.singular
  }

  return unit?.trim() || code
}

export function formatQuantityWithUnit(
  quantity: number | string,
  unit?: string | null,
  locale?: string | null,
): string {
  const numericQuantity = typeof quantity === "number" ? quantity : Number(quantity)
  const unitLabel = getLocalizedUnitLabel(unit, locale, Number.isFinite(numericQuantity) ? numericQuantity : null)
  return `${quantity} ${unitLabel}`.trim()
}
