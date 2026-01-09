"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { projectService } from "@/lib/services/projectService"
import { projectDetailService } from "@/lib/services/projectDetailService"
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  TrendingUp,
  Phone,
  Mail,
  Building,
  Clock,
  AlertTriangle,
  Edit,
  FileText,
  Download
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ProjectDetailsProps {
  projectId: string
  project?: any // Optionnel: si le projet est déjà chargé depuis le parent
  phases?: any[] // Optionnel: si les phases sont déjà chargées
  team?: any[] // Optionnel: si l'équipe est déjà chargée
}

export function ProjectDetails({ projectId, project: initialProject, phases: initialPhases, team: initialTeam }: ProjectDetailsProps) {
  const router = useRouter()
  const [project, setProject] = useState<any>(initialProject)
  const [phases, setPhases] = useState<any[]>(initialPhases || [])
  const [team, setTeam] = useState<any[]>(initialTeam || [])
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(!initialProject)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!initialProject) {
      fetchProjectData()
    }
  }, [projectId, initialProject])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      
      // Récupérer le projet
      const projectData = await projectService.getProject(projectId)
      setProject(projectData)
      
      // Récupérer les phases
      const phasesData = await projectService.getProjectPhases(projectId)
      setPhases(phasesData)
      
      // Récupérer les anomalies
      const anomaliesData = await projectDetailService.getProjectAnomalies(projectId)
      setAnomalies(anomaliesData)
      
      // Extraire l'équipe des données du projet
      if (projectData.team) {
        setTeam(projectData.team.map((t: any) => t.user))
      }
    } catch (error) {
      console.error("Error fetching project details:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En cours'
      case 'planning': return 'Planification'
      case 'paused': return 'En pause'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  const getProjectTypeText = (type: string) => {
    switch (type) {
      case 'R+2': return 'R+2'
      case 'Villa': return 'Villa'
      case 'Immeuble': return 'Immeuble'
      case 'Commercial': return 'Commercial'
      case 'Industrial': return 'Industriel'
      default: return type
    }
  }

  const handleEditProject = () => {
   if (project.id) {
      router.push(`/projects/${project.id}/edit`)
    }
  }

  const handleGenerateReport = () => {
    // Logique pour générer un rapport
    alert("Génération du rapport PDF en cours...")
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 w-1/4 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!project) {
    return (
      <Card>
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Projet non trouvé</h3>
          <p className="text-gray-600">Impossible de charger les détails du projet</p>
        </div>
      </Card>
    )
  }

  const budget = project.total_budget || 0
  const spent = project.current_cost || 0
  const budgetUsage = budget > 0 ? (spent / budget) * 100 : 0
  const isOverBudget = budgetUsage > 100

  return (
    <div className="space-y-6">
      {/* Informations principales */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Informations du Projet</h2>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                {getProjectTypeText(project.project_type)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Nom du projet */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <Building size={14} />
                <span>Nom du Projet</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{project.name}</p>
            </div>

            {/* Localisation */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <MapPin size={14} />
                <span>Localisation</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {project.city || "Non spécifié"}
                {project.postal_code && ` (${project.postal_code})`}
              </p>
              {project.address && (
                <p className="text-sm text-gray-600 mt-1">{project.address}</p>
              )}
            </div>

            {/* Client */}
            {project.client_name && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Users size={14} />
                  <span>Client</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{project.client_name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {project.client_email && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Mail size={12} />
                      {project.client_email}
                    </div>
                  )}
                  {project.client_phone && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Phone size={12} />
                      {project.client_phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Budget total */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <DollarSign size={14} />
                <span>Budget Total</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {budget.toLocaleString('fr-MA', {
                  style: 'currency',
                  currency: 'MAD'
                })}
              </p>
            </div>

            {/* Dépensé */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <TrendingUp size={14} />
                <span>Coût actuel</span>
              </div>
              <p className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {spent.toLocaleString('fr-MA', {
                  style: 'currency',
                  currency: 'MAD'
                })}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({Math.round(budgetUsage)}%)
                </span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                ></div>
              </div>
              {isOverBudget && (
                <p className="text-xs text-red-600 mt-1">
                  +{Math.round(budgetUsage - 100)}% de dépassement
                </p>
              )}
            </div>

            {/* Progression */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <Clock size={14} />
                <span>Progression</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{project.progress_percentage || 0}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${project.progress_percentage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Date de début */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <Calendar size={14} />
                <span>Date de début</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {project.start_date 
                  ? new Date(project.start_date).toLocaleDateString('fr-FR')
                  : "Non définie"
                }
              </p>
            </div>

            {/* Date de fin */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                <Calendar size={14} />
                <span>Date de fin prévue</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {project.planned_end_date
                  ? new Date(project.planned_end_date).toLocaleDateString('fr-FR')
                  : "Non définie"
                }
              </p>
            </div>

            {/* Dates réelles */}
            {project.actual_end_date && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Clock size={14} />
                  <span>Date de fin réelle</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(project.actual_end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-2">Description</div>
              <p className="text-gray-700">{project.description}</p>
            </div>
          )}

          {/* Équipe de projet */}
          {(project.site_manager || project.structural_engineer) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-3">Équipe de projet</div>
              <div className="flex flex-wrap gap-4">
                {project.site_manager && (
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium mb-1">Chef de chantier</div>
                    <div className="font-medium text-blue-800">
                      {project.site_manager.first_name} {project.site_manager.last_name}
                    </div>
                  </div>
                )}
                
                {project.structural_engineer && (
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <div className="text-xs text-green-600 font-medium mb-1">Ingénieur structure</div>
                    <div className="font-medium text-green-800">
                      {project.structural_engineer.first_name} {project.structural_engineer.last_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
            <Button 
              onClick={handleEditProject}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Edit size={16} />
              Modifier le Projet
            </Button>
            <Button 
              variant="outline"
              onClick={handleGenerateReport}
              className="flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Rapport
            </Button>
            <Button 
              variant="outline"
              onClick={() => {/* Logique export */}}
              className="flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Phases du projet */}
      {phases.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Phases du projet</h3>
            <div className="space-y-3">
              {phases.map((phase) => (
                <div key={phase.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-gray-700">{phase.order_index}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{phase.name}</div>
                      <div className="text-sm text-gray-600">{phase.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      phase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      phase.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {phase.status === 'completed' ? 'Terminé' : 
                       phase.status === 'in_progress' ? 'En cours' : 
                       phase.status === 'delayed' ? 'Retardé' : 
                       'Planifié'}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm font-medium">{phase.progress_percentage}%</div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            phase.progress_percentage === 100 ? 'bg-green-500' :
                            phase.progress_percentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${phase.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Anomalies récentes */}
      {anomalies.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Anomalies récentes</h3>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {anomalies.filter(a => a.status === 'open').length} ouvertes
              </Badge>
            </div>
            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anomaly) => (
                <div key={anomaly.id} className="p-3 border border-red-100 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-600" />
                      <span className="font-medium text-gray-900">{anomaly.title}</span>
                    </div>
                    <Badge className={
                      anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{anomaly.description}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Signalé par {anomaly.reported_by?.first_name}</span>
                    <span>{new Date(anomaly.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
              {anomalies.length > 3 && (
                <Button variant="ghost" className="w-full text-sm">
                  Voir toutes les anomalies ({anomalies.length})
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}