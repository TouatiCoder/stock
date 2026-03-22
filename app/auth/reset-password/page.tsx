"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuthTranslations, useCommonTranslations } from "@/components/LocaleProvider"

export default function ResetPasswordPage() {
  const t = useAuthTranslations("resetPassword")
  const tCommon = useCommonTranslations()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams
    const token = searchParams.get("access_token")
    const type = searchParams.get("type")

    if (token && type === "recovery") {
      setAccessToken(token)
    } else {
      setError(t("invalidLink"))
    }
  }, [])

  if (error) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto mt-12">
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-3 mx-auto">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">{t("accessDeniedTitle")}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {t("accessDeniedDescription")}
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-2">
                <Link href="/auth/forgot-password" className="text-blue-600 underline">
                  {t("requestNewLink")}
                </Link>
                <Link href="/login" className="text-gray-600 underline">
                  {t("backToLogin")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  if (!accessToken) {
    return null
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3 mx-auto">
              <span className="text-white font-bold text-xl">{tCommon("appShortName")}</span>
            </div>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>
              {t("subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm resetToken={accessToken} />
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
