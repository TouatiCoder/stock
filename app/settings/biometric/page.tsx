// app/settings/biometric/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Fingerprint, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Smartphone
} from "lucide-react"
import { biometricService } from "@/lib/services/biometricService"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function BiometricSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  useEffect(() => {
    checkBiometricStatus()
  }, [user])

  const checkBiometricStatus = async () => {
    if (!user) return

    // Vérifier la disponibilité
    const isAvailable = await checkWebAuthnSupport()
    setBiometricAvailable(isAvailable)

    // Vérifier si déjà enregistré
    const hasCreds = await biometricService.hasBiometricCredentials(user.id)
    setHasBiometric(hasCreds)
  }

  const checkWebAuthnSupport = async () => {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      } catch (error) {
        return false
      }
    }
    return false
  }

  const handleRegisterBiometric = async () => {
    if (!user) {
      toast.error("Vous devez être connecté")
      return
    }

    try {
      setLoading(true)
      toast.loading("Préparation de l'enregistrement biométrique...")

      await biometricService.registerBiometric(user.id)
      
      toast.dismiss()
      toast.success("✅ Empreinte biométrique enregistrée avec succès !")
      setHasBiometric(true)
      
      // Stocker dans localStorage pour une détection rapide
      localStorage.setItem('biometric_registered', 'true')

    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement:', error)
      toast.dismiss()
      
      if (error.name === 'NotAllowedError') {
        toast.error("L'enregistrement a été annulé")
      } else if (error.name === 'NotSupportedError') {
        toast.error("Votre appareil ne supporte pas cette fonctionnalité")
      } else {
        toast.error("Erreur lors de l'enregistrement biométrique")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBiometric = async () => {
    if (!confirm("Supprimer votre empreinte biométrique ?")) return

    try {
      setLoading(true)
      
      // Supprimer de la base de données
      const { error } = await supabase
        .from('user_biometric_credentials')
        .delete()
        .eq('user_id', user?.id)

      if (error) throw error

      // Supprimer du localStorage
      localStorage.removeItem('biometric_registered')
      
      toast.success("Empreinte biométrique supprimée")
      setHasBiometric(false)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setLoading(false)
    }
  }

  const getDeviceBiometricType = () => {
    const ua = navigator.userAgent
    
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'Face ID ou Touch ID'
    if (ua.includes('Mac')) return 'Touch ID'
    if (ua.includes('Windows')) return 'Windows Hello'
    if (ua.includes('Android')) return 'Empreinte digitale'
    
    return 'authentification biométrique'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Authentification Biométrique
        </h1>
        <p className="text-gray-600">
          Sécurisez votre compte avec {getDeviceBiometricType()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte principale */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Fingerprint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {getDeviceBiometricType()}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Ajoutez une couche de sécurité supplémentaire
                  </p>
                </div>
              </div>

              {!biometricAvailable ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-900 mb-1">
                        Non disponible
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Votre navigateur ou appareil ne supporte pas l'authentification biométrique.
                        Assurez-vous d'utiliser HTTPS et un navigateur moderne.
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasBiometric ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-green-900 text-lg mb-1">
                        ✅ Activée
                      </h3>
                      <p className="text-green-700">
                        Vous pouvez maintenant utiliser {getDeviceBiometricType()} pour vous connecter.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleRemoveBiometric}
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      Supprimer l'empreinte biométrique
                    </Button>
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      Tester la connexion
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-medium text-blue-900 mb-3">
                      Pourquoi ajouter l'authentification biométrique ?
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Sécurité renforcée contre le phishing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Connexion rapide sans mot de passe</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Protection unique par appareil</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleRegisterBiometric}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Configuration en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Fingerprint size={20} />
                        <span>Configurer {getDeviceBiometricType()}</span>
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Informations de sécurité */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Informations de sécurité
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  L'authentification biométrique utilise les fonctionnalités de sécurité intégrées 
                  à votre appareil. Vos données biométriques ne quittent jamais votre appareil.
                </p>
                <p>
                  Chaque empreinte est cryptée et stockée localement. BuildStock Pro ne reçoit 
                  que des clés cryptographiques uniques.
                </p>
                <p className="text-xs text-gray-500">
                  ℹ️ Pour des raisons de sécurité, HTTPS est requis pour cette fonctionnalité.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Disponibilité</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Appareils pris en charge :</span>
                  <span className="text-sm font-medium">iPhone, iPad, Mac, Android, Windows</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Navigateurs :</span>
                  <span className="text-sm font-medium">Chrome, Safari, Edge, Firefox</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sécurité :</span>
                  <span className="text-sm font-medium text-green-600">Maximale</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Prochaines étapes</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">1</span>
                  </div>
                  <p>Enregistrez votre empreinte ou votre visage</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">2</span>
                  </div>
                  <p>Utilisez-la pour vous connecter à l'application</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">3</span>
                  </div>
                  <p>Configurez une méthode de secours (SMS, email)</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}