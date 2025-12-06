"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"

export function ProfileSettings() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    position: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    console.log("Profil sauvegardé:", formData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informations Personnelles</h2>

          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user?.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600 capitalize">
                {user?.role === "admin"
                  ? "Administrateur"
                  : user?.role === "supervisor"
                    ? "Chef de Chantier"
                    : "Ingénieur Structure"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nom Complet</label>
              <Input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Téléphone</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Poste</label>
              <Input name="position" value={formData.position} onChange={handleChange} disabled={!isEditing} />
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Modifier</Button>
            ) : (
              <>
                <Button onClick={handleSave}>Sauvegarder</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
