"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      
      // CORRECTION ICI : Utiliser window.location.origin au lieu de process.env
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
   })

      if (error) {
        setError(error.message)
        return
      }

      setSubmitted(true)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">Vérifiez votre email</h1>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
                <br />
                Le lien expire dans 1 heure.
              </p>
              
              <Button 
                onClick={() => window.location.href = "/auth/login"}
                variant="outline"
                className="w-full"
              >
                Retour à la connexion
              </Button>
              
              <p className="text-xs text-slate-400">
                Si vous ne voyez pas l'email, vérifiez vos spams.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
            <p className="text-slate-500">Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Envoi en cours...
                </span>
              ) : "Envoyer le lien"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Retour à la connexion
            </Link>
          </p>
          
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Le lien de réinitialisation sera valable pendant 1 heure.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}