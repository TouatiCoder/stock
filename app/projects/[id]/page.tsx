// app/projects/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { projectService } from "@/lib/services/projectService"
import { toast } from "sonner"
import { ProjectDetails } from "@/components/projects/project-details" // IMPORT CORRECT

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  const projectId = params.id as string

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const data = await projectService.getProject(projectId)
      console.log("📋 Données projet chargées:", data)
      setProject(data)
    } catch (error: any) {
      console.error("❌ Erreur chargement projet:", error)
      toast.error("Erreur lors du chargement du projet")
      router.push("/projects")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <Link href="/projects">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chargement...</h1>
                  </div>
                </div>
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <Link href="/projects">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projet non trouvé</h1>
                  </div>
                </div>
                <Card className="p-6">
                  <p className="text-gray-600">Le projet demandé n'existe pas ou a été supprimé.</p>
                  <Button onClick={() => router.push("/projects")} className="mt-4">
                    Retour à la liste
                  </Button>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
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
              <div className="max-w-7xl mx-auto">
                {/* Header avec retour */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Link href="/projects">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour aux projets
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                      <p className="text-gray-600">
                        {project.client_name || "Sans client"} • {project.city || "Localisation non spécifiée"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Utilisez votre composant ProjectDetails */}
                <ProjectDetails 
                  projectId={projectId} // Passez l'ID
                  project={project}     // Passez le projet déjà chargé
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}