"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Fingerprint, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authType, setAuthType] = useState<"password" | "webauthn" | null>(null)

  const router = useRouter()
  const supabase = getSupabaseClient()

  const isWebAuthnSupported =
    typeof window !== "undefined" && 
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'

  // -------- LOGIN CLASSIQUE --------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    
    setAuthType("password")
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (authError) {
        throw new Error(authError.message)
      }
      
      if (!data.user) {
        throw new Error("No user returned from authentication")
      }
      
      // Vérifier si l'utilisateur a confirmé son email
      if (data.user.email_confirmed_at === null) {
        throw new Error("Please verify your email address before logging in")
      }
      
      router.push("/dashboard")
      router.refresh() // Rafraîchir les données côté serveur
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Fonction utilitaire pour convertir Base64URL → Uint8Array
  const base64UrlToUint8Array = (base64Url: string): Uint8Array => {
    // Ajouter le padding si nécessaire
    const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
    const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
    
    try {
      const rawData = atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }
      return outputArray
    } catch (error) {
      throw new Error("Invalid base64Url string")
    }
  }

  // -------- LOGIN PASSKEY / WEBAUTHN --------
 const handlePasskeyLogin = async () => {
  if (!email) {
    setError("Please enter your email first")
    return
  }

  // Vérifier si WebAuthn est disponible
  if (!isWebAuthnSupported) {
    setError("Biometric authentication is not supported by your browser. Please use Chrome, Safari, or Edge.")
    return
  }

  setAuthType("webauthn")
  setLoading(true)
  setError(null)

  try {
    // 1. Vérifier la disponibilité de l'authentificateur
    const isPlatformAuthenticatorAvailable = await PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable()
    
    if (!isPlatformAuthenticatorAvailable) {
      throw new Error("No platform authenticator (Face ID/Touch ID/Windows Hello) is available on this device")
    }

    // 2. Récupérer les options d'authentification
    const optionsResponse = await fetch(
      `/api/webauthn/login?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    )

    if (!optionsResponse.ok) {
      const errorData = await optionsResponse.json()
      throw new Error(errorData.error || `HTTP error! status: ${optionsResponse.status}`)
    }

    const options = await optionsResponse.json()
    
    if (options.error) {
      throw new Error(options.error)
    }

    // 3. Préparer les données d'authentification
    const publicKey: PublicKeyCredentialRequestOptions = {
      ...options,
      challenge: base64UrlToUint8Array(options.challenge),
      timeout: 60000,
    }

    // Ajouter les credentials si disponibles
    if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
      publicKey.allowCredentials = options.allowCredentials.map((c: any) => ({
        ...c,
        id: base64UrlToUint8Array(c.id),
      }))
    }

    // 4. Lancer l'authentification
    const assertion = await navigator.credentials.get({
      publicKey,
      mediation: 'optional' as CredentialMediationRequirement,
    }) as PublicKeyCredential

    if (!assertion) {
      throw new Error("Authentication cancelled by user")
    }

    // 5. Convertir la réponse en format compatible
    const response = assertion.response as AuthenticatorAssertionResponse
    
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return btoa(binary)
    }

    const assertionResponse = {
      id: assertion.id,
      rawId: arrayBufferToBase64(assertion.rawId),
      type: assertion.type,
      response: {
        authenticatorData: arrayBufferToBase64(response.authenticatorData),
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        signature: arrayBufferToBase64(response.signature),
        userHandle: response.userHandle 
          ? arrayBufferToBase64(response.userHandle)
          : null,
      },
      clientExtensionResults: assertion.getClientExtensionResults(),
    }

    // 6. Vérifier avec le backend
    const verificationResponse = await fetch("/api/webauthn/login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({ 
        assertionResponse,
        email 
      }),
    })

    const verification = await verificationResponse.json()

    if (verification.error) {
      throw new Error(verification.error)
    }

    // ✅ GESTION DU TOKEN CUSTOM
    if (verification.token) {
      // Stocker pour usage futur
      localStorage.setItem('webauthn_token', verification.token)
      
      // Optionnel : valider le token avec Supabase
      try {
        const { error: tokenError } = await supabase
          .from("webauthn_sessions")
          .select("*")
          .eq("token", verification.token)
          .single()
          
        if (tokenError) {
          console.warn("Token validation note:", tokenError.message)
        }
      } catch (tokenErr) {
        console.warn("Token check skipped:", tokenErr)
      }
    }

    // 7. Rediriger vers le dashboard
    router.push("/dashboard")
    router.refresh()
    
  } catch (err) {
    console.error("WebAuthn error:", err)
    
    if (err instanceof DOMException) {
      switch (err.name) {
        case "NotAllowedError":
          setError("Authentication was cancelled or timed out. Please try again.")
          break
        case "SecurityError":
          setError("Security error. Please ensure you're using HTTPS (required for biometric authentication).")
          break
        case "NotSupportedError":
          setError("Your browser doesn't support biometric authentication.")
          break
        default:
          setError(`Authentication error: ${err.message}`)
      }
    } else if (err instanceof Error) {
      if (err.message.includes("User not found") || err.message.includes("No passkey")) {
        setError("No passkey found for this email. Please sign in with password first, then register a passkey.")
      } else {
        setError(err.message)
      }
    } else {
      setError("Biometric authentication failed. Please try again or use password login.")
    }
  } finally {
    setLoading(false)
  }
}

  // Fonction pour basculer entre les modes d'authentification
  const handleToggleAuthMethod = () => {
    if (isWebAuthnSupported) {
      setError(null)
      setAuthType(null)
    }
  }

  // Message de chargement contextuel
  const getLoadingMessage = () => {
    if (!authType) return "Signing in..."
    
    return authType === "webauthn" 
      ? "Waiting for biometric authentication..."
      : "Signing in with password..."
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">BuildStock Pro</h1>
            <p className="text-slate-500">Construction Management System</p>
          </div>

          {/* Message d'information pour WebAuthn */}
          {isWebAuthnSupported && !authType && (
            <Alert className="bg-blue-50 border-blue-200">
              <Fingerprint className="h-4 w-4" />
              <AlertDescription className="text-blue-700">
                You can use Face ID, Touch ID, or Windows Hello for faster, more secure login.
              </AlertDescription>
            </Alert>
          )}

          {/* Affichage des erreurs */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Bouton WebAuthn */}
          {isWebAuthnSupported && !authType && (
            <Button
              type="button"
              className="w-full mb-4 transition-all hover:shadow-lg"
              onClick={handlePasskeyLogin}
              disabled={loading}
              variant="outline"
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              Sign in with Face ID / Fingerprint
            </Button>
          )}

          {/* Séparateur */}
          {isWebAuthnSupported && !authType && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>
          )}

          {/* Formulaire de connexion */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Email</label>
              </div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  handleToggleAuthMethod()
                }}
                required
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {authType === "password" && (
              <div className="space-y-2 animate-in slide-in-from-top duration-300">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-slate-400" />
                  <label className="text-sm font-medium text-slate-700">Password</label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full transition-all hover:shadow-lg" 
              disabled={loading}
              onClick={() => setAuthType("password")}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {getLoadingMessage()}
                </span>
              ) : (
                "Sign In with Password"
              )}
            </Button>
          </form>

          {/* Lien pour basculer vers WebAuthn */}
          {isWebAuthnSupported && authType === "password" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={handleToggleAuthMethod}
              disabled={loading}
            >
              <Fingerprint className="mr-2 h-3 w-3" />
              Use biometric login instead
            </Button>
          )}

          <div className="space-y-2 text-center text-sm">
            <Link 
              href="/auth/forgot-password" 
              className="text-blue-600 hover:underline transition-colors block"
            >
              Forgot password?
            </Link>
            <p className="text-slate-500">
              Don't have an account?{" "}
              <Link 
                href="/auth/signup" 
                className="text-blue-600 hover:underline font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Information sur la sécurité */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Your data is secured with end-to-end encryption. 
              Biometric data never leaves your device.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}