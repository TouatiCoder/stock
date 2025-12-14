// app/auth/reset-password/page.tsx - VERSION AVEC TOKEN DIRECT
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Lock, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [processingToken, setProcessingToken] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      if (token && type === 'recovery') {
        try {
          const supabase = getSupabaseClient()
          
          // Échanger le token contre une session
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          })
          
          if (otpError) {
            setError("Lien invalide ou expiré")
          }
        } catch (err) {
          setError("Erreur de traitement du lien")
        }
      } else {
        // Vérifier si on a déjà une session
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setError("Session invalide. Veuillez demander un nouveau lien.")
        }
      }
      
      setProcessingToken(false)
    }
    
    processToken()
  }, [searchParams])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      
      setTimeout(() => {
        router.push("/auth/login?message=password_reset_success")
      }, 2000)

    } catch (err) {
      setError("Une erreur inattendue s'est produite")
    } finally {
      setLoading(false)
    }
  }

  if (processingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
          <div className="p-8 space-y-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Traitement du lien...</h1>
            <p className="text-slate-600">Veuillez patienter</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">Lien invalide</h1>
            
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full"
              >
                Demander un nouveau lien
              </Button>
              
              <Button 
                onClick={() => router.push("/auth/login")}
                variant="outline"
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  // Si succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">Mot de passe mis à jour !</h1>
            
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                Votre mot de passe a été modifié avec succès.
                <br />
                Redirection vers la page de connexion...
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      </div>
    )
  }

  // Formulaire de réinitialisation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
            <p className="text-slate-500">Choisissez un nouveau mot de passe sécurisé</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nouveau mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-slate-500">Minimum 8 caractères</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Mise à jour...
                </span>
              ) : "Mettre à jour le mot de passe"}
            </Button>
          </form>

          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="w-full"
            >
              Retour à la connexion
            </Button>
            
            <p className="text-center text-xs text-slate-400">
              Utilisez un mot de passe fort et unique pour votre compte.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}