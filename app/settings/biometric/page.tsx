"use client"

import { useEffect, useState } from "react"
import { startRegistration } from "@simplewebauthn/browser"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Fingerprint, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function BiometricSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [supportChecked, setSupportChecked] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [isSecureContextReady, setIsSecureContextReady] = useState(true)
  const [deviceHint, setDeviceHint] = useState("Platform biometric")
  const [hasBiometric, setHasBiometric] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [pendingAction, setPendingAction] = useState<"enabling" | "disabling" | "removing" | null>(null)

  useEffect(() => {
    detectCapabilities()
    loadState()
  }, [])

  const getDeviceHint = (ua: string) => {
    const normalized = ua.toLowerCase()
    if (normalized.includes("windows")) return "Windows Hello (Face / Fingerprint / PIN)"
    if (normalized.includes("iphone") || normalized.includes("ipad") || normalized.includes("ipod")) return "Face ID"
    if (normalized.includes("android")) return "Biometric Prompt"
    if (normalized.includes("macintosh") || normalized.includes("mac os x")) return "Touch ID"
    return "Platform biometric"
  }

  const detectCapabilities = async () => {
    if (typeof window === "undefined") return

    setDeviceHint(getDeviceHint(window.navigator.userAgent))
    const localhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    setIsSecureContextReady(window.isSecureContext || localhost)

    if (
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      try {
        setBiometricAvailable(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
      } catch {
        setBiometricAvailable(false)
      } finally {
        setSupportChecked(true)
      }
      return
    }

    setBiometricAvailable(false)
    setSupportChecked(true)
  }

  const loadState = async () => {
    const res = await fetch("/api/auth/security-method", { cache: "no-store" })
    if (!res.ok) return
    const data = await res.json()
    setHasBiometric(Boolean(data.hasBiometric))
    setBiometricEnabled(data.authMethod === "biometric_password" || data.authMethod === "biometric_only")
  }

  const isUserCancelError = (error: unknown) => {
    const message = error instanceof Error ? `${error.name} ${error.message}`.toLowerCase() : ""
    return (
      message.includes("notallowederror") ||
      message.includes("aborterror") ||
      message.includes("cancel") ||
      message.includes("timed out")
    )
  }

  const saveAuthMethod = async (authMethod: "password_only" | "biometric_password") => {
    const res = await fetch("/api/auth/security-method", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authMethod }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to update security method")
  }

  const registerAndEnable = async () => {
    try {
      setLoading(true)
      setPendingAction("enabling")
      setStatusMessage("")

      const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" })
      const optionsData = await optionsRes.json()
      if (!optionsRes.ok) throw new Error(optionsData.error || "Failed to start registration")

      const registrationResponse = await startRegistration(optionsData.options)

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: registrationResponse }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verifyData.error || "Registration failed")

      await saveAuthMethod("biometric_password")
      setHasBiometric(true)
      setBiometricEnabled(true)
      setStatusMessage("Biometric authentication is enabled.")
      toast.success("Biometric credential registered and enabled")
    } catch (error: any) {
      setBiometricEnabled(false)
      if (isUserCancelError(error)) {
        setStatusMessage("Registration canceled.")
        toast.info("Registration canceled")
        return
      }
      toast.error(error?.message || "Registration failed")
    } finally {
      setLoading(false)
      setPendingAction(null)
    }
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      if (!isSecureContextReady) {
        toast.error("Biometric registration requires HTTPS in production")
        setBiometricEnabled(false)
        return
      }
      if (!biometricAvailable) {
        toast.error("Biometric platform authenticator is not available on this device/browser")
        setBiometricEnabled(false)
        return
      }
      await registerAndEnable()
      return
    }

    try {
      setLoading(true)
      setPendingAction("disabling")
      setStatusMessage("")
      await saveAuthMethod("password_only")
      setBiometricEnabled(false)
      setStatusMessage("Biometric authentication is disabled.")
      toast.success("Biometric authentication disabled")
    } catch (error: any) {
      toast.error(error?.message || "Failed to disable biometric authentication")
    } finally {
      setLoading(false)
      setPendingAction(null)
    }
  }

  const remove = async () => {
    try {
      setLoading(true)
      setPendingAction("removing")
      const res = await fetch("/api/webauthn/credentials", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to remove biometric credentials")

      setHasBiometric(false)
      setBiometricEnabled(false)
      await saveAuthMethod("password_only")
      toast.success("Biometric credentials removed")
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove biometric credentials")
    } finally {
      setLoading(false)
      setPendingAction(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Biometric Security</h1>
          </div>

          {supportChecked && !biometricAvailable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5" />
              <p className="text-sm text-amber-800">Your device does not support platform biometric authentication.</p>
            </div>
          )}

          {supportChecked && biometricAvailable && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-700 mt-0.5" />
              <p className="text-sm text-green-800">
                This device supports secure biometric authentication (Windows Hello / Face ID / Fingerprint).
              </p>
            </div>
          )}

          {!isSecureContextReady && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-700 mt-0.5" />
              <p className="text-sm text-red-800">HTTPS is required in production to enable biometric authentication.</p>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">Biometric Authentication</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Device Support:</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  biometricAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                }`}
              >
                {biometricAvailable ? `Supported (${deviceHint})` : "Not supported"}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Use your device biometric to login securely. No face images or fingerprints are stored.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">Enable Biometric Authentication</p>
              <p className="text-sm text-gray-500">
                {biometricEnabled ? "Enabled" : "Disabled"} {biometricAvailable ? "" : "(Biometric unavailable on this device)"}
              </p>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={handleToggle}
              disabled={loading || ((!biometricAvailable || !isSecureContextReady) && !biometricEnabled)}
              aria-label="Enable biometric authentication"
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Status:</p>
            <p className="font-medium text-gray-900">{biometricEnabled ? "Enabled on this device" : "Not enabled"}</p>
            {hasBiometric && <p className="text-xs text-green-700 mt-1">A biometric credential is already registered.</p>}
          </div>

          {loading && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {pendingAction === "enabling" && "Opening your device biometric prompt..."}
              {pendingAction === "disabling" && "Disabling biometric authentication..."}
              {pendingAction === "removing" && "Removing biometric credentials..."}
            </div>
          )}

          {statusMessage && <p className="text-sm text-gray-700">{statusMessage}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={remove} disabled={loading || !hasBiometric}>
              Remove
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            No face image or fingerprint image is stored. Only WebAuthn credential material is kept server-side.
          </p>
        </div>
      </Card>
    </div>
  )
}


