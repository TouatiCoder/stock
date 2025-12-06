"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { ProjectDetails } from "@/components/projects/project-details"
import { LoadCalculations } from "@/components/projects/load-calculations"
import { MaterialsList } from "@/components/projects/materials-list"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
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
                <div className="flex items-center gap-4">
                  <Link href="/projects">
                    <Button variant="outline" size="sm">
                      <ArrowLeft size={18} />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Détails du Projet</h1>
                    <p className="text-gray-600 mt-1">ID: {params.id}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <ProjectDetails projectId={params.id} />
                    <LoadCalculations projectId={params.id} />
                  </div>
                  <MaterialsList projectId={params.id} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
