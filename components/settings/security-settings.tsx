"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { useState } from "react"

export function SecuritySettings() {
  const [changePassword, setChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSavePassword = () => {
    console.log("Mot de passe changé")
    setChangePassword(false)
    setPasswordForm({ current: "", new: "", confirm: "" })
  }

  return (
    <div className="space-y-6">
      {/* Changer le mot de passe */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Changer le Mot de Passe</h2>

          {!changePassword ? (
            <Button onClick={() => setChangePassword(true)}>Modifier le Mot de Passe</Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Mot de passe actuel</label>
                <PasswordInput
                  name="current"
                  value={passwordForm.current}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nouveau mot de passe</label>
                <PasswordInput
                  name="new"
                  value={passwordForm.new}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Confirmer le mot de passe</label>
                <PasswordInput
                  name="confirm"
                  value={passwordForm.confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSavePassword}>Sauvegarder</Button>
                <Button variant="outline" onClick={() => setChangePassword(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Authentification biométrique */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentification Biométrique</h2>
          <p className="text-gray-600 text-sm mb-4">
            Activez la reconnaissance faciale ou l'empreinte digitale pour un accès rapide.
          </p>
          <Button variant="outline">Configurer la Biométrie</Button>
        </div>
      </Card>

      {/* Sessions actives */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sessions Actives</h2>
          <div className="space-y-3">
            {[
              { device: "Chrome sur Windows", location: "Riyadh, SA", lastActive: "Il y a 2 min", current: true },
              { device: "Safari sur iPhone", location: "Dammam, SA", lastActive: "Il y a 1h" },
            ].map((session, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{session.device}</p>
                  <p className="text-xs text-gray-600">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm">
                    Déconnecter
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
