"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download } from "lucide-react"
import { ProjectsList } from "@/components/projects/projects-list"
import { ProjectStats } from "@/components/projects/project-stats"
import { ProjectsPagination } from "@/components/projects/projects-pagination" // Changez l'import
import { projectService, type ProjectWithDetails } from "@/lib/services/projectService"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "sonner"

export default function ProjectsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "planning" | "active" | "paused" | "completed" | "cancelled">("all")
  const [projects, setProjects] = useState<ProjectWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    planning: 0,
    completed: 0,
    totalBudget: 0,
    totalCost: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    fetchProjects()
  }, [debouncedSearchTerm, filterStatus, pagination.page])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, count } = await projectService.getProjects(
        pagination.page, 
        pagination.pageSize, 
        searchTerm, 
        filterStatus === "all" ? undefined : filterStatus
      )
      setProjects(data || [])
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.pageSize)
      }))
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des projets")
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await projectService.getProjectStats()
      setStats(statsData)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des statistiques")
      console.error("Error fetching stats:", error)
    }
  }

  const handleCreateProject = () => {
    router.push("/projects/new")
  }

  const handleExportProjects = async () => {
    try {
      // Export simple vers CSV
      const { data } = await projectService.getProjects(
        1,
        10000, // Export tous
        searchTerm,
        filterStatus === "all" ? undefined : filterStatus
      )
      
      const csv = convertToCSV(data || [])
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `projets_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success("Export réussi !")
    } catch (error: any) {
      toast.error("Erreur lors de l'export")
      console.error("Export error:", error)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return ''
    
    const headers = ['Nom', 'Client', 'Ville', 'Statut', 'Budget', 'Coût actuel', 'Progression', 'Date début', 'Date fin']
    const csvRows = []
    
    // Headers
    csvRows.push(headers.join(','))
    
    // Rows
    for (const row of data) {
      const values = [
        row.name || '',
        row.client_name || '',
        row.city || '',
        row.status || '',
        row.total_budget || 0,
        row.current_cost || 0,
        row.progress_percentage || 0,
        row.start_date || '',
        row.planned_end_date || ''
      ].map(value => {
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
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
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projets & Chantiers</h1>
                    <p className="text-gray-600 mt-1">
                      {pagination.total} projet{pagination.total > 1 ? 's' : ''} au total
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handleExportProjects}
                    >
                      <Download size={18} />
                      Exporter
                    </Button>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={handleCreateProject}
                    >
                      <Plus size={18} />
                      Nouveau Projet
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <ProjectStats />

                {/* Filtres */}
                <Card>
                  <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Rechercher par nom, client, ville..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setPagination(prev => ({ ...prev, page: 1 }))
                        }}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value as any)
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="planning">Planification</option>
                      <option value="active">En cours</option>
                      <option value="paused">En pause</option>
                      <option value="completed">Complété</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </Card>

                {/* Projects List */}
                <ProjectsList 
                  projects={projects}
                  loading={loading}
                  onProjectClick={(id) => router.push(`/projects/${id}`)}
                  onDeleteProject={async (id) => {
                    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
                      try {
                        await projectService.deleteProject(id)
                        toast.success("Projet supprimé")
                        fetchProjects()
                        fetchStats()
                      } catch (error: any) {
                        toast.error(error.message || "Erreur lors de la suppression")
                      }
                    }
                  }}
                />

                {/* Pagination - Utilisez maintenant ProjectsPagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <ProjectsPagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.total}
                      pageSize={pagination.pageSize}
                      onPageChange={handlePageChange}
                    />
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