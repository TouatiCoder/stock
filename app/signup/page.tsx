import Link from "next/link"
import SignupForm from "@/components/auth/signup-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { redirect } from "next/navigation"
// 1. Changer l'import pour utiliser la fonction exportée réelle
import { createClient } from "@/lib/supabase/server"

export default async function SignupPage() {
  // 2. Initialiser le client Supabase pour le contexte serveur
  const supabase = await createClient()

  // 3. Utiliser 'supabase' au lieu de 'supabaseServer'
  const { data: company } = await supabase
    .from("companies")
    .select("is_initialized")
    .limit(1)
    .single()

  if (company?.is_initialized) {
    redirect("/login") // redirige si déjà initialisé
  }
  
  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <span className="text-white font-bold text-xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BuildStock Pro</h1>
          <p className="text-gray-600">Créer un compte entreprise</p>
        </div>

        <SignupForm />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}