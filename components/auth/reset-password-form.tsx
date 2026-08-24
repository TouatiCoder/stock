"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useAuthTranslations } from "@/components/LocaleProvider"

interface ResetPasswordFormProps {
  resetToken?: string
}

export function ResetPasswordForm({ resetToken }: ResetPasswordFormProps) {
  const router = useRouter()
  const t = useAuthTranslations("resetPassword")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError(t("fillAllFields"))
      return
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (!hasUppercase || !hasNumber) {
      setError("Password must contain at least one uppercase letter and one number")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      if (!resetToken) {
        throw new Error(t("missingToken"))
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: resetToken, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t("resetError"))
      }

      setSuccess(true)

      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || t("resetErrorGeneric"))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <AlertDescription className="text-green-800">
            {t("success")}
          </AlertDescription>
        </Alert>
        <p className="text-center text-gray-600">{t("redirecting")}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("newPasswordPlaceholder")}
            required
            minLength={6}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-1 top-1 h-8 w-8"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            required
            minLength={6}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-1 top-1 h-8 w-8"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? t("hideConfirmPassword") : t("showConfirmPassword")}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? t("submitting") : t("submit")}
      </Button>

      <div className="text-center pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {t("backToLogin")}
        </button>
      </div>
    </form>
  )
}
