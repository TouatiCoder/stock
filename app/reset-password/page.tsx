// app/auth/reset-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Vérifier si l'utilisateur a une session de réinitialisation
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Erreur de session:", sessionError)
          setError("Erreur de vérification de session")
          return
        }

        // Vérifier si l'utilisateur a un accès valide pour réinitialiser le mot de passe
        // Supabase marque l'utilisateur comme ayant accès via le type "recovery"
        if (session) {
          // Obtenir l'utilisateur actuel
          const { data: { user } } = await supabase.auth.getUser()
          
          // Vérifier si l'utilisateur a accès à la réinitialisation
          // Vous pouvez ajouter une vérification supplémentaire ici si nécessaire
          setHasAccess(true)
        } else {
          setError("Session invalide ou expirée. Veuillez redemander un lien de réinitialisation.")
        }
      } catch (err: any) {
        console.error("Erreur:", err)
        setError("Une erreur est survenue lors de la vérification")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto text-center py-20">
          <p className="text-gray-600">Vérification de votre accès...</p>
        </div>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto py-20">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push("/auth/forgot-password")}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Redemander un nouveau lien
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (!hasAccess) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto text-center py-20">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>Accès non autorisé pour réinitialiser le mot de passe</AlertDescription>
          </Alert>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Créer un nouveau mot de passe
          </h1>
          <p className="text-gray-600">
            Entrez votre nouveau mot de passe ci-dessous
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </AuthLayout>
  )
}