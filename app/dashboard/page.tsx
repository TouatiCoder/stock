"use client"

import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { SupervisorDashboard } from "@/components/dashboards/supervisor-dashboard"
import { EngineerDashboard } from "@/components/dashboards/engineer-dashboard"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  // Pendant le chargement
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                  <p className="text-gray-600 mt-1">
                    Bienvenue, {user?.first_name || user?.email || "Utilisateur"}
                  </p>
                </div>

                {/* CORRECTION ICI : utilise les bons noms de rôle */}
                {user?.role === "admin" && <AdminDashboard />}
                {user?.role === "site_manager" && <SupervisorDashboard />}
                {user?.role === "structural_engineer" && <EngineerDashboard />}
                
                {/* Fallback si aucun rôle ne correspond */}
                {!["admin", "site_manager", "structural_engineer"].includes(user?.role || "") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-yellow-800">Rôle non reconnu</h2>
                    <p className="text-yellow-700 mt-2">
                      Votre rôle ({user?.role}) n'a pas de tableau de bord spécifique.
                    </p>
                    <p className="text-sm text-yellow-600 mt-2">
                      Contactez votre administrateur pour attribuer un rôle valide.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}