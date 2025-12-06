"use client"

import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <span className="text-white font-bold text-xl">BS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réinitialiser le mot de passe</h1>
          <p className="text-gray-600 text-sm">Entrez votre adresse email pour recevoir un lien de réinitialisation</p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
