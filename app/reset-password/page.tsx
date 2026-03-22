"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuthTranslations, useCommonTranslations } from "@/components/LocaleProvider"

export default function ResetPasswordPage() {
  const router = useRouter()
  const t = useAuthTranslations("resetPassword")
  const tCommon = useCommonTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      setIsLoading(true)
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get("token")
      if (!token) setError("invalid")
      else setResetToken(token)
    } catch {
      setError("invalid")
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto text-center py-20">
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </AuthLayout>
    )
  }

  if (error || !resetToken) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto py-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{t("invalidLink")}</AlertDescription>
          </Alert>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              {t("requestNewLink")}
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
            >
              {t("backToLogin")}
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>
        <ResetPasswordForm resetToken={resetToken} />
      </div>
    </AuthLayout>
  )
}
