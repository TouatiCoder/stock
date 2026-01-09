// app/inventory/entry/new/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, X, Package, Building, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { inventoryService } from "@/lib/services/inventoryService"
import { materialService } from "@/lib/services/materialService"
import { projectService } from "@/lib/services/projectService"
import { useAuth } from "@/lib/auth-context" // ou votre contexte d'authentification
import { toast } from "sonner"

export default function NewStockEntryPage() {
  const router = useRouter()
  const { user } = useAuth() // À adapter selon votre contexte
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    movement_type: "in",
    material_id: "",
    quantity: "",
    unit_price: "",
    source_type: "supplier" as const,
    source_id: "",
    destination_type: "warehouse" as const,
    destination_id: "",
    project_id: "",
    notes: ""
  })

  useEffect(() => {
    if (user?.company_id) {
      fetchMaterials()
      fetchProjects()
    }
  }, [user?.company_id])

  const fetchMaterials = async () => {
    try {
      if (!user?.company_id) return
      
      // Utilisez materialService si disponible
      const materialsData = await materialService.getCompanyMaterials(user.company_id)
      setMaterials(materialsData)
      
      // Ou utilisez directement supabase si besoin
      /*
      const { data } = await supabase
        .from('materials')
        .select('id, name, sku, unit_of_measure, current_stock, unit_price')
        .eq('company_id', user.company_id)
        .eq('is_active', true)
        .order('name')
      setMaterials(data || [])
      */
      
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast.error("Erreur lors du chargement des matériaux")
    }
  }

  const fetchProjects = async () => {
    try {
      if (!user?.company_id) return
      
      // Utilisez projectService
      const { data } = await projectService.getProjects(1, 100, '', 'active')
      setProjects(data || [])
      
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.company_id) {
      toast.error("Non connecté ou entreprise non trouvée")
      return
    }

    if (!formData.material_id || !formData.quantity) {
      toast.error("Matériau et quantité sont obligatoires")
      return
    }

    const quantity = parseFloat(formData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Quantité invalide")
      return
    }

    try {
      setLoading(true)

      // Préparer les données
      const movementData = {
        movement_type: formData.movement_type as 'in' | 'out' | 'transfer' | 'return' | 'adjustment' | 'consumption',
        material_id: formData.material_id,
        quantity: quantity,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        source_type: formData.source_type,
        source_id: formData.source_id || null,
        destination_type: formData.destination_type,
        destination_id: formData.destination_id || null,
        project_id: formData.project_id || null,
        user_id: user.id, // ID de l'utilisateur connecté
        notes: formData.notes || null,
        movement_date: new Date().toISOString()
      }

      console.log("📦 Données mouvement:", movementData)

      // 1. Créer le mouvement de stock
      const createdMovement = await inventoryService.createStockMovement(movementData)
      
      // 2. Mettre à jour le stock du matériau
      await inventoryService.updateMaterialStock(
        formData.material_id,
        quantity,
        formData.movement_type as 'in' | 'out' | 'adjustment'
      )

      toast.success("Mouvement de stock enregistré avec succès !")
      
      // Redirection
      setTimeout(() => {
        router.push("/inventory")
      }, 1500)

    } catch (error: any) {
      console.error("❌ Erreur création mouvement:", error)
      toast.error(error.message || "Erreur lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/inventory")
  }

  const selectedMaterial = materials.find(m => m.id === formData.material_id)

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Link href="/inventory">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Nouveau Mouvement de Stock</h1>
                      <p className="text-gray-600">Enregistrer une entrée, sortie ou transfert</p>
                    </div>
                  </div>
                </div>

                {/* Formulaire */}
                <Card>
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                      {/* Type de mouvement */}
                      <div className="space-y-2">
                        <Label>Type de mouvement *</Label>
                        <Select
                          value={formData.movement_type}
                          onValueChange={(value) => setFormData({...formData, movement_type: value})}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">
                              <div className="flex items-center gap-2">
                                <span className="text-green-600">📥</span>
                                <span>Réception (Entrée)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="out">
                              <div className="flex items-center gap-2">
                                <span className="text-red-600">📤</span>
                                <span>Sortie vers chantier</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="transfer">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600">🔄</span>
                                <span>Transfert entre dépôts</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="return">
                              <div className="flex items-center gap-2">
                                <span className="text-orange-600">↩️</span>
                                <span>Retour chantier</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="adjustment">
                              <div className="flex items-center gap-2">
                                <span className="text-purple-600">⚖️</span>
                                <span>Ajustement de stock</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="consumption">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">🔥</span>
                                <span>Consommation</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Matériau et quantité */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Matériau *</Label>
                          <Select
                            value={formData.material_id}
                            onValueChange={(value) => setFormData({...formData, material_id: value})}
                            disabled={loading || materials.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={materials.length === 0 ? "Chargement..." : "Sélectionner un matériau"} />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(material => (
                                <SelectItem key={material.id} value={material.id}>
                                  <div className="flex items-center gap-2">
                                    <Package size={14} />
                                    <span>{material.name}</span>
                                    {material.sku && (
                                      <span className="text-xs text-gray-500">({material.sku})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedMaterial && (
                            <div className="text-xs text-gray-500 mt-1">
                              Stock actuel: {selectedMaterial.current_stock} {selectedMaterial.unit_of_measure}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Quantité *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            placeholder="0.00"
                            required
                            disabled={loading}
                          />
                          {selectedMaterial && (
                            <div className="text-xs text-gray-500">
                              Unité: {selectedMaterial.unit_of_measure}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prix unitaire */}
                      <div className="space-y-2">
                        <Label>Prix unitaire (MAD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.unit_price}
                          onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                          placeholder="0.00"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500">
                          Laissez vide pour utiliser le prix par défaut du matériau
                        </p>
                      </div>

                      {/* Projet associé */}
                      <div className="space-y-2">
                        <Label>Projet associé (Optionnel)</Label>
                        <Select
                          value={formData.project_id}
                          onValueChange={(value) => setFormData({...formData, project_id: value})}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un projet" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center gap-2">
                                  <Building size={14} />
                                  <span>{project.name}</span>
                                  {project.city && (
                                    <span className="text-xs text-gray-500">({project.city})</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label>Notes (Optionnel)</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="Référence de commande, numéro de bon, observations..."
                          rows={3}
                          disabled={loading}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          {loading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Enregistrer le mouvement
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}