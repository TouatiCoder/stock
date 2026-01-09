// app/inventory/materials/new/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from '@/lib/supabase'
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
import { 
  ArrowLeft, 
  Save, 
  X, 
  Package, 
  AlertCircle, 
  Plus, 
  Palette,
  Tag,
  Loader2 
} from "lucide-react"
import Link from "next/link"
import { materialService, type Material } from "@/lib/services/materialService"
import { inventoryService } from "@/lib/services/inventoryService"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function NewMaterialPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  
  // États pour la modal d'ajout de catégorie
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6")
  const [creatingCategory, setCreatingCategory] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category_id: "",
    unit_of_measure: "unit" as Material['unit_of_measure'],
    unit_weight: "",
    unit_price: "",
    min_stock_level: "",
    max_stock_level: "",
    critical_threshold: "",
    storage_location: "",
    supplier_id: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.company_id) {
      fetchCategories()
      fetchSuppliers()
    }
  }, [user?.company_id])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      
      if (!user?.company_id) {
        console.warn("⚠️ Aucun company_id trouvé")
        return
      }
      
      console.log("🔍 Chargement des catégories pour l'entreprise:", user.company_id)
      
      // Essayer avec le service d'abord
      try {
        const categoriesData = await inventoryService.getCategories(user.company_id)
        console.log("📦 Catégories chargées:", categoriesData?.length || 0)
        setCategories(categoriesData || [])
      } catch (serviceError) {
        console.error("❌ Erreur service, tentative directe:", serviceError)
        
        // Fallback: requête directe
        const { data, error } = await supabase
          .from('material_categories')
          .select('*')
          .eq('company_id', user.company_id)
          .order('name')
        
        if (error) {
          console.error("❌ Erreur requête directe:", error)
          throw error
        }
        
        console.log("📦 Catégories (directe):", data?.length || 0)
        setCategories(data || [])
      }
      
    } catch (error) {
      console.error("💥 Erreur chargement catégories:", error)
      toast.error("Erreur lors du chargement des catégories")
      
      // Afficher une catégorie par défaut si aucune n'existe
      if (categories.length === 0) {
        setCategories([
          { id: 'no-category', name: 'Non catégorisé', color_code: '#9CA3AF' }
        ])
      }
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      if (!user?.company_id) return
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('company_id', user.company_id)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setSuppliers(data || [])
      
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user?.company_id) {
      toast.error("Veuillez entrer un nom pour la catégorie")
      return
    }

    try {
      setCreatingCategory(true)
      
      console.log("➕ Création catégorie:", newCategoryName)
      
      const { data, error } = await supabase
        .from('material_categories')
        .insert({
          name: newCategoryName.trim(),
          company_id: user.company_id,
          color_code: newCategoryColor,
          description: ""
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur création catégorie:", error)
        
        // Si la catégorie existe déjà
        if (error.code === '23505') {
          toast.error("Une catégorie avec ce nom existe déjà")
          return
        }
        
        throw error
      }

      console.log("✅ Catégorie créée:", data)
      
      // Ajouter à la liste
      const updatedCategories = [...categories, data]
      setCategories(updatedCategories)
      
      // Sélectionner automatiquement la nouvelle catégorie
      setFormData(prev => ({ ...prev, category_id: data.id }))
      
      // Fermer la modal et réinitialiser
      setShowNewCategoryDialog(false)
      setNewCategoryName("")
      setNewCategoryColor("#3B82F6")
      
      toast.success(`Catégorie "${data.name}" créée avec succès`)
      
    } catch (error: any) {
      console.error("💥 Erreur création catégorie:", error)
      toast.error(error.message || "Erreur lors de la création")
    } finally {
      setCreatingCategory(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du matériau est obligatoire"
    }
    
    if (!formData.category_id) {
      newErrors.category_id = "La catégorie est obligatoire"
    }
    
    if (!formData.unit_of_measure) {
      newErrors.unit_of_measure = "L'unité de mesure est obligatoire"
    }
    
    const unitPrice = parseFloat(formData.unit_price)
    if (isNaN(unitPrice) || unitPrice < 0) {
      newErrors.unit_price = "Prix unitaire invalide"
    }
    
    const minStock = parseFloat(formData.min_stock_level)
    if (formData.min_stock_level && (isNaN(minStock) || minStock < 0)) {
      newErrors.min_stock_level = "Stock minimum invalide"
    }
    
    const criticalThreshold = parseFloat(formData.critical_threshold)
    if (formData.critical_threshold && (isNaN(criticalThreshold) || criticalThreshold < 0)) {
      newErrors.critical_threshold = "Seuil critique invalide"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.company_id) {
      toast.error("Non connecté ou entreprise non trouvée")
      return
    }
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    try {
      setLoading(true)
      setErrors({})

      // Préparer les données
      const materialData: Partial<Material> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id,
        company_id: user.company_id,
        unit_of_measure: formData.unit_of_measure,
        unit_weight: formData.unit_weight ? parseFloat(formData.unit_weight) : null,
        unit_price: parseFloat(formData.unit_price) || 0,
        min_stock_level: formData.min_stock_level ? parseFloat(formData.min_stock_level) : 0,
        max_stock_level: formData.max_stock_level ? parseFloat(formData.max_stock_level) : null,
        critical_threshold: formData.critical_threshold ? parseFloat(formData.critical_threshold) : 0,
        storage_location: formData.storage_location.trim() || null,
        supplier_id: formData.supplier_id || null,
        is_active: true
      }

      console.log("📦 Données matériau:", materialData)

      // Créer le matériau
      const createdMaterial = await materialService.createMaterial(materialData)

      toast.success("Matériau créé avec succès !", {
        description: `"${createdMaterial.name}" a été ajouté à l'inventaire.`
      })

      // Redirection
      setTimeout(() => {
        router.push("/inventory")
      }, 1500)

    } catch (error: any) {
      console.error("❌ Erreur création matériau:", error)
      
      let errorMessage = error.message || "Erreur lors de la création"
      
      // Messages d'erreur spécifiques
      if (error.code === '23505') {
        errorMessage = "Un matériau avec ce nom ou SKU existe déjà."
      } else if (error.message?.includes('category_id')) {
        errorMessage = "Catégorie invalide."
      } else if (error.message?.includes('company_id')) {
        errorMessage = "Erreur d'association à l'entreprise."
      } else if (error.code === '42501') {
        errorMessage = "Permission refusée. Vérifiez les politiques RLS."
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/inventory")
  }

  const unitOptions = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'ton', label: 'Tonne (ton)' },
    { value: 'm3', label: 'Mètre cube (m³)' },
    { value: 'm2', label: 'Mètre carré (m²)' },
    { value: 'm', label: 'Mètre linéaire (m)' },
    { value: 'unit', label: 'Unité' },
    { value: 'bag', label: 'Sac' },
    { value: 'pallet', label: 'Palette' },
    { value: 'other', label: 'Autre' }
  ]

  // Couleurs prédéfinies pour les catégories
  const colorOptions = [
    "#EF4444", // Rouge
    "#F97316", // Orange
    "#F59E0B", // Jaune
    "#84CC16", // Vert lime
    "#10B981", // Vert émeraude
    "#06B6D4", // Cyan
    "#3B82F6", // Bleu
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Rose
    "#F43F5E", // Rose foncé
    "#6B7280", // Gris
  ]

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
                      <h1 className="text-3xl font-bold text-gray-900">Nouveau Matériau</h1>
                      <p className="text-gray-600">Ajouter un nouveau matériau à l'inventaire</p>
                    </div>
                  </div>
                </div>

                {/* Formulaire */}
                <Card>
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                      {/* Nom et SKU */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-1">
                            Nom du matériau <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Ex: Ciment CPJ 35"
                            required
                            disabled={loading}
                            className={errors.name ? "border-red-500" : ""}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {errors.name}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sku">Code SKU</Label>
                          <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({...formData, sku: e.target.value})}
                            placeholder="Ex: CMT-CPJ35-50KG"
                            disabled={loading}
                          />
                          <p className="text-xs text-gray-500">Identifiant unique optionnel</p>
                        </div>
                      </div>

                      {/* Catégorie et Unité */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="category_id" className="flex items-center gap-1">
                              Catégorie <span className="text-red-500">*</span>
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNewCategoryDialog(true)}
                              className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Select
                              value={formData.category_id}
                              onValueChange={(value) => setFormData({...formData, category_id: value})}
                              disabled={loading || loadingCategories}
                            >
                              <SelectTrigger className={`flex-1 ${errors.category_id ? "border-red-500" : ""}`}>
                                <SelectValue placeholder={
                                  loadingCategories 
                                    ? "Chargement..." 
                                    : categories.length === 0
                                    ? "Aucune catégorie - Cliquez sur 'Ajouter'"
                                    : "Sélectionner une catégorie"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.length === 0 ? (
                                  <SelectItem value="no-category" disabled>
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <Tag className="h-3 w-3" />
                                      <span>Aucune catégorie disponible</span>
                                    </div>
                                  </SelectItem>
                                ) : (
                                  categories.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: category.color_code || '#9CA3AF' }}
                                        />
                                        <span className="truncate">{category.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            
                            {categories.length > 0 && formData.category_id && (
                              <div 
                                className="w-10 h-10 rounded-md flex items-center justify-center border"
                                style={{ 
                                  backgroundColor: categories.find(c => c.id === formData.category_id)?.color_code + '20',
                                  borderColor: categories.find(c => c.id === formData.category_id)?.color_code + '40'
                                }}
                              >
                                <Tag className="h-4 w-4" style={{ 
                                  color: categories.find(c => c.id === formData.category_id)?.color_code 
                                }} />
                              </div>
                            )}
                          </div>
                          
                          {errors.category_id && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {errors.category_id}
                            </p>
                          )}
                          
                          {categories.length === 0 && !loadingCategories && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                              <p className="font-medium">⚠️ Aucune catégorie disponible</p>
                              <p>Cliquez sur "Ajouter" pour créer votre première catégorie.</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit_of_measure" className="flex items-center gap-1">
                            Unité de mesure <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.unit_of_measure}
                            onValueChange={(value: Material['unit_of_measure']) => 
                              setFormData({...formData, unit_of_measure: value})
                            }
                            disabled={loading}
                          >
                            <SelectTrigger className={errors.unit_of_measure ? "border-red-500" : ""}>
                              <SelectValue placeholder="Sélectionner une unité" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.unit_of_measure && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {errors.unit_of_measure}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Poids et prix */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="unit_weight">Poids unitaire (kg)</Label>
                          <Input
                            id="unit_weight"
                            type="number"
                            step="0.001"
                            min="0"
                            value={formData.unit_weight}
                            onChange={(e) => setFormData({...formData, unit_weight: e.target.value})}
                            placeholder="Ex: 50 (pour un sac)"
                            disabled={loading}
                          />
                          <p className="text-xs text-gray-500">Optionnel</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit_price" className="flex items-center gap-1">
                            Prix unitaire (MAD) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="unit_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.unit_price}
                            onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                            placeholder="0.00"
                            required
                            disabled={loading}
                            className={errors.unit_price ? "border-red-500" : ""}
                          />
                          {errors.unit_price && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {errors.unit_price}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="supplier_id">Fournisseur</Label>
                          <Select
                            value={formData.supplier_id}
                            onValueChange={(value) => setFormData({...formData, supplier_id: value})}
                            disabled={loading || suppliers.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                suppliers.length === 0 
                                  ? "Aucun fournisseur" 
                                  : "Sélectionner un fournisseur"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map(supplier => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Niveaux de stock */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min_stock_level">Stock minimum</Label>
                          <Input
                            id="min_stock_level"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.min_stock_level}
                            onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                            placeholder="0.00"
                            disabled={loading}
                            className={errors.min_stock_level ? "border-red-500" : ""}
                          />
                          {errors.min_stock_level && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {errors.min_stock_level}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Seuil d'alerte</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max_stock_level">Stock maximum</Label>
                          <Input
                            id="max_stock_level"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.max_stock_level}
                            onChange={(e) => setFormData({...formData, max_stock_level: e.target.value})}
                            placeholder="0.00"
                            disabled={loading}
                          />
                          <p className="text-xs text-gray-500">Optionnel</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="critical_threshold">Seuil critique</Label>
                          <Input
                            id="critical_threshold"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.critical_threshold}
                            onChange={(e) => setFormData({...formData, critical_threshold: e.target.value})}
                            placeholder="0.00"
                            disabled={loading}
                            className={errors.critical_threshold ? "border-red-500" : ""}
                          />
                          {errors.critical_threshold && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle size={14} />
                              {errors.critical_threshold}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Urgence réapprovisionnement</p>
                        </div>
                      </div>

                      {/* Localisation et code-barres */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="storage_location">Emplacement de stockage</Label>
                          <Input
                            id="storage_location"
                            value={formData.storage_location}
                            onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                            placeholder="Ex: Rack A, Étagère 3"
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="barcode">Code-barres</Label>
                          <Input
                            id="barcode"
                            value={formData.barcode}
                            onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                            placeholder="Ex: 123456789012"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Description détaillée du matériau, spécifications techniques..."
                          rows={3}
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500">Optionnel</p>
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
                          disabled={loading || categories.length === 0}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Création...
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4" />
                              Créer le matériau
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

      {/* Modal d'ajout de catégorie */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Nouvelle catégorie
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie pour organiser vos matériaux.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nom de la catégorie *</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Acier, Béton, Outillage..."
                disabled={creatingCategory}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleur
              </Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${newCategoryColor === color ? 'border-gray-900' : 'border-gray-300'} transition-all hover:scale-110`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                    disabled={creatingCategory}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: newCategoryColor }}
                />
                <Input
                  type="text"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  disabled={creatingCategory}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCategoryDialog(false)}
              disabled={creatingCategory}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              className="gap-2"
            >
              {creatingCategory ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer la catégorie
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}