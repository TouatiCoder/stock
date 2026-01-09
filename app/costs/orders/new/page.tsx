// app/costs/orders/new/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft,
  Calendar,
  Package,
  DollarSign,
  Search,
  AlertCircle,
  Loader2,
  Eye,
  Check,
  X,
  ExternalLink
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Link from "next/link"

interface OrderItem {
  id: string
  material_id: string
  material_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  rating?: number
}

interface Project {
  id: string
  name: string
  client_name?: string
  status: string
}

interface Material {
  id: string
  name: string
  sku?: string
  unit_of_measure: string
  unit_price: number
  current_stock: number
  min_stock_level: number
  critical_threshold: number
  category?: {
    name: string
  }
}

// Composant pour les alertes de stock
function StockAlert({ material }: { material: Material }) {
  if (material.current_stock > material.min_stock_level) return null
  
  const severity = material.current_stock <= material.critical_threshold ? "critical" :
                   material.current_stock <= material.min_stock_level ? "warning" : "info"
  
  return (
    <div className={`mt-2 p-3 rounded-lg border ${
      severity === 'critical' ? 'bg-red-50 border-red-200' :
      severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
          severity === 'critical' ? 'text-red-600' :
          severity === 'warning' ? 'text-yellow-600' :
          'text-blue-600'
        }`} />
        <div className="flex-1">
          <p className={`font-medium text-sm ${
            severity === 'critical' ? 'text-red-800' :
            severity === 'warning' ? 'text-yellow-800' :
            'text-blue-800'
          }`}>
            {severity === 'critical' ? '⚠️ Stock critique' :
             severity === 'warning' ? '⚠️ Stock faible' : 'Stock bas'}
          </p>
          <p className="text-sm mt-1">
            Stock actuel: <span className="font-medium">{material.current_stock} {material.unit_of_measure}</span>
            {severity === 'critical' && 
              ` (Seuil critique: ${material.critical_threshold} ${material.unit_of_measure})`}
            {severity === 'warning' && 
              ` (Seuil minimum: ${material.min_stock_level} ${material.unit_of_measure})`}
          </p>
          <p className="text-xs mt-1 opacity-75">
            Recommandé: commander {Math.max(1, material.min_stock_level - material.current_stock)} {material.unit_of_measure}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchMaterial, setSearchMaterial] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    project_id: "",
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: "",
    status: "draft" as "draft" | "pending" | "ordered" | "approved"
  })

  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: "1",
      material_id: "",
      material_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      notes: ""
    }
  ])

  // Calculs
  const totalAmount = useMemo(() => 
    orderItems.reduce((sum, item) => sum + item.total_price, 0), 
    [orderItems]
  )
  const taxAmount = totalAmount * 0.2
  const finalAmount = totalAmount + taxAmount

  // Générer un numéro de commande unique
  const generateOrderNumber = () => {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `CMD-${year}${month}${day}-${random}`
  }

  const [orderNumber] = useState(generateOrderNumber())

  useEffect(() => {
    if (user?.company_id) {
      fetchInitialData()
    }
  }, [user?.company_id])

  useEffect(() => {
    if (formData.supplier_id) {
      fetchSupplierMaterials(formData.supplier_id)
    }
  }, [formData.supplier_id])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const companyId = user?.company_id
      if (!companyId) return

      // Récupérer les fournisseurs actifs avec rating
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name, contact_person, email, phone, rating')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name')
      
      if (suppliersData) setSuppliers(suppliersData)

      // Récupérer les projets actifs
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, client_name, status')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('status', 'active')
        .order('name')
      
      if (projectsData) setProjects(projectsData)

      // Récupérer tous les matériaux initialement
      await fetchAllMaterials(companyId)

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllMaterials = async (companyId: string) => {
    try {
      const { data: materialsData } = await supabase
        .from('materials')
        .select(`
          id, 
          name, 
          sku, 
          unit_of_measure, 
          unit_price, 
          current_stock, 
          min_stock_level, 
          critical_threshold,
          category:material_categories(name)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name')
      
      if (materialsData) {
        const mappedMaterials = materialsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          unit_of_measure: item.unit_of_measure,
          unit_price: item.unit_price,
          current_stock: item.current_stock,
          min_stock_level: item.min_stock_level,
          critical_threshold: item.critical_threshold,
          category: Array.isArray(item.category) ? item.category[0] : item.category
        }))
        setMaterials(mappedMaterials)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matériaux:", error)
    }
  }

  const fetchSupplierMaterials = async (supplierId: string) => {
    try {
      const { data: supplierMaterials } = await supabase
        .from('supplier_materials')
        .select(`
          material_id,
          unit_price,
          material:materials(
            id,
            name,
            sku,
            unit_of_measure,
            current_stock,
            min_stock_level,
            critical_threshold,
            category:material_categories(name)
          )
        `)
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
      
      if (supplierMaterials && supplierMaterials.length > 0) {
        const mappedMaterials = supplierMaterials.map((item: any) => ({
          id: item.material.id,
          name: item.material.name,
          sku: item.material.sku,
          unit_of_measure: item.material.unit_of_measure,
          unit_price: item.unit_price || item.material.unit_price,
          current_stock: item.material.current_stock,
          min_stock_level: item.material.min_stock_level,
          critical_threshold: item.material.critical_threshold,
          category: Array.isArray(item.material.category) 
            ? item.material.category[0] 
            : item.material.category
        }))
        setMaterials(mappedMaterials)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matériaux du fournisseur:", error)
    }
  }

  const handleAddItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      material_id: "",
      material_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      notes: ""
    }
    setOrderItems([...orderItems, newItem])
  }

  const handleRemoveItem = (id: string) => {
    if (orderItems.length === 1) {
      toast.warning("Au moins un article est requis")
      return
    }
    setOrderItems(orderItems.filter(item => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    const updatedItems = orderItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        }
        
        if (field === 'material_id') {
          const material = materials.find(m => m.id === value)
          updatedItem.material_name = material?.name || ""
          updatedItem.unit_price = material?.unit_price || 0
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        }
        
        return updatedItem
      }
      return item
    })
    
    setOrderItems(updatedItems)
  }

  const handleMaterialSearch = (materialId: string) => {
    const material = materials.find(m => m.id === materialId)
    setSelectedMaterial(material || null)
  }

  const filteredMaterials = useMemo(() => {
    if (!searchMaterial) return []
    
    return materials.filter(material =>
      material.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      material.sku?.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      material.category?.name?.toLowerCase().includes(searchMaterial.toLowerCase())
    )
  }, [searchMaterial, materials])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Validation
      if (!formData.supplier_id) {
        toast.error("Veuillez sélectionner un fournisseur")
        return
      }
      
      const invalidItems = orderItems.filter(item => 
        !item.material_id || item.quantity <= 0 || item.unit_price <= 0
      )
      if (invalidItems.length > 0) {
        toast.error(`${invalidItems.length} article(s) invalide(s). Vérifiez les quantités et prix.`)
        return
      }
      
      const companyId = user?.company_id
      if (!companyId) {
        toast.error("Erreur d'authentification")
        return
      }

      // 1. Créer la commande d'achat
      const { data: purchaseOrder, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{
          order_number: orderNumber,
          supplier_id: formData.supplier_id,
          company_id: companyId,
          project_id: formData.project_id || null,
          requested_by: user?.id,
          status: formData.status,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: formData.expected_delivery_date.toISOString().split('T')[0],
          notes: formData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (orderError) {
        console.error("Erreur création commande:", orderError)
        
        if (orderError.code === '23505') {
          toast.error("Numéro de commande déjà utilisé. Veuillez rafraîchir la page.")
          return
        }
        if (orderError.code === '42501') {
          toast.error("Permission refusée. Vérifiez les politiques RLS.")
          return
        }
        
        throw orderError
      }

      // 2. Créer les articles de la commande
      const orderItemsData = orderItems.map(item => ({
        purchase_order_id: purchaseOrder.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes || null,
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItemsData)

      if (itemsError) {
        console.error("Erreur création articles:", itemsError)
        
        // Annuler la commande si les articles échouent
        await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', purchaseOrder.id)
        
        throw itemsError
      }

      toast.success("Commande créée avec succès !", {
        description: `N° ${purchaseOrder.order_number}`,
        action: {
          label: "Voir",
          onClick: () => router.push(`/costs/orders/${purchaseOrder.id}`)
        }
      })
      
      
      
        router.push(`/costs/orders/${purchaseOrder.id}`);
      

    } catch (error: any) {
      console.error("Erreur lors de la création de la commande:", error)
      toast.error(error.message || "Erreur lors de la création de la commande")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (orderItems.some(item => item.material_id) || formData.notes || formData.supplier_id) {
      if (confirm("Des modifications non sauvegardées seront perdues. Continuer ?")) {
        router.push("/costs/orders")
      }
    } else {
      router.push("/costs/orders")
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id)
  const selectedProject = projects.find(p => p.id === formData.project_id)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        Retour
                      </Button>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nouvelle Commande</h1>
                        <p className="text-gray-600 text-sm mt-1">
                          N° <span className="font-mono font-medium">{orderNumber}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Brouillon
                      </Badge>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulaire principal */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Informations de base */}
                      <Card>
                        <div className="p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Package size={20} />
                            Informations de la commande
                          </h2>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Fournisseur */}
                            <div className="space-y-2">
                              <Label htmlFor="supplier_id" className="flex items-center gap-1">
                                Fournisseur <span className="text-red-500">*</span>
                              </Label>
                              <select
                                id="supplier_id"
                                value={formData.supplier_id}
                                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required
                              >
                                <option value="">Sélectionner un fournisseur</option>
                                {suppliers.map(supplier => (
                                  <option key={supplier.id} value={supplier.id}>
                                    {supplier.name} 
                                    {supplier.rating && ` ⭐ ${supplier.rating.toFixed(1)}`}
                                  </option>
                                ))}
                              </select>
                              {selectedSupplier && (
                                <div className="mt-2 text-sm">
                                  <p className="text-gray-600">
                                    {selectedSupplier.contact_person && `Contact: ${selectedSupplier.contact_person}`}
                                    {selectedSupplier.phone && ` • ${selectedSupplier.phone}`}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Projet */}
                            <div className="space-y-2">
                              <Label htmlFor="project_id">Projet (optionnel)</Label>
                              <select
                                id="project_id"
                                value={formData.project_id}
                                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                <option value="">Sélectionner un projet</option>
                                {projects.map(project => (
                                  <option key={project.id} value={project.id}>
                                    {project.name}
                                    {project.client_name && ` - ${project.client_name}`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Date de livraison prévue */}
                            <div className="space-y-2">
                              <Label className="flex items-center gap-1">
                                Date de livraison prévue <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <DatePicker
  selected={formData.expected_delivery_date}
  onChange={(date: Date | null) => {
    if (date) {
      setFormData({...formData, expected_delivery_date: date})
    }
  }}
  minDate={new Date()}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
  dateFormat="dd/MM/yyyy"
  // REMPLACEZ "locale='fr'" par :
  locale={undefined} // ou retirez complètement la prop locale
/>
                                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                            </div>

                            {/* Statut */}
                            <div className="space-y-2">
                              <Label htmlFor="status">Statut</Label>
                              <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                <option value="draft">Brouillon</option>
                                <option value="pending">En attente</option>
                                <option value="ordered">Commandée</option>
                                <option value="approved">Approuvée</option>
                              </select>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mt-4 space-y-2">
                            <Label htmlFor="notes">Notes (optionnel)</Label>
                            <Textarea
                              id="notes"
                              value={formData.notes}
                              onChange={(e) => setFormData({...formData, notes: e.target.value})}
                              placeholder="Instructions spéciales, conditions particulières, lieu de livraison..."
                              rows={3}
                              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </Card>

                      {/* Articles de la commande */}
                      <Card>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <Package size={20} />
                              Articles de la commande
                            </h2>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {orderItems.length} article{orderItems.length > 1 ? 's' : ''}
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddItem}
                                className="flex items-center gap-2"
                              >
                                <Plus size={16} />
                                Ajouter
                              </Button>
                            </div>
                          </div>

                          {/* Recherche de matériau */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <Label>Rechercher un matériau</Label>
                              <span className="text-sm text-gray-500">
                                {materials.length} disponible{materials.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Nom, SKU ou catégorie..."
                                value={searchMaterial}
                                onChange={(e) => setSearchMaterial(e.target.value)}
                                className="pl-10 pr-10"
                              />
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              {searchMaterial && (
                                <button
                                  type="button"
                                  onClick={() => setSearchMaterial("")}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                            
                            {/* Suggestions de matériaux */}
                            {searchMaterial && filteredMaterials.length > 0 && (
                              <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-80 overflow-y-auto">
                                <div className="p-3 border-b bg-gray-50">
                                  <p className="text-sm font-medium text-gray-700">
                                    {filteredMaterials.length} résultat{filteredMaterials.length > 1 ? 's' : ''} pour "{searchMaterial}"
                                  </p>
                                </div>
                                
                                {filteredMaterials.map(material => (
                                  <div
                                    key={material.id}
                                    className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors last:border-b-0 group"
                                    onClick={() => {
                                      const newItem: OrderItem = {
                                        id: Date.now().toString(),
                                        material_id: material.id,
                                        material_name: material.name,
                                        quantity: Math.max(1, material.min_stock_level - material.current_stock),
                                        unit_price: material.unit_price,
                                        total_price: material.unit_price * Math.max(1, material.min_stock_level - material.current_stock),
                                        notes: ""
                                      }
                                      setOrderItems([...orderItems, newItem])
                                      setSearchMaterial("")
                                      toast.success(`${material.name} ajouté à la commande`)
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium group-hover:text-blue-600">
                                          {material.name}
                                          {material.sku && <span className="text-gray-500 ml-2">({material.sku})</span>}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                          {material.category?.name && <span>{material.category.name} • </span>}
                                          <span>Stock: {material.current_stock} {material.unit_of_measure}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium text-blue-600">
                                          {material.unit_price.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          par {material.unit_of_measure}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Alertes de stock */}
                                    <StockAlert material={material} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Liste des articles */}
                          <div className="space-y-4">
                            {orderItems.map((item, index) => {
                              const material = materials.find(m => m.id === item.material_id)
                              
                              return (
                                <div key={item.id} className="border rounded-lg p-4 bg-white">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                                      </div>
                                      <h3 className="font-medium text-gray-900">
                                        {material ? material.name : "Sélectionner un matériau"}
                                      </h3>
                                      {material && material.current_stock <= material.critical_threshold && (
                                        <Badge variant="destructive" className="text-xs">
                                          Critique
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    {/* Matériau */}
                                    <div className="md:col-span-2">
                                      <Label htmlFor={`material-${item.id}`} className="text-xs">Matériau *</Label>
                                      <select
                                        id={`material-${item.id}`}
                                        value={item.material_id}
                                        onChange={(e) => {
                                          handleItemChange(item.id, 'material_id', e.target.value)
                                          handleMaterialSearch(e.target.value)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        required
                                      >
                                        <option value="">Sélectionner un matériau</option>
                                        {materials.map(material => (
                                          <option key={material.id} value={material.id}>
                                            {material.name} 
                                            {material.sku && ` (${material.sku})`}
                                            {` - ${material.unit_price.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}/${material.unit_of_measure}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Quantité */}
                                    <div>
                                      <Label htmlFor={`quantity-${item.id}`} className="text-xs">Quantité *</Label>
                                      <Input
                                        id={`quantity-${item.id}`}
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        required
                                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>

                                    {/* Prix unitaire */}
                                    <div>
                                      <Label htmlFor={`unit_price-${item.id}`} className="text-xs">Prix unitaire (MAD) *</Label>
                                      <div className="relative">
                                        <Input
                                          id={`unit_price-${item.id}`}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={item.unit_price}
                                          onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                          required
                                          className="pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="md:col-span-4">
                                      <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes (optionnel)</Label>
                                      <Input
                                        id={`notes-${item.id}`}
                                        type="text"
                                        value={item.notes}
                                        onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                        placeholder="Couleur, dimensions, marque, spécifications..."
                                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                  </div>

                                  {/* Informations du matériau sélectionné */}
                                  {material && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-600">Catégorie:</span>
                                          <span className="ml-2 font-medium">{material.category?.name || "—"}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Unité:</span>
                                          <span className="ml-2 font-medium">{material.unit_of_measure}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Stock actuel:</span>
                                          <span className="ml-2 font-medium">{material.current_stock}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Stock min:</span>
                                          <span className="ml-2 font-medium">{material.min_stock_level}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Prix total pour cet article */}
                                  <div className="mt-3 flex items-center justify-between pt-3 border-t">
                                    <span className="text-sm text-gray-600">
                                      Total pour cet article
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {item.total_price.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {orderItems.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600">Aucun article dans la commande</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddItem}
                                className="mt-3"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter votre premier article
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    {/* Résumé et actions */}
                    <div className="space-y-6">
                      {/* Résumé de la commande */}
                      <Card>
                        <div className="p-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé de la commande</h2>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sous-total</span>
                              <span className="font-semibold">
                                {totalAmount.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">TVA (20%)</span>
                              <span className="font-semibold">
                                {taxAmount.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                              </span>
                            </div>
                            
                            <div className="border-t pt-3">
                              <div className="flex justify-between text-lg font-bold">
                                <span>Total TTC</span>
                                <span className="text-blue-600">
                                  {finalAmount.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="mt-6 pt-6 border-t">
                            <h3 className="font-medium text-gray-900 mb-3">Détails</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">N° commande</span>
                                <span className="font-mono font-medium">{orderNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Nombre d'articles</span>
                                <span>{orderItems.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fournisseur</span>
                                <span className="font-medium text-right max-w-[150px] truncate">
                                  {selectedSupplier?.name || "—"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Projet</span>
                                <span className="text-right max-w-[150px] truncate">
                                  {selectedProject?.name || "Non attribué"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Date de livraison</span>
                                <span>
                                  {formData.expected_delivery_date.toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Liste des articles (mini) */}
                          {orderItems.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                              <h3 className="font-medium text-gray-900 mb-3">Articles ({orderItems.length})</h3>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {orderItems.map((item, index) => (
                                  <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded text-sm">
                                    <div className="truncate flex-1">
                                      <div className="font-medium truncate">
                                        {index + 1}. {item.material_name || "Matériau non sélectionné"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {item.quantity} × {item.unit_price.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-blue-600 whitespace-nowrap ml-2">
                                      {item.total_price.toLocaleString('fr-MA', {style: 'currency', currency: 'MAD'})}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Alertes de stock */}
                      {selectedMaterial && selectedMaterial.current_stock <= selectedMaterial.critical_threshold && (
                        <Card className="border-red-200 bg-red-50">
                          <div className="p-6">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h3 className="font-bold text-red-800">Attention ! Stock critique</h3>
                                <p className="text-sm text-red-700 mt-1">
                                  Le stock de "<span className="font-medium">{selectedMaterial.name}</span>" est au niveau critique.
                                  Commandez rapidement pour éviter les ruptures de stock.
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="destructive" className="text-xs">
                                    {selectedMaterial.current_stock} {selectedMaterial.unit_of_measure}
                                  </Badge>
                                  <span className="text-xs text-red-600">
                                    Seuil critique: {selectedMaterial.critical_threshold} {selectedMaterial.unit_of_measure}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Actions */}
                      <Card>
                        <div className="p-6">
                          <div className="space-y-3">
                            <Button
                              type="submit"
                              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                              disabled={saving || orderItems.length === 0 || !formData.supplier_id}
                              size="lg"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Création en cours...
                                </>
                              ) : (
                                <>
                                  <Save size={18} />
                                  Créer la commande
                                </>
                              )}
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleCancel}
                                disabled={saving}
                              >
                                Annuler
                              </Button>
                              
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    status: "draft"
                                  })
                                  toast.info("Statut défini sur 'Brouillon'. Vous pourrez modifier plus tard.")
                                }}
                                disabled={saving}
                              >
                                Sauvegarder brouillon
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t">
                            <div className="text-center text-sm text-gray-500 space-y-2">
                              <p>
                                <span className="font-medium">Brouillon:</span> Commande non envoyée
                              </p>
                              <p>
                                <span className="font-medium">Commandée:</span> Envoyée au fournisseur
                              </p>
                              <p className="mt-3">
                                Vous pourrez modifier cette commande jusqu'à son envoi.
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Lien vers le fournisseur */}
                      {selectedSupplier && (
                        <Card>
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{selectedSupplier.name}</p>
                                <p className="text-xs text-gray-500">{selectedSupplier.contact_person}</p>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/costs/suppliers/${selectedSupplier.id}`}>
                                  <ExternalLink size={14} />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}