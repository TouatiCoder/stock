"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"

export function SignupForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    companyName: "",
    siret: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => {
    setError("")

    if (!formData.companyName.trim()) {
      setError("Veuillez entrer le nom de votre entreprise")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Veuillez entrer une adresse email valide")
      return false
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)

      // Redirect to dashboard after successful signup
      router.push("/dashboard")
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 ? (
        <>
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium text-gray-900">
              Nom de l'entreprise
            </label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Votre entreprise"
              value={formData.companyName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="siret" className="text-sm font-medium text-gray-900">
              Numéro SIRET (optionnel)
            </label>
            <Input
              id="siret"
              name="siret"
              placeholder="14-chiffres"
              value={formData.siret}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-900">
              Email de l'administrateur
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@exemple.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-900">
              Mot de passe
            </label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">Minimum 8 caractères</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
              Confirmer le mot de passe
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <Button type="button" onClick={handleNext} className="w-full" disabled={isLoading}>
            Continuer
          </Button>
        </>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-gray-900 mb-2">Étape 2 : Vérification de l'email</p>
            <p className="text-sm text-gray-600">
              Un email de confirmation a été envoyé à <span className="font-medium">{formData.email}</span>
            </p>
          </div>

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Inscription en cours..." : "J'ai confirmé mon email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              Retour
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
