"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const calculateStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères")
        return
      }

      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas")
        return
      }

      if (calculateStrength(password) < 2) {
        setError("Le mot de passe doit être plus fort (majuscules, chiffres, caractères spéciaux)")
        return
      }

      // Simuler la réinitialisation
      console.log("Mot de passe réinitialisé avec token:", token)
      setIsSuccess(true)

      // Redirection après succès
      setTimeout(() => {
        // window.location.href = '/login'
      }, 2000)
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="text-green-800">
            Votre mot de passe a été réinitialisé avec succès. Redirection vers la connexion...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-900">
          Nouveau mot de passe
        </label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
          Confirmer le mot de passe
        </label>
        <PasswordInput
          id="confirmPassword"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Réinitialisation en cours..." : "Réinitialiser et se connecter"}
      </Button>
    </form>
  )
}
