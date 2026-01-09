"use client"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Fingerprint, Eye, Key, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)

  useEffect(() => {
    // Vérifier si l'API WebAuthn est disponible
    checkBiometricAvailability()
    checkBiometricRegistration()
  }, [])

  const checkBiometricAvailability = () => {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      Promise.all([
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
        PublicKeyCredential.isConditionalMediationAvailable()
      ]).then(results => {
        if (results.every(r => r === true)) {
          setBiometricAvailable(true)
        }
      })
    }
  }

  const checkBiometricRegistration = async () => {
    // Vérifier si l'utilisateur a déjà enregistré des identifiants biométriques
    // Vous pouvez stocker cette info dans localStorage ou dans votre DB
    const hasBiometric = localStorage.getItem('biometric_registered')
    setBiometricRegistered(hasBiometric === 'true')
  }

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) {
      toast.error("L'authentification biométrique n'est pas disponible sur cet appareil")
      return
    }

    try {
      setBiometricLoading(true)

      // Récupérer les identifiants enregistrés depuis votre backend
      const { data: credentials, error } = await supabase
        .from('user_biometric_credentials')
        .select('credential_id')
        .single()

      if (error || !credentials) {
        toast.info("Aucune empreinte biométrique enregistrée. Veuillez d'abord vous connecter avec votre mot de passe.")
        return
      }

      // Déclencher l'authentification WebAuthn
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // Doit venir du serveur
          allowCredentials: [{
            type: 'public-key',
            id: Uint8Array.from(atob(credentials.credential_id), c => c.charCodeAt(0))
          }],
          userVerification: 'required',
          timeout: 60000
        }
      })

      if (assertion) {
        // Envoyer l'assertion au serveur pour vérification
        const { data: user, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'webauthn',
          token: JSON.stringify(assertion)
        })

        if (authError) throw authError

        toast.success("Authentification biométrique réussie !")
        router.push('/dashboard')
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'authentification biométrique:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error("Authentification biométrique annulée ou échouée")
      } else if (error.name === 'NotSupportedError') {
        toast.error("Ce navigateur ne supporte pas l'authentification biométrique")
      } else {
        toast.error("Erreur lors de l'authentification biométrique")
      }
    } finally {
      setBiometricLoading(false)
    }
  }

  const handleConditionalUI = () => {
    // Authentification conditionnelle (sans interaction utilisateur)
    if (biometricAvailable) {
      navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          userVerification: 'required',
          timeout: 60000
        },
        mediation: 'conditional'
      }).then(assertion => {
        if (assertion) {
          // Gérer l'authentification réussie
          toast.success("Connecté avec succès !")
          router.push('/dashboard')
        }
      }).catch(error => {
        console.log('Conditional UI non disponible ou annulé:', error)
      })
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BuildStock Pro</h1>
          <p className="text-gray-600">Gestion intelligente de chantier</p>
        </div>

        {/* Authentification biométrique */}
        {biometricAvailable && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {biometricRegistered 
                  ? "Utilisez votre empreinte ou votre visage" 
                  : "Authentification biométrique disponible"}
              </p>
            </div>
            
            <Button
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {biometricLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Vérification en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Fingerprint size={20} />
                  <span>Se connecter avec biométrie</span>
                </div>
              )}
            </Button>

            {/* Indicateurs de méthode biométrique */}
            <div className="flex justify-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Face ID
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Touch ID
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                Windows Hello
              </div>
            </div>
          </div>
        )}

        {/* Diviseur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou continuer avec</span>
          </div>
        </div>

        {/* Formulaire de connexion classique */}
        <div className="mb-6">
          <LoginForm />
        </div>

        {/* Options supplémentaires */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/forgot-password')}
              className="flex items-center justify-center gap-2"
            >
              <Key size={16} />
              Mot de passe oublié
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/qr-login')}
              className="flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              QR Code
            </Button>
          </div>

          {/* Lien vers l'inscription */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <Link 
                href="/signup" 
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Section d'aide */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Sécurité renforcée
              </h3>
              <p className="text-xs text-blue-700">
                L'authentification biométrique offre une protection supplémentaire sans compromettre la simplicité d'utilisation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}