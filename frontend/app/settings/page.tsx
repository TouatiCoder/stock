"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { AdminSettings } from "@/components/settings/admin-settings"
import { CompanySettings } from "@/components/settings/company-settings"

export default function SettingsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "company" | "users">("profile")

  const tabs = [
    { id: "profile", label: "Mon Profil" },
    { id: "security", label: "Sécurité" },
    ...(hasPermission("edit_settings") ? [{ id: "company", label: "Paramètres Entreprise" }] : []),
    ...(hasPermission("edit_users") ? [{ id: "users", label: "Gestion Utilisateurs" }] : []),
  ]

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
                  <p className="text-gray-600 mt-1">Gérez vos préférences et paramètres de compte</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                {activeTab === "profile" && <ProfileSettings />}
                {activeTab === "security" && <SecuritySettings />}
                {activeTab === "company" && hasPermission("edit_settings") && <CompanySettings />}
                {activeTab === "users" && hasPermission("edit_users") && <AdminSettings />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
