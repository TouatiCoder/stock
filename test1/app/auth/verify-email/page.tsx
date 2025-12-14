// app/auth/verify-email/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail, XCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no_token'>('loading')
  const [message, setMessage] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const type = searchParams.get("type")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || type !== "signup") {
        setStatus('no_token')
        setMessage("Lien de vérification invalide")
        return
      }

      try {
        const supabase = getSupabaseClient()
        
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          setStatus('error')
          setMessage(error.message)
        } else {
          setStatus('success')
          setMessage("Votre email a été vérifié avec succès !")
          
          // Rediriger vers le dashboard après 3 secondes
          setTimeout(() => {
            router.push("/dashboard")
          }, 3000)
        }
      } catch (err) {
        setStatus('error')
        setMessage("Une erreur est survenue lors de la vérification")
      }
    }

    verifyEmail()
  }, [token, type, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
        <div className="p-8 space-y-6 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center">
                <div className="h-12 w-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Vérification en cours...</h1>
              <p className="text-slate-600">Veuillez patienter pendant que nous vérifions votre email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Email vérifié !</h1>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {message}
                  <br />
                  Redirection vers le tableau de bord...
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Aller au tableau de bord
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Erreur de vérification</h1>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message || "Le lien de vérification a expiré ou est invalide."}
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </>
          )}

          {status === 'no_token' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Mail className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Vérifiez votre email</h1>
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Un email de vérification vous a été envoyé.
                  <br />
                  Cliquez sur le lien dans l'email pour activer votre compte.
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Si vous ne recevez pas l'email, vérifiez vos spams ou contactez l'administrateur.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}