// @/app/auth/accept-invitation/page.tsx - VERSION PRO
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

function AcceptInvitationContent() {
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [settingPassword, setSettingPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [invitationData, setInvitationData] = useState<{
    email: string
    full_name: string
    role: string
    invited_by: string
    valid: boolean
    expired: boolean
  } | null>(null)
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  // Étape 1: Valider le token d'invitation
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token || !email) {
        setError("Lien d'invitation invalide")
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabaseClient()
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, full_name, role, invited_by, invitation_token, invitation_expires, status')
          .eq('email', email)
          .eq('invitation_token', token)
          .single()

        if (userError || !userData) {
          setError("Invitation invalide ou expirée")
          setLoading(false)
          return
        }

        // Vérifier l'expiration
        const isExpired = new Date(userData.invitation_expires) < new Date()
        
        if (isExpired || userData.status !== 'invited') {
          setInvitationData({
            email: userData.email,
            full_name: userData.full_name || userData.email.split("@")[0],
            role: userData.role,
            invited_by: userData.invited_by,
            valid: false,
            expired: isExpired
          })
          setLoading(false)
          return
        }

        setInvitationData({
          email: userData.email,
          full_name: userData.full_name || userData.email.split("@")[0],
          role: userData.role,
          invited_by: userData.invited_by,
          valid: true,
          expired: false
        })
        
      } catch (err) {
        console.error("Validation error:", err)
        setError("Erreur lors de la validation de l'invitation")
      } finally {
        setLoading(false)
      }
    }

    validateInvitation()
  }, [token, email])

  // Étape 2: Accepter l'invitation et définir le mot de passe
  const handleAcceptInvitation = async () => {
    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (!invitationData?.valid) {
      setError("Invitation invalide")
      return
    }

    setSettingPassword(true)
    setError("")

    try {
      const supabase = getSupabaseClient()
      
      // 1. Définir le mot de passe via l'API Auth
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      })

      if (passwordError) {
        // Si l'utilisateur n'a pas de session, utiliser le flux de réinitialisation
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          invitationData.email,
          {
            password: password,
            redirectTo: `${window.location.origin}/auth/accept-invitation?token=${token}&email=${email}`
          }
        )

        if (resetError) throw resetError
      }

      // 2. Mettre à jour le statut de l'utilisateur
      const { error: updateError } = await supabase
        .from('users')
        .update({
          status: 'active',
          invitation_token: null,
          invitation_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('email', invitationData.email)

      if (updateError) throw updateError

      // 3. Confirmer l'email si nécessaire
      const { error: confirmError } = await supabase.auth.updateUser({
        email_confirm: true
      })

      if (confirmError) {
        console.warn("Email confirmation may still be pending:", confirmError)
      }

      setSuccess(true)
      
      // 4. Redirection automatique vers le dashboard après 3 secondes
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)

    } catch (err: any) {
      console.error("Accept error:", err)
      setError(err.message || "Erreur lors de l'acceptation de l'invitation")
    } finally {
      setSettingPassword(false)
    }
  }

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md w-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Validation de l'invitation</h2>
          <p className="text-gray-500 mt-2">Vérification en cours...</p>
        </Card>
      </div>
    )
  }

  // Invitation invalide ou expirée
  if (invitationData && !invitationData.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md w-full">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            {invitationData.expired ? 'Invitation expirée' : 'Invitation invalide'}
          </h2>
          <p className="text-gray-500 mt-2">
            {invitationData.expired 
              ? "Cette invitation a expiré. Contactez l'administrateur pour une nouvelle invitation."
              : "Cette invitation n'est plus valide ou a déjà été utilisée."
            }
          </p>
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="mt-6"
          >
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    )
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md w-full">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Compte activé avec succès !</h2>
          <p className="text-gray-500 mt-2">
            Redirection vers votre tableau de bord...
          </p>
        </Card>
      </div>
    )
  }

  // Formulaire d'acceptation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Accepter l'invitation</h1>
          <p className="text-gray-500 mt-2">
            Rejoignez BuildStock Pro en définissant votre mot de passe
          </p>
        </div>

        {invitationData && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              <p className="font-medium text-blue-800">Invitation pour :</p>
              <p className="text-blue-700">📧 {invitationData.email}</p>
              <p className="text-blue-700">👤 {invitationData.full_name}</p>
              <p className="text-blue-700">🎯 Rôle : {invitationData.role}</p>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <Input
              type="password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={settingPassword}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Utilisez des lettres, chiffres et caractères spéciaux
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <Input
              type="password"
              placeholder="Répétez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={settingPassword}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleAcceptInvitation}
            disabled={settingPassword || !password || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {settingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activation en cours...
              </>
            ) : (
              'Activer mon compte'
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            En activant votre compte, vous acceptez nos conditions d'utilisation
            et notre politique de confidentialité.
          </p>
        </div>
      </Card>
    </div>
  )
}

// Wrapper avec Suspense pour useSearchParams
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}