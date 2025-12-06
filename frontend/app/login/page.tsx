"use client"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <span className="text-white font-bold text-xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BuildStock Pro</h1>
          <p className="text-gray-600">Accédez à votre compte</p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
              S'inscrire
            </Link>
          </p>
          <Link href="/forgot-password" className="block text-sm font-medium text-blue-600 hover:text-blue-700">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
