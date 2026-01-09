"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculationService } from "@/lib/services/calculationService"
import { 
  Calculator, 
  Plus, 
  Eye, 
  Download,
  FileText,
  BarChart3,
  HardHat,
  ArrowRight,
  Clock
} from "lucide-react"
import Link from "next/link"

interface LoadCalculationsProps {
  projectId: string
}

export function LoadCalculations({ projectId }: LoadCalculationsProps) {
  const [calculations, setCalculations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recentLoads, setRecentLoads] = useState<Array<{
    type: string
    value: string
    factor?: string
    unit?: string
  }>>([])

  useEffect(() => {
    fetchCalculations()
    calculateExampleLoads()
  }, [projectId])

  const fetchCalculations = async () => {
    try {
      setLoading(true)
      const data = await calculationService.getCalculationsByProject(projectId)
      setCalculations(data || [])
    } catch (error) {
      console.error("Error fetching calculations:", error)
    } finally {
      setLoading(false)
    }
  }

  // Exemple de calcul de charges (vous pouvez adapter selon vos besoins)
  const calculateExampleLoads = () => {
    // Valeurs d'exemple - à remplacer par vos données réelles
    const permanentLoad = 500 // kg/m²
    const variableLoad = 250 // kg/m²
    
    const loads = calculationService.calculateLoads(permanentLoad, variableLoad)
    
    setRecentLoads([
      { 
        type: "Charge Permanente", 
        value: loads.permanent.toString(), 
        factor: "1.35",
        unit: "kg/m²"
      },
      { 
        type: "Charge Variable", 
        value: loads.variable.toString(), 
        factor: "1.50",
        unit: "kg/m²"
      },
      { 
        type: "ELU (État Limite Ultime)", 
        value: loads.ELU.toString(), 
        unit: "kg/m²"
      },
      { 
        type: "ELS (État Limite Service)", 
        value: loads.ELS.toString(), 
        unit: "kg/m²"
      }
    ])
  }

  const getCalculationTypeIcon = (type: string) => {
    switch (type) {
      case 'concrete_volume': return '🏗️'
      case 'steel_quantity': return '⚙️'
      case 'formwork': return '📐'
      case 'load_analysis': return '📊'
      default: return '📋'
    }
  }

  const getCalculationTypeText = (type: string) => {
    switch (type) {
      case 'concrete_volume': return 'Volume Béton'
      case 'steel_quantity': return 'Quantité Acier'
      case 'formwork': return 'Coffrage'
      case 'load_analysis': return 'Analyse Charges'
      default: return 'Autre'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé'
      case 'in_review': return 'En revue'
      case 'rejected': return 'Rejeté'
      default: return 'Brouillon'
    }
  }

  const handleCreateCalculation = () => {
    // Rediriger vers la page de création de calcul
    window.location.href = `/projects/${projectId}/calculations/new`
  }

  const handleExportCalculation = (calculationId: string) => {
    // Logique d'export
    console.log("Export calculation:", calculationId)
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 w-1/3 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Calculs Structurels</h2>
              <p className="text-sm text-gray-600">
                {calculations.length} calcul{calculations.length > 1 ? 's' : ''} structurel{calculations.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={handleCreateCalculation} className="flex items-center gap-2">
            <Plus size={16} />
            Nouveau Calcul
          </Button>
        </div>

        {/* Charges récentes */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-gray-500" />
            <h3 className="font-medium text-gray-900">Charges Structurelles</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {recentLoads.map((load, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">{load.type}</p>
                  {load.factor && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      γ={load.factor}
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-bold text-gray-900">{load.value} {load.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des calculs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-gray-500" />
            <h3 className="font-medium text-gray-900">Calculs Réalisés</h3>
          </div>

          {calculations.length === 0 ? (
            <div className="text-center py-8 border border-gray-200 rounded-lg">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun calcul réalisé</h4>
              <p className="text-gray-600 mb-4">Commencez par créer votre premier calcul structurel</p>
              <Button onClick={handleCreateCalculation} className="flex items-center gap-2">
                <Plus size={16} />
                Créer un calcul
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {calculations.slice(0, 3).map((calc) => (
                <div key={calc.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCalculationTypeIcon(calc.calculation_type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{calc.reference}</h4>
                          <Badge className={getStatusColor(calc.status)}>
                            {getStatusText(calc.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getCalculationTypeText(calc.calculation_type)} • 
                          Version {calc.version} • 
                          {calc.engineer && (
                            <span className="ml-2">
                              Par {calc.engineer.first_name} {calc.engineer.last_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/projects/${projectId}/calculations/${calc.id}`}>
                          <Eye size={14} />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExportCalculation(calc.id)}
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Résultats du calcul */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {calc.total_concrete_volume && (
                      <div className="bg-blue-50 px-3 py-2 rounded">
                        <div className="text-blue-700 font-medium mb-1">Béton</div>
                        <div className="font-bold text-blue-900">{calc.total_concrete_volume} m³</div>
                      </div>
                    )}
                    
                    {calc.total_steel_weight && (
                      <div className="bg-green-50 px-3 py-2 rounded">
                        <div className="text-green-700 font-medium mb-1">Acier</div>
                        <div className="font-bold text-green-900">{calc.total_steel_weight} kg</div>
                      </div>
                    )}
                    
                    {calc.total_formwork_area && (
                      <div className="bg-purple-50 px-3 py-2 rounded">
                        <div className="text-purple-700 font-medium mb-1">Coffrage</div>
                        <div className="font-bold text-purple-900">{calc.total_formwork_area} m²</div>
                      </div>
                    )}
                  </div>

                  {/* Date et notes */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {new Date(calc.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    {calc.notes && (
                      <p className="text-xs text-gray-600 truncate max-w-[200px]">{calc.notes}</p>
                    )}
                  </div>
                </div>
              ))}

              {calculations.length > 3 && (
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <Link href={`/projects/${projectId}/calculations`}>
                    Voir tous les calculs ({calculations.length})
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex gap-2">
            <Button 
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleCreateCalculation}
            >
              <HardHat size={16} />
              Nouveau Calcul
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => {
                // Ouvrir la calculatrice
                window.open('/tools/calculator', '_blank')
              }}
            >
              <Calculator size={16} />
              Calculatrice
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}