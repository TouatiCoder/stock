"use client"

import { useEffect, useState } from "react"
import { startRegistration } from "@simplewebauthn/browser"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Fingerprint, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSettingsTranslations } from "@/components/LocaleProvider"

export default function BiometricSettingsPage() {
  const t = useSettingsTranslations()
  const [loading, setLoading] = useState(false)
  const [supportChecked, setSupportChecked] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [isSecureContextReady, setIsSecureContextReady] = useState(true)
  const [deviceHint, setDeviceHint] = useState("")
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
    if (normalized.includes("windows")) return `${t("biometricDeviceWindowsHello")} (Face / ${t("biometricDeviceFingerprint")} / PIN)`
    if (normalized.includes("iphone") || normalized.includes("ipad") || normalized.includes("ipod")) return "Face ID"
    if (normalized.includes("android")) return t("biometricDeviceGeneric")
    if (normalized.includes("macintosh") || normalized.includes("mac os x")) return t("biometricDeviceTouchId")
    return t("biometricDeviceGeneric")
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
    if (!res.ok) throw new Error(data.error || t("biometricSaveMethodError"))
  }

  const registerAndEnable = async () => {
    try {
      setLoading(true)
      setPendingAction("enabling")
      setStatusMessage("")

      const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" })
      const optionsData = await optionsRes.json()
      if (!optionsRes.ok) throw new Error(optionsData.error || t("biometricStartRegistrationError"))

      const registrationResponse = await startRegistration(optionsData.options)

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: registrationResponse }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verifyData.error || t("biometricRegisterError"))

      await saveAuthMethod("biometric_password")
      setHasBiometric(true)
      setBiometricEnabled(true)
      setStatusMessage(t("biometricPageEnabledStatus"))
      toast.success(t("biometricEnableSuccess"))
    } catch (error: any) {
      setBiometricEnabled(false)
      if (isUserCancelError(error)) {
        setStatusMessage(t("biometricCanceled"))
        toast.info(t("biometricCanceled"))
        return
      }
      toast.error(error?.message || t("biometricRegisterError"))
    } finally {
      setLoading(false)
      setPendingAction(null)
    }
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      if (!isSecureContextReady) {
        toast.error(t("biometricPageHttpsRequired"))
        setBiometricEnabled(false)
        return
      }
      if (!biometricAvailable) {
        toast.error(t("biometricPageUnavailableError"))
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
      setStatusMessage(t("biometricPageDisabledStatus"))
      toast.success(t("biometricPageDisabledSuccess"))
    } catch (error: any) {
      toast.error(error?.message || t("biometricPageDisableError"))
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
      if (!res.ok) throw new Error(data.error || t("biometricRemoveError"))

      setHasBiometric(false)
      setBiometricEnabled(false)
      await saveAuthMethod("password_only")
      setStatusMessage(t("biometricPageRemovedStatus"))
      toast.success(t("biometricRemovedSuccess"))
    } catch (error: any) {
      toast.error(error?.message || t("biometricRemoveError"))
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
            <h1 className="text-xl font-bold">{t("biometricTitle")}</h1>
          </div>

          {supportChecked && !biometricAvailable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5" />
              <p className="text-sm text-amber-800">{t("biometricPageDeviceUnsupported")}</p>
            </div>
          )}

          {supportChecked && biometricAvailable && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-700 mt-0.5" />
              <p className="text-sm text-green-800">
                {t("biometricPageDeviceSupported")}
              </p>
            </div>
          )}

          {!isSecureContextReady && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-700 mt-0.5" />
              <p className="text-sm text-red-800">{t("biometricPageHttpsRequired")}</p>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">{t("biometricTitle")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">{t("biometricPageDeviceSupportLabel")}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  biometricAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                }`}
              >
                {biometricAvailable ? t("biometricPageSupportedWithDevice").replace("{device}", deviceHint) : t("biometricPageNotSupported")}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {t("biometricPageDescription")}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">{t("biometricPageToggleLabel")}</p>
              <p className="text-sm text-gray-500">
                {biometricEnabled ? t("biometricEnabledTitle") : t("twoFactorStatusDisabled")} {biometricAvailable ? "" : t("biometricPageUnavailableInline")}
              </p>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={handleToggle}
              disabled={loading || ((!biometricAvailable || !isSecureContextReady) && !biometricEnabled)}
              aria-label={t("biometricPageAriaLabel")}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">{t("biometricPageStatusLabel")}</p>
            <p className="font-medium text-gray-900">{biometricEnabled ? t("biometricPageEnabledStatus") : t("biometricPageDisabledStatus")}</p>
            {hasBiometric && <p className="text-xs text-green-700 mt-1">{t("biometricPageCredentialRegistered")}</p>}
          </div>

          {loading && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {pendingAction === "enabling" && t("biometricPageLoadingEnable")}
              {pendingAction === "disabling" && t("biometricPageLoadingDisable")}
              {pendingAction === "removing" && t("biometricPageLoadingRemove")}
            </div>
          )}

          {statusMessage && <p className="text-sm text-gray-700">{statusMessage}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={remove} disabled={loading || !hasBiometric}>
              {t("biometricRemoveButton")}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            {t("biometricPageFootnote")}
          </p>
        </div>
      </Card>
    </div>
  )
}


