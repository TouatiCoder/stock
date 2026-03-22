"use client"

import { useState, useEffect } from "react"
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
import { useAuth } from '@/lib/mysql/auth-context'
import { useCommonTranslations, useProjectTranslations } from "@/components/LocaleProvider"

export function EngineerDashboard() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const tCommon = useCommonTranslations()
  const tProject = useProjectTranslations()

  useEffect(() => {
    fetchEngineerData()
  }, [])

  const fetchEngineerData = async () => {
    try {
      setCalculations([]);
      setProjects([]);
      setMaterials([]);
      setChecklists([]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("calculationsPerformed")}</p>
              <Calculator size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{calculations.length}</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("thisMonth")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tProject("activeProjects")}</p>
              <Building size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {projects.filter(p => p.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 mt-2">{tProject("inPlanning")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("checklistsCompleted")}</p>
              <CheckCircle size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{checklists.length}</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("last7Days")}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("quickCalculationTools")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => window.location.href = '/tools/concrete-calculator'}
              >
                <Calculator size={18} />
                {tCommon("concreteCalculator")}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 bg-transparent"
                onClick={() => window.location.href = '/tools/steel-calculator'}
              >
                <Weight size={18} />
                {tCommon("steelCalculator")}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 bg-transparent"
                onClick={() => window.location.href = '/tools/formwork-calculator'}
              >
                <Ruler size={18} />
                {tCommon("formworkCalculator")}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 bg-transparent"
                onClick={() => window.location.href = '/materials/library'}
              >
                <BookOpen size={18} />
                {tCommon("library")}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("latestCalculations")}</h3>
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
                      {calc.calculation_type} • {new Date(calc.created_at).toLocaleDateString()}
                    </p>
                    {calc.total_concrete_volume && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tCommon("concreteLabel")}: {calc.total_concrete_volume} m³ | {tCommon("steelLabel")}: {calc.total_steel_weight} kg
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FileText size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{tCommon("noCalculations")}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.href = '/calculations/new'}
                  >
                    {tCommon("createCalculation")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tProject("myActiveProjects")}</h3>
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
                  <p className="text-sm text-gray-500">{tProject("noAssignedProject")}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tCommon("structuralMaterials")}</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/materials/library'}
              >
                <Package size={14} className="mr-1" />
                {tCommon("viewAll")}
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
                          {tCommon("specs")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Package size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{tCommon("noMaterialsAvailable")}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{tCommon("recentlyCompletedChecklists")}</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/checklists'}
            >
              <Calendar size={14} className="mr-1" />
              {tCommon("viewCalendar")}
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
                    {tCommon("completedOn")} {new Date(checklist.completed_at).toLocaleDateString(undefined, {
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
                <p className="text-sm text-gray-500">{tCommon("noRecentChecklist")}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
