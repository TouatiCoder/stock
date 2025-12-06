"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { ProjectsList } from "@/components/projects/projects-list"
import { ProjectStats } from "@/components/projects/project-stats"

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Calculs Structurels</h1>
                    <p className="text-gray-600 mt-1">Gestion des projets et calculs de charges</p>
                  </div>
                  <Button className="flex items-center gap-2">
                    <Plus size={18} />
                    Nouveau Projet
                  </Button>
                </div>

                {/* Stats */}
                <ProjectStats />

                {/* Filtres */}
                <Card>
                  <div className="p-4 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher un projet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="planning">Planification</option>
                      <option value="active">En cours</option>
                      <option value="completed">Complété</option>
                    </select>
                  </div>
                </Card>

                {/* Projects List */}
                <ProjectsList searchTerm={searchTerm} filterStatus={filterStatus} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
