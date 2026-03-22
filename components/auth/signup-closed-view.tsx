"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { useAuthTranslations } from "@/components/LocaleProvider"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export function SignupClosedView() {
  const t = useAuthTranslations("signupClosed")
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <Lock className="w-12 h-12 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-gray-600 max-w-md mb-8">{t("body")}</p>
      <Link
        href="/login"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
      >
        {t("goToLogin")}
      </Link>
    </div>
  )
}
