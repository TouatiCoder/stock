"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Edit2 } from "lucide-react"
import Link from "next/link"

interface ProjectsListProps {
  searchTerm: string
  filterStatus: string
}

export function ProjectsList({ searchTerm, filterStatus }: ProjectsListProps) {
  const projects = [
    {
      id: "proj-1",
      name: "Bâtiment Commercial - Dammam",
      location: "Dammam, Arabie Saoudite",
      status: "active",
      budget: 500000,
      spent: 485000,
      startDate: "2024-01-15",
      endDate: "2025-06-30",
    },
    {
      id: "proj-2",
      name: "Résidence - Doha",
      location: "Doha, Qatar",
      status: "planning",
      budget: 350000,
      spent: 15000,
      startDate: "2024-03-01",
      endDate: "2025-12-31",
    },
    {
      id: "proj-3",
      name: "Centre Commercial - Riyadh",
      location: "Riyadh, Arabie Saoudite",
      status: "active",
      budget: 750000,
      spent: 680000,
      startDate: "2023-06-01",
      endDate: "2025-03-31",
    },
  ]

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === "all" || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-50 text-blue-700"
      case "active":
        return "bg-green-50 text-green-700"
      case "completed":
        return "bg-gray-50 text-gray-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Planification"
      case "active":
        return "En cours"
      case "completed":
        return "Complété"
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      {filtered.map((project) => {
        const progress = Math.round((project.spent / project.budget) * 100)
        const isOverBudget = progress > 100

        return (
          <Card key={project.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.location}</p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Budget Utilisé</p>
                  <p className={`text-lg font-bold ${isOverBudget ? "text-red-600" : "text-gray-900"}`}>
                    {project.spent.toLocaleString()} / {project.budget.toLocaleString()} MAD
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isOverBudget ? "bg-red-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  {isOverBudget && <p className="text-xs text-red-600 mt-1">+{progress - 100}% de dépassement</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Dates</p>
                  <p className="text-sm font-semibold text-gray-900">{project.startDate}</p>
                  <p className="text-sm text-gray-600">à {project.endDate}</p>
                </div>

                <div className="flex items-end gap-2">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 bg-transparent">
                      <Eye size={16} />
                      Voir
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex items-center justify-center gap-2 bg-transparent">
                    <Edit2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
