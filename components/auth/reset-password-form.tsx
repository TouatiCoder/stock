// components/auth/reset-password-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

// Ajoutez l'interface avec la prop accessToken
interface ResetPasswordFormProps {
  accessToken?: string
}

export function ResetPasswordForm({ accessToken }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError("Veuillez remplir tous les champs")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // IMPORTANT: Si vous avez un accessToken, vous devez d'abord établir la session
      if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: "" // refresh token est optionnel pour recovery
        })

        if (sessionError) {
          throw sessionError
        }
      }

      // Maintenant mettez à jour le mot de passe
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error("Erreur de mise à jour:", updateError)
        throw updateError
      }

      console.log("Mot de passe mis à jour avec succès:", data)
      setSuccess(true)

      // Rediriger après un délai
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)

    } catch (err: any) {
      console.error("Erreur:", err)
      setError(err.message || "Une erreur est survenue lors de la réinitialisation")
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
            Votre mot de passe a été réinitialisé avec succès !
          </AlertDescription>
        </Alert>
        <p className="text-center text-gray-600">
          Redirection vers le tableau de bord...
        </p>
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
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Entrez votre nouveau mot de passe"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmez votre nouveau mot de passe"
          required
          minLength={6}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
      </Button>

      <div className="text-center pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Retour à la connexion
        </button>
      </div>
    </form>
  )
}