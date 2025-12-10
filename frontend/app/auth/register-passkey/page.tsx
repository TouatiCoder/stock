"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Mail, AlertCircle, CheckCircle } from "lucide-react"

export default function RegisterPasskeyPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleRegisterPasskey = async () => {
    if (!email) {
      setError("Please enter your email")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Récupérer les options d'enregistrement
      const optionsResponse = await fetch(
        `/api/webauthn/register?email=${encodeURIComponent(email)}`
      )
      
      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || "Failed to get registration options")
      }

      const options = await optionsResponse.json()

      if (options.error) {
        throw new Error(options.error)
      }

      // 2. Convertir les données pour le navigateur
      const base64UrlToUint8Array = (base64Url: string): Uint8Array => {
        const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
        const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      const publicKey: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: base64UrlToUint8Array(options.challenge),
        user: {
          ...options.user,
          id: base64UrlToUint8Array(options.user.id),
        },
      }

      if (options.excludeCredentials) {
        publicKey.excludeCredentials = options.excludeCredentials.map((cred: any) => ({
          ...cred,
          id: base64UrlToUint8Array(cred.id),
        }))
      }

      // 3. Créer la passkey
      console.log("Creating passkey with options:", publicKey)
      const credential = await navigator.credentials.create({ 
        publicKey 
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error("Passkey creation cancelled")
      }

      // 4. Préparer la réponse pour l'API
      const response = credential.response as AuthenticatorAttestationResponse
      
      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
      }

      const registrationResponse = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: arrayBufferToBase64(response.attestationObject),
          clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        },
        clientExtensionResults: credential.getClientExtensionResults(),
      }

      // 5. Envoyer pour vérification
      const verificationResponse = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          registrationResponse,
          email 
        }),
      })

      const verification = await verificationResponse.json()

      if (verification.error) {
        throw new Error(verification.error)
      }

      setSuccess(true)
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)

    } catch (err) {
      console.error("Passkey registration error:", err)
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            setError("Registration was cancelled. Please try again.")
            break
          case "NotSupportedError":
            setError("Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge.")
            break
          default:
            setError(`Error: ${err.message}`)
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to create passkey. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Fingerprint className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Register Passkey</h1>
            <p className="text-slate-500">Add Face ID, Touch ID, or security key</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Passkey registered successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-slate-400" />
                  <label className="text-sm font-medium text-slate-700">Email</label>
                </div>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="transition-all focus:ring-2 focus:ring-green-500"
                />
              </div>

              <Button
                onClick={handleRegisterPasskey}
                disabled={loading || success}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Passkey...
                  </span>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Register Passkey
                  </>
                )}
              </Button>
            </>
          )}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              • Supports Windows Hello, Face ID, Touch ID, or security keys<br />
              • Works on phones, tablets, and computers<br />
              • More secure than passwords
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}