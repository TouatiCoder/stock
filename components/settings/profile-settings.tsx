"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/mysql/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useSettingsTranslations, useCommonTranslations } from "@/components/LocaleProvider"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const tSettings = useSettingsTranslations()
  const tCommon = useCommonTranslations()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedEmail = formData.email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error(tSettings("profileInvalidEmail"))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: normalizedEmail,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (data.code === "INVALID_EMAIL") {
          throw new Error(tSettings("profileInvalidEmail"))
        }
        if (data.code === "EMAIL_IN_USE") {
          throw new Error(tSettings("profileEmailInUse"))
        }
        throw new Error(data.error || tSettings("profileUpdateError"))
      }

      await refreshUser()
      toast.success(tSettings("profileUpdateSuccess"))
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || tSettings("profileUpdateFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">{tSettings("profileTitle")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{tSettings("firstName")}</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder={tSettings("firstNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{tSettings("lastName")}</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder={tSettings("lastNamePlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{tCommon("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
          />
          <p className="text-xs text-gray-500">{tSettings("emailCanBeChanged")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{tCommon("phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder={tSettings("phonePlaceholder")}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? tCommon("saving") : tCommon("save")}
          </Button>
        </div>
      </form>
    </Card>
  )
}
