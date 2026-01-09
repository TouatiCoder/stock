"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"

export function ProfileSettings() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",  // CHANGÉ DE 'name' À 'first_name'
    last_name: "",   // AJOUTÉ
    email: "",
    phone: "",
    role: "",        // CHANGÉ DE 'position' À 'role'
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    console.log("Profil sauvegardé:", formData)
    setIsEditing(false)
    // Ici vous ajouterez la logique pour sauvegarder dans Supabase
  }

  // CORRECTION : Obtenir le nom complet
  const getFullName = () => {
    if (!user) return "Nom non défini"
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Nom non défini"
  }

  // CORRECTION : Obtenir l'initiale
  const getInitial = () => {
    if (!user?.first_name) return "?"
    return user.first_name.charAt(0).toUpperCase()
  }

  // CORRECTION : Afficher le rôle selon votre schéma
  const getRoleDisplay = () => {
    switch (user?.role) {
      case "admin": return "Administrateur"
      case "site_manager": return "Chef de Chantier"
      case "structural_engineer": return "Ingénieur Structure"
      default: return user?.role || "Utilisateur"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informations Personnelles</h2>

          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {getInitial()}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{getFullName()}</p>
              <p className="text-sm text-gray-600">
                {getRoleDisplay()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Prénom</label>
              <Input 
                name="first_name" 
                value={formData.first_name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nom</label>
              <Input 
                name="last_name" 
                value={formData.last_name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <Input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Téléphone</label>
              <Input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rôle</label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner un rôle</option>
                <option value="admin">Administrateur</option>
                <option value="site_manager">Chef de Chantier</option>
                <option value="structural_engineer">Ingénieur Structure</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Modifier</Button>
            ) : (
              <>
                <Button onClick={handleSave}>Sauvegarder</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    // Réinitialiser les données avec les valeurs de l'utilisateur
                    if (user) {
                      setFormData({
                        first_name: user.first_name || "",
                        last_name: user.last_name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        role: user.role || "",
                      })
                    }
                  }}
                >
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