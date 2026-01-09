"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  Edit2, 
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  MoreVertical,
  Clock,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { projectService, type ProjectWithDetails } from "@/lib/services/projectService"

interface ProjectsListProps {
  searchTerm?: string
  filterStatus?: string
  projects?: ProjectWithDetails[]
  loading?: boolean
  onProjectClick?: (projectId: string) => void
  onDeleteProject?: (projectId: string) => void
}

export function ProjectsList({ 
  searchTerm = "", 
  filterStatus = "all",
  projects: externalProjects,
  loading = false,
  onProjectClick,
  onDeleteProject
}: ProjectsListProps) {
  const [localProjects, setLocalProjects] = useState<ProjectWithDetails[]>([])
  const [internalLoading, setInternalLoading] = useState(false)

  // Si des projets sont passés en props, on les utilise
  // Sinon, on les charge nous-mêmes
  useEffect(() => {
    if (externalProjects === undefined) {
      fetchProjects()
    } else {
      setLocalProjects(externalProjects)
    }
  }, [searchTerm, filterStatus, externalProjects])

  const fetchProjects = async () => {
    try {
      setInternalLoading(true)
      const { data } = await projectService.getProjects(
        1, 
        50, 
        searchTerm, 
        filterStatus === "all" ? undefined : filterStatus
      )
      setLocalProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setInternalLoading(false)
    }
  }

  const projects = externalProjects !== undefined ? externalProjects : localProjects
  const isLoading = loading || internalLoading

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Planification"
      case "active":
        return "En cours"
      case "paused":
        return "En pause"
      case "completed":
        return "Complété"
      case "cancelled":
        return "Annulé"
      default:
        return status
    }
  }

  const getProjectTypeText = (type?: string) => {
    if (!type) return "Non spécifié"
    switch (type) {
      case 'R+2': return 'R+2'
      case 'Villa': return 'Villa'
      case 'Immeuble': return 'Immeuble'
      case 'Commercial': return 'Commercial'
      case 'Industrial': return 'Industriel'
      default: return type
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "0 MAD"
    return amount.toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Aucun projet ne correspond à vos critères de recherche'
              : 'Commencez par créer votre premier projet'
            }
          </p>
          <Link href="/projects/new">
            <Button>Crer un projet</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const progress = project.progress_percentage || 0
        const budget = project.total_budget || 0
        const spent = project.current_cost || 0
        const budgetUsage = budget > 0 ? (spent / budget) * 100 : 0
        const isOverBudget = budgetUsage > 100

        return (
          <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer"
                      onClick={() => onProjectClick?.(project.id)}
                    >
                      {project.name || "Projet sans nom"}
                    </h3>
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {getProjectTypeText(project.project_type)}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description || "Aucune description"}
                  </p>

                  {/* Informations du projet */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {project.client_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-gray-600">Client: </span>
                        <span className="font-medium">{project.client_name}</span>
                      </div>
                    )}
                    
                    {project.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-600">Lieu: </span>
                        <span className="font-medium">{project.city}</span>
                      </div>
                    )}
                    
                    {project.start_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-600">Début: </span>
                        <span className="font-medium">
                          {new Date(project.start_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onProjectClick?.(project.id)}>
                      <Eye size={14} className="mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}/edit`}>
                        <Edit2 size={14} className="mr-2" />
                        Modifier
                      </Link>
                    </DropdownMenuItem>
                    {onDeleteProject && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDeleteProject(project.id)}
                      >
                        <AlertTriangle size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progression et Budget */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700">Progression du projet</div>
                    <div className="text-sm font-bold">{progress}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-gray-500" />
                      <div className="text-sm font-medium text-gray-700">Budget</div>
                    </div>
                    <div className="text-sm">
                      <span className={isOverBudget ? "text-red-600 font-bold" : "text-gray-900 font-bold"}>
                        {formatCurrency(spent)} / {formatCurrency(budget)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${isOverBudget ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                    ></div>
                  </div>
                  {budget > 0 && (
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-gray-500">
                        Utilisation: {Math.round(budgetUsage)}%
                      </div>
                      {isOverBudget && (
                        <div className="text-xs text-red-600 font-semibold">
                          +{Math.round(budgetUsage - 100)}% de dépassement
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Équipe du projet */}
                {(project.site_manager || project.structural_engineer) && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 mb-2">Équipe de projet</div>
                    <div className="flex flex-wrap gap-3">
                      {project.site_manager && (
                        <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-lg">
                          <Users size={12} className="text-blue-600" />
                          <span className="font-medium text-blue-700">Chef chantier:</span>
                          <span className="text-blue-800">
                            {typeof project.site_manager === 'object' 
                              ? `${project.site_manager.first_name || ''} ${project.site_manager.last_name || ''}`
                              : String(project.site_manager)
                            }
                          </span>
                        </div>
                      )}
                      
                      {project.structural_engineer && (
                        <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1 rounded-lg">
                          <TrendingUp size={12} className="text-green-600" />
                          <span className="font-medium text-green-700">Ingénieur:</span>
                          <span className="text-green-800">
                            {typeof project.structural_engineer === 'object'
                              ? `${project.structural_engineer.first_name || ''} ${project.structural_engineer.last_name || ''}`
                              : String(project.structural_engineer)
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar size={12} />
                        <span>Début</span>
                      </div>
                      <div className="font-medium">
                        {project.start_date 
                          ? new Date(project.start_date).toLocaleDateString('fr-FR')
                          : "Non défini"
                        }
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock size={12} />
                        <span>Fin prévue</span>
                      </div>
                      <div className="font-medium">
                        {project.planned_end_date
                          ? new Date(project.planned_end_date).toLocaleDateString('fr-FR')
                          : "Non défini"
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Link 
                    href={`/projects/${project.id}`} 
                    className="flex-1"
                    onClick={(e) => {
                      if (onProjectClick) {
                        e.preventDefault()
                        onProjectClick(project.id)
                      }
                    }}
                  >
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <Eye size={16} />
                      Voir le projet
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <Edit2 size={16} />
                      Modifier
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}