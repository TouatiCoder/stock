"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier si le token est valide
    if (token) {
      setIsValid(true)
    }
    setIsLoading(false)
  }, [token])

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto text-center">
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </AuthLayout>
    )
  }

  if (!isValid) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto text-center">
          <p className="text-red-600 font-medium">Le lien de réinitialisation est invalide ou expiré.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un nouveau mot de passe</h1>
        </div>
        <ResetPasswordForm token={token!} />
      </div>
    </AuthLayout>
  )
}
