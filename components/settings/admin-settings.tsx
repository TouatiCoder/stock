"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Trash2, Mail } from "lucide-react"

export function AdminSettings() {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "supervisor",
  })

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInviteForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSendInvite = () => {
    console.log("Invitation envoyée:", inviteForm)
    setInviteForm({ email: "", role: "supervisor" })
    setShowInviteForm(false)
  }

  const employees = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@buildstock.com",
      role: "supervisor",
      status: "Actif",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Fatima Noor",
      email: "fatima@buildstock.com",
      role: "engineer",
      status: "Actif",
      joinDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Mohamed Karim",
      email: "mohamed@buildstock.com",
      role: "supervisor",
      status: "En attente",
      joinDate: "2024-12-01",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Invitation */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inviter un Employé</h2>

          {!showInviteForm ? (
            <Button onClick={() => setShowInviteForm(true)} className="flex items-center gap-2">
              <Mail size={18} />
              Inviter un nouvel employé
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email de l'employé</label>
                <Input
                  type="email"
                  name="email"
                  value={inviteForm.email}
                  onChange={handleInviteChange}
                  placeholder="employe@exemple.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Rôle</label>
                <select
                  name="role"
                  value={inviteForm.role}
                  onChange={handleInviteChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="supervisor">Chef de Chantier</option>
                  <option value="engineer">Ingénieur Structure</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendInvite}>Envoyer l'invitation</Button>
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Liste des employés */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Employés</h2>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-600">{emp.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {emp.role === "supervisor" ? "Chef de Chantier" : "Ingénieur Structure"} • {emp.status} • Depuis{" "}
                    {emp.joinDate}
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
