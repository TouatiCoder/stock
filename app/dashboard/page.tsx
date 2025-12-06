"use client"

import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { SupervisorDashboard } from "@/components/dashboards/supervisor-dashboard"
import { EngineerDashboard } from "@/components/dashboards/engineer-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()

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
                  <p className="text-gray-600 mt-1">Bienvenue dans BuildStock Pro</p>
                </div>

                {user?.role === "admin" && <AdminDashboard />}
                {user?.role === "supervisor" && <SupervisorDashboard />}
                {user?.role === "engineer" && <EngineerDashboard />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
