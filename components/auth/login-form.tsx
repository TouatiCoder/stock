"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { loginAction } from "@/app/login/actions"
import { useAuthTranslations } from "@/components/LocaleProvider"
import { PasswordInput } from "@/components/ui/password-input"

export function LoginForm() {
  const t = useAuthTranslations("login")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)

    try {
      const result = await loginAction(formData)

      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else if (result?.success) {
        if (result.previousLoginAt) {
          toast.info(`${t("lastLoginPrefix")}: ${new Date(result.previousLoginAt).toLocaleString()}`)
        } else {
          toast.info(t("welcomeFirstLogin"))
        }

        if (result.subscriptionStatus === "trialing") {
          sessionStorage.setItem(
            "trial-popup",
            JSON.stringify({
              status: "trialing",
              trialEndsAt: result.subscriptionTrialEndsAt || null,
              at: Date.now(),
            }),
          )
        }

        toast.success(t("loginSuccess"))
        window.location.href = "/dashboard"
      }
    } catch {
      setError(t("genericError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" required disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <PasswordInput id="password" name="password" required disabled={isLoading} />
          </div>
          <Button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </div>
      </form>
    </div>
  )
}
