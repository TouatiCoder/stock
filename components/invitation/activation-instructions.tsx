"use client"

import { useAuthTranslations } from "@/components/LocaleProvider"

export function ActivationInstructions() {
  const t = useAuthTranslations("invite")

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">{t("activationTitle")}</h3>
      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
        <li>{t("activationStep1")}</li>
        <li>{t("activationStep2")}</li>
        <li>{t("activationStep3")}</li>
      </ul>
    </div>
  )
}
