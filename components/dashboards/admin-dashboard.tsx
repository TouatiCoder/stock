"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/mysql/auth-context"
import DashboardCharts from "./dashboard-charts"
import { Briefcase, Package, Users, Warehouse, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useCommonTranslations, useProjectTranslations, useInventoryTranslations } from "@/components/LocaleProvider"

export function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const tCommon = useCommonTranslations()
  const tProject = useProjectTranslations()
  const tInventory = useInventoryTranslations()
  const noDataLabel = "N/A"

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/projects?limit=6`, { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          setStats(json.stats)
          setRecentProjects(json.projects || [])
        } else {
          setStats(null)
          setRecentProjects([])
        }
      } catch {
        setStats(null)
        setRecentProjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tCommon("companyDashboardTitle")}</h2>
          <p className="text-gray-600">
            {tCommon("welcomeName").replace("{name}", user?.firstName || tCommon("admin"))} 👋
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/projects/new")} className="flex items-center gap-2">
            <Plus size={16} />
            {tCommon("newProject")}
          </Button>
          <Button variant="outline" onClick={() => router.push("/settings?tab=users")}>
            {tCommon("inviteUsers")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tProject("totalProjects")}</p>
              <Briefcase size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.total ?? noDataLabel}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.active != null ? `${stats.active} ${tCommon("active")}` : noDataLabel}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tProject("inPlanning")}</p>
              <Briefcase size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.planning ?? noDataLabel}</p>
            <p className="text-xs text-gray-500 mt-2">{tProject("newProjects")}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tInventory("materials")}</p>
              <Package size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500 mt-2">{tInventory("manageInventoryLabel")}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("users")}</p>
              <Users size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("teamMembers")}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{tProject("latestProjects")}</h3>
          {loading ? (
            <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
          ) : recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="text-left p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{p.status}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">{tProject("noProjectsYet")}</p>
          )}
        </div>
      </Card>

      {user?.companyId && (
        <DashboardCharts companyId={user.companyId} />
      )}
    </div>
  )
}
