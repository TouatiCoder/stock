// @/components/settings/company-settings.tsx - VERSION COMPLÈTE
"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CompanySettingsData {
  id: string
  company_name: string
  industry: string
  employees: number | string
  location: string
  address?: string
  phone?: string
  email?: string
  currency?: string
  tax_rate?: number | string
}

export function CompanySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<CompanySettingsData>({
    id: "",
    company_name: "",
    industry: "",
    employees: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    currency: "MAD",
    tax_rate: "20.00",
  })

  // Charger les données depuis Supabase
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        
        const { data, error } = await supabase
          .from("company_settings")
          .select("*")
          .limit(1)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = aucun résultat
          console.error("Error fetching company settings:", error)
          // Utiliser des valeurs par défaut
          setFormData({
            id: "00000000-0000-0000-0000-000000000000",
            company_name: "BuildStock Pro",
            industry: "Construction",
            employees: "50",
            location: "Morocco",
            address: "",
            phone: "",
            email: "",
            currency: "MAD",
            tax_rate: "20.00",
          })
        } else if (data) {
          // Convertir les nombres en string pour l'input
          setFormData({
            ...data,
            employees: data.employees?.toString() || "",
            tax_rate: data.tax_rate?.toString() || "20.00",
          })
        }
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load company settings")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCompanySettings()
  }, [])

  const handleSave = async () => {
    // Validation
    if (!formData.company_name.trim()) {
      setError("Company name is required")
      return
    }
    
    if (!formData.employees || Number(formData.employees) <= 0) {
      setError("Number of employees must be greater than 0")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const supabase = getSupabaseClient()
      
      // Préparer les données avec les bons types
      const dataToSave = {
        ...formData,
        employees: Number(formData.employees),
        tax_rate: formData.tax_rate ? Number(formData.tax_rate) : 20.00,
        updated_at: new Date().toISOString(),
      }
      
      let error
      
      if (formData.id) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from("company_settings")
          .update(dataToSave)
          .eq("id", formData.id)
        
        error = updateError
      } else {
        // Insertion
        const { error: insertError } = await supabase
          .from("company_settings")
          .insert([{
            ...dataToSave,
            id: "00000000-0000-0000-0000-000000000000"
          }])
        
        error = insertError
      }
      
      if (error) {
        console.error("Error saving company settings:", error)
        throw new Error(`Failed to save: ${error.message}`)
      }
      
      setSuccess("Company settings saved successfully!")
      
      // Cacher le message après 3 secondes
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (err: any) {
      console.error("Save error:", err)
      setError(err.message || "Failed to save company settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Company Settings</h2>
          <p className="text-slate-500">Loading company information...</p>
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-slate-100 animate-pulse rounded"></div>
          <div className="h-10 bg-slate-100 animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Company Settings</h2>
        <p className="text-slate-500">Manage company information (Admin only)</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">Success</p>
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Enter company name"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g., Construction"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="employees">Number of Employees *</Label>
          <Input
            id="employees"
            type="number"
            min="1"
            value={formData.employees}
            onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Morocco"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+212 6XX-XXXXXX"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@company.com"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.currency || "MAD"}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="tax_rate">Tax Rate (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.tax_rate || "20.00"}
            onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
            disabled={saving}
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address || ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full company address"
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          onClick={handleSave} 
          disabled={saving || !formData.company_name.trim() || !formData.employees}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Company Settings"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}