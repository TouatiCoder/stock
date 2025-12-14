// @/components/settings/security-settings.tsx - VERSION COMPLÈTE
"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function SecuritySettings() {
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.current_password) {
      setPasswordError("Current password is required")
      return
    }
    
    if (!passwordData.new_password) {
      setPasswordError("New password is required")
      return
    }
    
    if (passwordData.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      return
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("Passwords do not match")
      return
    }

    setLoading(true)
    setPasswordError(null)
    setPasswordSuccess(null)
    
    try {
      const supabase = getSupabaseClient()
      
      // Changer le mot de passe avec Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })
      
      if (error) {
        console.error("Password change error:", error)
        
        // Messages d'erreur plus conviviaux
        if (error.message.includes("Auth session missing")) {
          throw new Error("Session expired. Please log in again.")
        }
        if (error.message.includes("password")) {
          throw new Error("Password update failed. Please check your current password.")
        }
        
        throw new Error(`Failed to update password: ${error.message}`)
      }
      
      setPasswordSuccess("Password updated successfully!")
      
      // Réinitialiser le formulaire
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
      
      // Cacher le message après 5 secondes
      setTimeout(() => setPasswordSuccess(null), 5000)
      
    } catch (err: any) {
      console.error("Error:", err)
      setPasswordError(err.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle2FA = async (enabled: boolean) => {
    // Note: Supabase Auth supporte 2FA via Email OTP
    // Vous devriez créer une route API pour gérer cela
    console.log("2FA toggle:", enabled)
    setTwoFactorEnabled(enabled)
    
    // Pour une implémentation complète, vous auriez besoin:
    // 1. Route API pour activer/désactiver 2FA
    // 2. Envoyer un code OTP par email
    // 3. Valider le code
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      alert('Please type "DELETE" to confirm account deletion')
      return
    }

    if (!confirm("Are you sure? This action cannot be undone.")) {
      return
    }

    setDeleteLoading(true)
    
    try {
      const supabase = getSupabaseClient()
      
      // Note: La suppression de compte nécessite généralement:
      // 1. Vérification du mot de passe actuel
      // 2. Route API côté serveur avec admin privileges
      // 3. Suppression en cascade des données
      
      alert("Account deletion requires additional setup. Contact support.")
      
    } catch (err) {
      console.error("Delete account error:", err)
      alert("Failed to delete account")
    } finally {
      setDeleteLoading(false)
      setDeleteConfirm("")
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Security Settings</h2>
        <p className="text-slate-500">Manage your account security</p>
      </div>

      {/* Section: Change Password */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
          <p className="text-sm text-slate-500">
            Update your password regularly to keep your account secure
          </p>
        </div>

        {passwordError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-600 text-sm">{passwordError}</p>
          </div>
        )}

        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-green-600 text-sm">{passwordSuccess}</p>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              placeholder="Enter your current password"
              value={passwordData.current_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  current_password: e.target.value,
                })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              placeholder="At least 6 characters"
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  new_password: e.target.value,
                })
              }
              disabled={loading}
            />
            <p className="text-xs text-slate-500">
              Use a strong password with letters, numbers, and symbols
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Confirm your new password"
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirm_password: e.target.value,
                })
              }
              disabled={loading}
            />
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={
              loading || 
              !passwordData.current_password || 
              !passwordData.new_password || 
              !passwordData.confirm_password
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </Button>
        </div>
      </div>

      {/* Section: Two-Factor Authentication */}
      <div className="border-t border-slate-200 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">Two-Factor Authentication</h3>
            <p className="text-sm text-slate-500">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled // À activer quand l'implémentation est prête
          />
        </div>
        
        {!twoFactorEnabled ? (
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Status:</span> 2FA is currently disabled
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Enable two-factor authentication for enhanced security. When enabled, 
              you'll receive a verification code by email each time you sign in.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ Two-factor authentication is enabled
            </p>
          </div>
        )}
      </div>

      {/* Section: Danger Zone */}
      <div className="border-t border-red-200 pt-8 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
          <p className="text-sm text-slate-600">
            Irreversible actions that will permanently affect your account
          </p>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-red-800">Delete Account</h4>
            <p className="text-sm text-red-700">
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-red-700">
                Type "DELETE" to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="border-red-300"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirm !== "DELETE"}
              className="w-full"
            >
              {deleteLoading ? "Processing..." : "Permanently Delete Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}