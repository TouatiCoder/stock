// components/auth/forgot-password-form.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function ForgotPasswordForm() {
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
        setError("Veuillez entrer une adresse email valide")
        return
      }

      // URL de redirection correcte pour Supabase
      // IMPORTANT: Doit pointer vers /auth/callback pour le flow PKCE
      const redirectUrl =
  process.env.NODE_ENV === "development"
    ? `${window.location.origin}/auth/callback`
    : `https://ton-domaine.com/auth/callback`
      
      console.log("Envoi de réinitialisation à:", email)
      console.log("URL de redirection:", redirectUrl)

      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (supabaseError) {
        console.error("Erreur Supabase:", supabaseError)
        
        // Ne pas révéler si l'email existe ou non
        // Même en cas d'erreur "user not found", on montre le message de succès
        console.log("Erreur technique (peut être user not found):", supabaseError.message)
      }

      // Toujours montrer le succès pour des raisons de sécurité
      setIsSubmitted(true)
      toast.success("Email envoyé !", {
        description: "Vérifiez votre boîte de réception"
      })
      
    } catch (err: any) {
      console.error("Erreur inattendue:", err)
      setError("Une erreur inattendue est survenue")
      toast.error("Erreur")
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
            <p className="font-medium">Email envoyé avec succès !</p>
            <p className="mt-1 text-sm">
              Si un compte existe avec l'adresse <strong>{email}</strong>, 
              vous recevrez un lien de réinitialisation dans les prochaines minutes.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong>📨 Vérifiez votre boîte mail :</strong>
          </p>
          <ul className="text-xs text-gray-500 space-y-1 ml-4">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Consultez votre boîte de réception
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Vérifiez le dossier "Spam" ou "Courrier indésirable"
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Le lien expirera dans 24 heures
            </li>
          </ul>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Vous n'avez pas reçu l'email ?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600"
                onClick={() => setIsSubmitted(false)}
              >
                Réessayer
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
          Adresse email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          Entrez l'adresse email associée à votre compte
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
            Envoi en cours...
          </>
        ) : (
          "Envoyer le lien de réinitialisation"
        )}
      </Button>

      <div className="text-center text-xs text-gray-500 pt-2">
        <p>Vous recevrez un lien pour créer un nouveau mot de passe</p>
      </div>
    </form>
  )
}