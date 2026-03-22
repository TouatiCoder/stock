"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Fingerprint, Loader2, Lock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useSettingsTranslations } from "@/components/LocaleProvider"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

export function SecuritySettings() {
  const t = useSettingsTranslations()

  const [isLoading, setIsLoading] = useState(false)
  const [saving2FA, setSaving2FA] = useState(false)

  const [hasBiometric, setHasBiometric] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  useEffect(() => {
    loadSecurityState()
    checkBiometricAvailability()
  }, [])

  const loadSecurityState = async () => {
    try {
      const res = await fetch("/api/auth/security-method", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setHasBiometric(Boolean(data.hasBiometric))
      setTwoFactorEnabled(data.authMethod === "biometric_password")
    } catch (error) {
      console.error("Failed to load security state", error)
    }
  }

  const checkBiometricAvailability = async () => {
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setBiometricAvailable(available)
      } catch {
        setBiometricAvailable(false)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwords.new !== passwords.confirm) {
      toast.error(t("passwordsMismatchError"))
      return
    }

    if (passwords.new.length < 6) {
      toast.error(t("passwordMinLengthError"))
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t("updateErrorFallback"))

      toast.success(t("passwordUpdatedSuccess"))
      setPasswords({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveBiometric = async () => {
    if (!confirm("Remove all registered biometric credentials for this account?")) return

    try {
      const res = await fetch("/api/webauthn/credentials", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to remove biometric credentials")

      setHasBiometric(false)
      setTwoFactorEnabled(false)
      toast.success("Biometric credentials removed")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove biometric credentials")
    }
  }

  const handleToggle2FA = async (checked: boolean) => {
    try {
      setSaving2FA(true)
      if (checked) {
        if (!biometricAvailable) {
          toast.error("Biometric authentication is not available on this device/browser")
          return
        }
        if (!hasBiometric) {
          toast.info("Register a biometric credential from Settings > Biometric first")
          return
        }
      }

      const targetMethod = checked ? "biometric_password" : "password_only"
      const res = await fetch("/api/auth/security-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authMethod: targetMethod }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update 2FA setting")

      setTwoFactorEnabled(checked)
      toast.success(checked ? "2FA enabled" : "2FA disabled")
    } catch (error: any) {
      toast.error(error.message || "Failed to update 2FA setting")
    } finally {
      setSaving2FA(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Fingerprint className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">2FA (Biometric)</h2>
            <p className="text-sm text-gray-500">Enable or disable biometric second-factor sign-in.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <div>
            <p className="font-medium text-gray-900">Enable 2FA with biometric</p>
            <p className="text-sm text-gray-500">
              {twoFactorEnabled ? "Enabled" : "Disabled"} {biometricAvailable ? "" : "(Biometric unavailable on this device)"}
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={saving2FA}
            aria-label="Enable 2FA biometric"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {hasBiometric && (
            <Button variant="outline" onClick={handleRemoveBiometric} disabled={saving2FA}>
              Remove Biometric
            </Button>
          )}
          <Link href="/settings/biometric" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            Open biometric settings
          </Link>
          <span className="text-sm text-gray-600">Credential: {hasBiometric ? "Registered" : "Not registered"}</span>
        </div>

        {!twoFactorEnabled && (
          <p className="mt-4 text-sm text-gray-600">
            Biometric will not run while 2FA is disabled.
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("passwordTitle")}</h2>
            <p className="text-sm text-gray-500">{t("passwordDescription")}</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current">{t("currentPassword")}</Label>
            <Input id="current" name="current" type="password" value={passwords.current} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">{t("newPassword")}</Label>
            <Input id="new" name="new" type="password" value={passwords.new} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">{t("confirmNewPassword")}</Label>
            <Input id="confirm" name="confirm" type="password" value={passwords.confirm} onChange={handleChange} required />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("updatePasswordButton")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


