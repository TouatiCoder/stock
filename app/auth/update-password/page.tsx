"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useAuthTranslations } from "@/components/LocaleProvider"

export default function UpdatePasswordPage() {
  const t = useAuthTranslations("updatePassword")
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error(t("invalidToken"))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"))
      return
    }

    if (password.length < 6) {
      toast.error(t("passwordMinLength"))
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t("updateError"))

      toast.success(t("passwordSaved"))
      toast.success(t("accountActivated"))

      setTimeout(() => {
        window.location.href = "/login"
      }, 800)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("updateError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit mb-2">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{t("title")}</CardTitle>
          <CardDescription className="text-base">
            {token ? t("setPasswordPrompt") : "Invalid invitation/reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("newPassword")}</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="pr-10"
                  disabled={!token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("confirmPassword")}</label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                disabled={!token}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={loading || !token}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("activating")}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {t("activateAccount")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
