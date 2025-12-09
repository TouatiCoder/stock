// @/components/settings/profile-settings.tsx - VERSION AMÉLIORÉE
"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfileSettingsProps {
  user: User | null
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialiser les données quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      setError("Full name is required")
      return
    }
    
    if (formData.full_name.trim().length < 2) {
      setError("Full name must be at least 2 characters")
      return
    }

    setLoading(true)
    setError(null)
    setSaved(false)
    
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to update profile (${response.status})`)
      }

      setSaved(true)
      
      // Rafraîchir les données après succès
      window.dispatchEvent(new Event('profile-updated'))
      
      // Cacher le message de succès après 3 secondes
      setTimeout(() => setSaved(false), 3000)
      
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Please log in to view profile settings</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Profile Settings</h2>
        <p className="text-slate-500">Update your personal information</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">Success</p>
          <p className="text-green-600 text-sm">Profile updated successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input 
            id="full_name" 
            value={formData.full_name} 
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
            placeholder="Enter your full name"
            disabled={loading}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+212 6XX-XXXXXX"
            disabled={loading}
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            value={formData.email} 
            disabled 
            className="bg-slate-50"
          />
          <p className="text-xs text-slate-500">
            Contact support to change your email address
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          onClick={handleSave} 
          disabled={loading || !formData.full_name.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setFormData({
              full_name: user.full_name || "",
              email: user.email || "",
              phone: user.phone || "",
            })
            setError(null)
            setSaved(false)
          }}
          disabled={loading}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}