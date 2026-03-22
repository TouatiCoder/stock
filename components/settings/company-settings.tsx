"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/mysql/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useCommonTranslations, useSettingsTranslations } from "@/components/LocaleProvider"

export function CompanySettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const tCommon = useCommonTranslations()
  const tSettings = useSettingsTranslations()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    siret: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Maroc",
    currency: "MAD",
    tax_rate: "20.00",
    bank_info: "",
    ice: "",
    if: "",
  })

  const fetchCompanyData = async () => {
    if (!user?.companyId) return

    try {
      setIsLoading(true)
      const res = await fetch(`/api/company/${user.companyId}`)

      if (!res.ok) throw new Error(tSettings("companyLoadError"))

      const data = await res.json()

      setFormData({
        name: data.name || "",
        siret: data.siret || "",
        email: user?.email || data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        postal_code: data.postalCode || "",
        country: data.country || "Maroc",
        currency: data.currency || "MAD",
        tax_rate: data.taxRate?.toString() || "20.00",
        bank_info: data.bankInfo || "",
        ice: data.ice || "",
        if: data.if_id || "",
      })
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: tSettings("companyLoadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyData()
  }, [user?.companyId])

  useEffect(() => {
    if (!user?.email) return
    setFormData((prev) => ({ ...prev, email: user.email || "" }))
  }, [user?.email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user?.companyId) return

    try {
      setIsSaving(true)

      const res = await fetch(`/api/company/${user.companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: user.email || formData.email,
        }),
      })

      if (!res.ok) throw new Error(tSettings("companySaveError"))

      toast({
        title: tCommon("success"),
        description: tSettings("companySaveSuccess"),
      })

      setIsEditing(false)
      fetchCompanyData()
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: tSettings("companySaveError"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{tSettings("companyInfoTitle")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyNameLabel")}</label>
              <Input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companySiretLabel")}</label>
              <Input name="siret" value={formData.siret} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyEmailLabel")}</label>
              <Input name="email" value={formData.email} onChange={handleChange} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyPhoneLabel")}</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyAddressLabel")}</label>
              <Input name="address" value={formData.address} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyCityLabel")}</label>
              <Input name="city" value={formData.city} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyPostalCodeLabel")}</label>
              <Input name="postal_code" value={formData.postal_code} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyCountryLabel")}</label>
              <select name="country" value={formData.country} onChange={handleChange} disabled={!isEditing || isSaving} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="Maroc">{tCommon("countryMorocco")}</option>
                <option value="France">{tCommon("countryFrance")}</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyIceLabel")}</label>
              <Input name="ice" value={formData.ice} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{tSettings("companyIfLabel")}</label>
              <Input name="if" value={formData.if} onChange={handleChange} disabled={!isEditing || isSaving} />
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>{tCommon("edit")}</Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isSaving}>{tCommon("save")}</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>{tCommon("cancel")}</Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
