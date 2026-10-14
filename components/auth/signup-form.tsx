"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Building2, User, Mail, Lock, Briefcase, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useAuthTranslations } from "@/components/LocaleProvider"

export function SignupForm() {
  const router = useRouter()
  const t = useAuthTranslations("signup")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())

    // Validate names
    if (!data.firstName || String(data.firstName).trim().length < 2) {
      setError("First name must be at least 2 characters")
      setIsLoading(false)
      return
    }

    if (!data.lastName || String(data.lastName).trim().length < 2) {
      setError("Last name must be at least 2 characters")
      setIsLoading(false)
      return
    }

    // Validate company name
    if (!data.companyName || String(data.companyName).trim().length < 2) {
      setError("Company name must be at least 2 characters")
      setIsLoading(false)
      return
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      setError(t("passwordMismatch"))
      setIsLoading(false)
      return
    }

    // Validate password strength
    const password = String(data.password)
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    // Check for password complexity (at least one uppercase, one number)
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (!hasUppercase || !hasNumber) {
      setError("Password must contain at least one uppercase letter and one number")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        const fallbackError = t("registrationError")
        const apiError = typeof result.error === "string" && result.error.trim().length > 0 ? result.error : fallbackError
        setError(apiError)
        toast.error(apiError)
        setIsLoading(false)
      } else {
        if (result.emailSent === true) {
          toast.success(t("successMessage"))
        } else {
          const emailWarning = "Compte créé, mais l’email de bienvenue n’a pas pu être envoyé. Vérifiez la configuration email et le dossier spam."
          setError(emailWarning)
          toast.error(emailWarning)
        }
        setTimeout(() => {
          router.push("/login")
        }, 2500)
      }
    } catch {
      const connectionError = t("connectionError")
      setError(connectionError)
      toast.error(connectionError)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="mx-auto bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">{t("title")}</CardTitle>
        <CardDescription className="text-gray-600">{t("subtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  {t("firstName")}
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder={t("firstNamePlaceholder")}
                  required
                  disabled={isLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  {t("lastName")}
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder={t("lastNamePlaceholder")}
                  required
                  disabled={isLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                {t("companyName")}
              </Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder={t("companyPlaceholder")}
                required
                disabled={isLoading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                SIRET <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>
              </Label>
              <Input
                id="siret"
                name="siret"
                placeholder="Ex: 123 456 789 00010"
                disabled={isLoading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                {t("email")}
              </Label>
              <Input
                id="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" />
                {t("password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">{t("passwordHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" />
                {t("confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? t("hideConfirmPassword") : t("showConfirmPassword")}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-5 w-5 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              {t("hasAccount")}{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {t("signIn")}
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
