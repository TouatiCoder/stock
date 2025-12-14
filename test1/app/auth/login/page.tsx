"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Fingerprint, Lock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseClient> | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authType, setAuthType] = useState<"password" | "webauthn" | null>(null)
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false)

  const searchParams = useSearchParams()

  // -------- INIT SUPABASE --------
  useEffect(() => {
    setSupabase(getSupabaseClient())
  }, [])

  // -------- CHECK WEBAUTHN SUPPORT --------
  useEffect(() => {
    setIsWebAuthnSupported(
      typeof window !== "undefined" &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    )
  }, [])

  // -------- UTILITAIRE BASE64URL -> UINT8ARRAY --------
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

  // -------- LOGIN PASSWORD --------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setLoading(true)
    setError(null)

    try {

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw new Error(error.message)

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No session created")

      const redirect = searchParams.get("redirect") || "/dashboard"
     router.push(redirect)
     router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      setLoading(false)
    }
  }

  // -------- LOGIN WEBAUTHN --------
  const handlePasskeyLogin = async () => {
    if (!supabase) return
    if (!email) {
      setError("Please enter your email first")
      return
    }
    if (!isWebAuthnSupported) {
      setError("Biometric authentication not supported in this browser.")
      return
    }

    setAuthType("webauthn")
    setLoading(true)
    setError(null)

    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!isAvailable) throw new Error("No platform authenticator available.")

      // Récupérer les options d'auth depuis le backend
      const optionsRes = await fetch(`/api/webauthn/login?email=${encodeURIComponent(email)}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      const options = await optionsRes.json()
      if (options.error) throw new Error(options.error)

      const publicKey: PublicKeyCredentialRequestOptions = {
        ...options,
        challenge: base64UrlToUint8Array(options.challenge),
        timeout: 60000,
      }
      if (options.allowCredentials) {
        publicKey.allowCredentials = options.allowCredentials.map((c: any) => ({
          ...c,
          id: base64UrlToUint8Array(c.id),
        }))
      }

      const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential
      if (!assertion) throw new Error("Authentication cancelled")

      const response = assertion.response as AuthenticatorAssertionResponse
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
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
          userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : null,
        },
        clientExtensionResults: assertion.getClientExtensionResults(),
      }

      // Vérification backend
      const verificationRes = await fetch("/api/webauthn/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ assertionResponse, email }),
      })
      const verification = await verificationRes.json()
      if (verification.error) throw new Error(verification.error)

      if (verification.token) localStorage.setItem('webauthn_token', verification.token)

      const redirect = searchParams.get("redirect") || "/dashboard"
      window.location.href = redirect

    } catch (err) {
      setError(err instanceof Error ? err.message : "Biometric login failed")
      setLoading(false)
    }
  }

  const handleToggleAuthMethod = () => {
    setAuthType(null)
    setError(null)
  }

  const getLoadingMessage = () => {
    if (!authType) return "Signing in..."
    return authType === "webauthn" ? "Waiting for biometric authentication..." : "Signing in with password..."
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

          {isWebAuthnSupported && !authType && (
            <Alert className="bg-blue-50 border-blue-200">
              <Fingerprint className="h-4 w-4" />
              <AlertDescription className="text-blue-700">
                You can use Face ID, Touch ID, or Windows Hello for faster, secure login.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="animate-in fade-in duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isWebAuthnSupported && !authType && (
            <Button type="button" className="w-full mb-4" onClick={handlePasskeyLogin} disabled={loading} variant="outline">
              <Fingerprint className="mr-2 h-4 w-4" /> Sign in with Face ID / Fingerprint
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">Email</label>
              </div>
              <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => { setEmail(e.target.value); handleToggleAuthMethod() }} required disabled={loading} />
            </div>

            {authType === "password" && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-slate-400" />
                  <label className="text-sm font-medium text-slate-700">Password</label>
                </div>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} onClick={() => setAuthType("password")}>
              {loading ? <span className="flex items-center justify-center"><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />{getLoadingMessage()}</span> : "Sign In with Password"}
            </Button>
          </form>

          {isWebAuthnSupported && authType === "password" && (
            <Button type="button" variant="ghost" className="w-full text-sm" onClick={handleToggleAuthMethod} disabled={loading}>
              <Fingerprint className="mr-2 h-3 w-3" /> Use biometric login instead
            </Button>
          )}

          <div className="space-y-2 text-center text-sm">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline block">Forgot password?</Link>
            <p className="text-slate-500">Don't have an account? <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link></p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">Your data is secured with end-to-end encryption. Biometric data never leaves your device.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
