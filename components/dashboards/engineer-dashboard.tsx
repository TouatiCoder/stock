"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calculator, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar,
  BarChart3,
  Ruler,
  Weight,
  Building
} from "lucide-react"

export function EngineerDashboard() {
  const [calculations, setCalculations] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEngineerData()
  }, [])

  const fetchEngineerData = async () => {
    try {
      // Récupérer la session pour obtenir l'ID de l'utilisateur
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.session?.user?.id

      if (!userId) return

      // Récupérer les données en parallèle
      const [
        { data: calculationsData },
        { data: projectsData },
        { data: materialsData },
        { data: checklistsData }
      ] = await Promise.all([
        supabase
          .from('structural_calculations')
          .select('id, project_id, calculation_type, reference, status, created_at, total_concrete_volume, total_steel_weight, total_formwork_area')
          .eq('engineer_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('projects')
          .select('id, name, status, progress_percentage, structural_engineer_id')
          .eq('structural_engineer_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('materials')
          .select('id, name, category_id, unit_of_measure, unit_weight, unit_price, technical_specifications')
          .in('category_id', ['acier', 'beton', 'ciment'])
          .order('name')
          .limit(10),
        
        supabase
          .from('checklists')
          .select('id, project_id, title, status, completed_at, checklist_type')
          .eq('completed_by', userId)
          .order('completed_at', { ascending: false })
          .limit(5)
      ])

      setCalculations(calculationsData || [])
      setProjects(projectsData || [])
      setMaterials(materialsData || [])
      setChecklists(checklistsData || [])

    } catch (error) {
      console.error('Error fetching engineer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'in_review':
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'draft':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle size={14} />
      case 'in_review':
      case 'in_progress':
        return <BarChart3 size={14} />
      case 'rejected':
        return <AlertTriangle size={14} />
      default:
        return <FileText size={14} />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Calculs Effectués</p>
              <Calculator size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{calculations.length}</p>
            <p className="text-xs text-gray-500 mt-2">Ce mois-ci</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Projets Actifs</p>
              <Building size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {projects.filter(p => p.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 mt-2">En cours de planification</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Checklists Terminés</p>
              <CheckCircle size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{checklists.length}</p>
            <p className="text-xs text-gray-500 mt-2">7 derniers jours</p>
          </div>
        </Card>
      </div>

      {/* Outils et Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Outils de Calcul Rapide</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => window.location.href = '/tools/concrete-calculator'}
              >
                <Calculator size={18} />
                Calcul Béton
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 bg-transparent"
                onClick={() => window.location.href = '/tools/steel-calculator'}
              >
                <Weight size={18} />
                Calcul Acier
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 bg-transparent"
                onClick={() => window.location.href = '/tools/formwork-calculator'}
              >
                <Ruler size={18} />
                Calcul Coffrage
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 bg-transparent"
                onClick={() => window.location.href = '/materials/library'}
              >
                <BookOpen size={18} />
                Bibliothèque
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Derniers Calculs</h3>
            <div className="space-y-3">
              {calculations.length > 0 ? (
                calculations.map((calc) => (
                  <div 
                    key={calc.id} 
                    className={`p-3 rounded-lg border ${getStatusColor(calc.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(calc.status)}
                        <p className="text-sm font-medium text-gray-900">{calc.reference}</p>
                      </div>
                      <span className="text-xs font-medium capitalize">
                        {calc.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {calc.calculation_type} • {new Date(calc.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {calc.total_concrete_volume && (
                      <p className="text-xs text-gray-500 mt-1">
                        Béton: {calc.total_concrete_volume} m³ | Acier: {calc.total_steel_weight} kg
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FileText size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucun calcul effectué</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.href = '/calculations/new'}
                  >
                    Créer un calcul
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Projets et Matériaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mes Projets Actifs</h3>
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <Button 
                    key={project.id} 
                    variant="outline" 
                    className="w-full text-left h-auto py-3 justify-start bg-transparent hover:bg-gray-50"
                    onClick={() => window.location.href = `/projects/${project.id}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-600 capitalize">{project.status}</p>
                      </div>
                      {project.progress_percentage && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${project.progress_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{project.progress_percentage}%</span>
                        </div>
                      )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4">
                  <Building size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucun projet assigné</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Matériaux Structurels</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/materials'}
              >
                <Package size={14} className="mr-1" />
                Tout voir
              </Button>
            </div>
            <div className="space-y-3">
              {materials.length > 0 ? (
                materials.map((material) => (
                  <div key={material.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{material.name}</p>
                      <span className="text-xs font-medium text-blue-600">
                        {material.unit_price?.toLocaleString('fr-MA', {
                          style: 'currency',
                          currency: 'MAD'
                        })} /{material.unit_of_measure}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {material.unit_weight && (
                        <p className="text-xs text-gray-600">
                          <Weight size={12} className="inline mr-1" />
                          {material.unit_weight} kg/{material.unit_of_measure}
                        </p>
                      )}
                      {material.technical_specifications && (
                        <p className="text-xs text-gray-600">
                          <BookOpen size={12} className="inline mr-1" />
                          Spécifications
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Package size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucun matériau disponible</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Checklists et Rappels */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Checklists Récemment Terminés</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/checklists'}
            >
              <Calendar size={14} className="mr-1" />
              Voir le calendrier
            </Button>
          </div>
          <div className="space-y-3">
            {checklists.length > 0 ? (
              checklists.map((checklist) => (
                <div key={checklist.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <p className="text-sm font-medium text-gray-900">{checklist.title}</p>
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      {checklist.checklist_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Terminé le {new Date(checklist.completed_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckCircle size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Aucun checklist terminé récemment</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}