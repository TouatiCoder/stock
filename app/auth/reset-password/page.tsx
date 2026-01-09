"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Récupérer le token de réinitialisation depuis l'URL
    const searchParams = new URL(window.location.href).searchParams
    const token = searchParams.get("access_token")
    const type = searchParams.get("type")

    if (token && type === "recovery") {
      setAccessToken(token)
    } else {
      setError("Lien invalide ou expiré. Veuillez demander un nouveau lien.")
    }
  }, [])

  if (error) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto mt-12">
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-3 mx-auto">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Accès refusé</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  Vous ne pouvez pas accéder directement à cette page.
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-2">
                <Link href="/auth/forgot-password" className="text-blue-600 underline">
                  Demander un nouveau lien
                </Link>
                <Link href="/login" className="text-gray-600 underline">
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  if (!accessToken) {
    return null // ou un petit loader si tu veux
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-3 mx-auto">
              <span className="text-white font-bold text-xl">BS</span>
            </div>
            <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
            <CardDescription>
              Créez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm accessToken={accessToken} />
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
