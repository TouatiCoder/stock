"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function CompanySettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "BuildStock Pro",
    siret: "12345678901234",
    email: "contact@buildstock.com",
    phone: "+212 5XX XXX XXX",
    address: "Riyadh, Arabie Saoudite",
    currency: "MAD",
    taxRate: "20",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    console.log("Paramètres entreprise sauvegardés:", formData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informations d'Entreprise</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nom de l'Entreprise</label>
              <Input name="companyName" value={formData.companyName} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">SIRET</label>
              <Input name="siret" value={formData.siret} onChange={handleChange} disabled={!isEditing} />
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Adresse</label>
              <Input name="address" value={formData.address} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Devise</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value="MAD">MAD (Dirham)</option>
                <option value="USD">USD (Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Taux de TVA (%)</label>
              <Input
                name="taxRate"
                type="number"
                value={formData.taxRate}
                onChange={handleChange}
                disabled={!isEditing}
              />
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
