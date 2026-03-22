"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthTranslations, useCommonTranslations } from "@/components/LocaleProvider"

export function ForgotPasswordForm() {
  const t = useAuthTranslations("forgotPassword")
  const tCommon = useCommonTranslations()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (isLoading) return
    setIsLoading(true)

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError(t("invalidEmail"))
        return
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t("emailNotFound"))
        }

        throw new Error(result.error || t("unexpectedError"))
      }

      setIsSubmitted(true)
      toast.success(t("successToastTitle"), {
        description: t("successToastDescription")
      })
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(err?.message || t("unexpectedError"))
      toast.error(tCommon("error"))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <p className="font-medium">{t("successMessageTitle")}</p>
            <p className="mt-1 text-sm">
              {t("successMessageBody").replace("{email}", email)}
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong>{t("checkEmailTitle")}</strong>
          </p>
          <ul className="text-xs text-gray-500 space-y-1 ml-4">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t("checkInbox")}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t("checkSpam")}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              {t("linkExpires")}
            </li>
          </ul>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              {t("noEmailReceived")}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600"
                onClick={() => setIsSubmitted(false)}
              >
                {t("retry")}
              </Button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-900">
          {t("email")}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          {t("emailHelper")}
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading || !email.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("sending")}
          </>
        ) : (
          t("submit")
        )}
      </Button>

      <div className="text-center text-xs text-gray-500 pt-2">
        <p>{t("infoText")}</p>
      </div>
    </form>
  )
}
