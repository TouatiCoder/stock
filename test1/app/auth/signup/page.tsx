"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Lock, Mail, User, Crown, Shield } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signupAllowed, setSignupAllowed] = useState<boolean>(true)
  const router = useRouter()

  // Vérifier si un admin existe déjà
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const supabase = getSupabaseClient()
        
        const { count } = await supabase
          .from("users")
          .select("*", { count: 'exact', head: true })
          .eq("role", "admin")

        // Si un admin existe déjà, bloquer l'inscription
        if (count && count > 0) {
          setSignupAllowed(false)
        }
      } catch (err) {
        console.error("Erreur vérification admin:", err)
      } finally {
        setChecking(false)
      }
    }

    checkAdminExists()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupAllowed) {
      setError("L'inscription est fermée. Seul le premier utilisateur peut créer un compte admin.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      
      // Vérifier une dernière fois avant de créer
      const { count } = await supabase
        .from("users")
        .select("*", { count: 'exact', head: true })

      if (count && count > 0) {
        setError("Un compte admin existe déjà. L'inscription est fermée.")
        setSignupAllowed(false)
        setLoading(false)
        return
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signupError) {
        setError(signupError.message)
        return
      }

      if (data.user) {
        // Créer le profil utilisateur en tant qu'admin
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role: "admin", // Premier utilisateur = admin
          },
        ] as any)

        if (profileError) {
          setError(profileError.message)
          return
        }

        // Rediriger vers la page de succès
        router.push("/auth/signup-success")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Pendant la vérification
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-700">Vérification...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Si l'inscription n'est PAS permise
  if (!signupAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">Inscriptions fermées</h1>
            
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                Le compte administrateur a déjà été créé.
                <br />
                <strong>Seul le premier utilisateur peut créer un compte.</strong>
              </AlertDescription>
            </Alert>
            
            <p className="text-slate-600">
              Si vous êtes l'administrateur, connectez-vous avec vos identifiants.
            </p>
            
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
          </div>
        </Card>
      </div>
    )
  }

  // Formulaire d'inscription (seulement si signupAllowed = true)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Crown className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">BuildStock Pro</h1>
            <p className="text-slate-500">Créer le compte Administrateur</p>
            
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                <strong>⚠️ Attention :</strong> Vous créez le <strong>premier et unique compte admin</strong>.
                <br />
                Après cette inscription, personne d'autre ne pourra s'inscrire.
              </AlertDescription>
            </Alert>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Nom complet</label>
              </div>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Email</label>
              </div>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Création du compte admin...
                </span>
              ) : "Créer le compte Administrateur"}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Ce compte aura tous les droits d'administration. Après cette inscription, les inscriptions seront fermées.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}