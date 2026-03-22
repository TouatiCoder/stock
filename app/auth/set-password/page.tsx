"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useAuthTranslations, useCommonTranslations } from "@/components/LocaleProvider"

export default function SetPasswordPage() {
  const router = useRouter()
  const t = useAuthTranslations("setPassword")
  const tCommon = useCommonTranslations()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get("token")
    if (!tokenParam) {
      setError(t("invalidLink"))
    } else {
      setToken(tokenParam)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError(t("fillAllFields"))
      return
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }

    if (password.length < 6) {
      setError(t("passwordMinLength"))
      return
    }

    if (!token) {
      setError(t("invalidLink"))
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || t("setPasswordError"))
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.message || t("setPasswordError"))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{t("successTitle")}</CardTitle>
            <CardDescription className="text-base">
              {t("successDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit mb-2">
            <span className="text-blue-700 font-bold text-xl">{tCommon("appShortName")}</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{t("title")}</CardTitle>
          <CardDescription className="text-base">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>{t("newPassword")}</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("newPasswordPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("confirmPassword")}</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={isLoading}>
              {isLoading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
