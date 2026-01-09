"use client"

import React, { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Lock, Smartphone, LogOut, Shield } from "lucide-react"

export function SecuritySettings() {
  const router = useRouter()

  const [changePassword, setChangePassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  /* ---------------------------------- */
  /* Utils                              */
  /* ---------------------------------- */

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  /* ---------------------------------- */
  /* Password change (SECURED)          */
  /* ---------------------------------- */

  const handleSavePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error("Tous les champs sont requis")
      return
    }

    if (passwordForm.new.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("Utilisateur introuvable")

      // 🔐 RE-AUTH avec mot de passe actuel
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.current,
      })

      if (reAuthError) {
        toast.error("Mot de passe actuel incorrect")
        return
      }

      // 🔑 Mise à jour du mot de passe
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new,
      })

      if (error) throw error

      toast.success("Mot de passe modifié avec succès")

      // 🔒 Déconnexion globale
      await supabase.auth.signOut({ scope: "global" })

      router.push("/login")
      toast.info("Reconnectez-vous avec votre nouveau mot de passe")
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors du changement de mot de passe")
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------- */
  /* Sessions                           */
  /* ---------------------------------- */

  const fetchActiveSessions = async () => {
    try {
      setLoadingSessions(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("logged_in_at", { ascending: false })

      if (error) throw error

      setActiveSessions(data || [])

      // 👉 première session = session courante
      if (data && data.length > 0) {
        setCurrentSessionId(data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          logged_out_at: new Date().toISOString(),
        })
        .eq("id", sessionId)

      toast.success("Session déconnectée")
      fetchActiveSessions()
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la déconnexion")
    }
  }

  const handleLogoutAllSessions = async () => {
    if (!confirm("Déconnecter toutes les autres sessions ?")) return

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !currentSessionId) return

      await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          logged_out_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .neq("id", currentSessionId)

      toast.success("Toutes les autres sessions ont été déconnectées")
      fetchActiveSessions()
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la déconnexion")
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------- */
  /* Effects                            */
  /* ---------------------------------- */

  useEffect(() => {
    fetchActiveSessions()
  }, [])

  /* ---------------------------------- */
  /* Render                             */
  /* ---------------------------------- */

  return (
    <div className="space-y-6">
      {/* PASSWORD */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold">Changer le mot de passe</h2>
        </div>

        {!changePassword ? (
          <Button onClick={() => setChangePassword(true)}>
            Modifier le mot de passe
          </Button>
        ) : (
          <div className="space-y-4">
            <PasswordInput
              name="current"
              placeholder="Mot de passe actuel"
              value={passwordForm.current}
              onChange={handlePasswordChange}
            />
            <PasswordInput
              name="new"
              placeholder="Nouveau mot de passe"
              value={passwordForm.new}
              onChange={handlePasswordChange}
            />
            <PasswordInput
              name="confirm"
              placeholder="Confirmer le mot de passe"
              value={passwordForm.confirm}
              onChange={handlePasswordChange}
            />

            <div className="flex gap-2">
              <Button onClick={handleSavePassword} disabled={loading}>
                <Shield size={16} /> Sauvegarder
              </Button>
              <Button
                variant="outline"
                onClick={() => setChangePassword(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* BIOMETRIC */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={20} className="text-green-600" />
          <h2 className="text-xl font-bold">Biométrie</h2>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            if (!window.PublicKeyCredential) {
              toast.error("Biométrie non supportée sur cet appareil")
              return
            }
            router.push("/settings/biometric")
          }}
        >
          Configurer
        </Button>
      </Card>

      {/* SESSIONS */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Sessions actives</h2>
          {activeSessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAllSessions}
              disabled={loading}
            >
              Tout déconnecter
            </Button>
          )}
        </div>

        {loadingSessions ? (
          <p>Chargement...</p>
        ) : activeSessions.length === 0 ? (
          <p>Aucune session active</p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((s, i) => (
              <div
                key={s.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">
                    {s.device_name || "Appareil inconnu"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(s.logged_in_at).toLocaleString("fr-FR")}
                  </p>
                </div>

                {s.id !== currentSessionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLogoutSession(s.id)}
                  >
                    <LogOut size={14} /> Déconnecter
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
