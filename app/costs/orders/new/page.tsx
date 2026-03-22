// app/costs/orders/new/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Link from "next/link"
import { getInitialOrderData, getSupplierMaterials, createOrder } from "@/app/actions/order-actions"
import { useCostsTranslations, useCommonTranslations, useLocale } from "@/components/LocaleProvider"

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
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  rating?: number | null
}

interface Project {
  id: string
  name: string
  client_name?: string | null
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
  category?: string
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
  const tCosts = useCostsTranslations()
  const tCommon = useCommonTranslations()
  const { locale } = useLocale()
  const currencyLocale = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US"
  const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"
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

  const [orderNumber, setOrderNumber] = useState("")

  useEffect(() => {
    setOrderNumber(generateOrderNumber())
  }, [])

  useEffect(() => {
    if (user?.companyId) {  // Fixed property name
      fetchInitialData()
    }
  }, [user?.companyId])  // Fixed property name

  useEffect(() => {
    if (formData.supplier_id) {
      fetchSupplierMaterials(formData.supplier_id)
    }
  }, [formData.supplier_id])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const companyId = user?.companyId
      if (!companyId) return

      const result = await getInitialOrderData(companyId)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch data")
      }

      const { suppliers, projects, materials } = result.data
      
      if (suppliers) {
        setSuppliers(suppliers.map((s: any) => ({
          id: s.id,
          name: s.name,
          contact_person: s.contactPerson,
          email: s.email,
          phone: s.phone,
          rating: s.rating ? Number(s.rating) : null
        })))
      }

      if (projects) {
        setProjects(projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          client_name: p.clientName || undefined,
          status: p.status
        })))
      }

      if (materials) {
        const mappedMaterials = materials.map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku || undefined,
          unit_of_measure: item.unit,
          unit_price: Number(item.price || 0),
          current_stock: item.quantity,
          min_stock_level: item.minStock,
          critical_threshold: item.minStock - 5, // Approximation
          category: item.category || undefined
        }))
        setMaterials(mappedMaterials)
      }

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  // fetchAllMaterials removed as it is now part of fetchInitialData

  const fetchSupplierMaterials = async (supplierId: string) => {
    try {
      const result = await getSupplierMaterials(supplierId)
      
      if (result.success && result.data && result.data.length > 0) {
        const mappedMaterials = result.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          unit_of_measure: item.unit,
          unit_price: Number(item.price || 0),
          current_stock: item.quantity,
          min_stock_level: item.minStock,
          critical_threshold: item.minStock - 5, // Approximation
          category: item.category || undefined
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
      material.category?.toLowerCase().includes(searchMaterial.toLowerCase())
    )
  }, [searchMaterial, materials])

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    setSaving(true)
    
    // Validation
    if (!formData.supplier_id) {
      toast.error("Veuillez sélectionner un fournisseur")
      setSaving(false)
      return
    }
    
    const invalidItems = orderItems.filter(item => 
      !item.material_id || item.quantity <= 0 || item.unit_price <= 0
    )
    if (invalidItems.length > 0) {
      toast.error(`${invalidItems.length} article(s) invalide(s). Vérifiez les quantités et prix.`)
      setSaving(false)
      return
    }
    
    const companyId = user?.companyId  // Fixed property name
    if (!companyId) {
      toast.error("Erreur d'authentification")
      setSaving(false)
      return
    }

    // 1. Créer la commande d'achat via Server Action
    const safeOrderNumber = orderNumber || generateOrderNumber()

    const orderData = {
      orderNumber: safeOrderNumber,
      supplierId: formData.supplier_id,
      companyId: companyId,
      status: formData.status,
      totalAmount: totalAmount,
      orderDate: new Date(),
      expectedDelivery: formData.expected_delivery_date,
      createdById: user?.id || "",
      items: orderItems
    }

    const result = await createOrder(orderData)

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to create order")
    }

    const purchaseOrder = result.data

    // SUCCÈS
    toast.success("Commande créée avec succès !", {
      description: `N° ${purchaseOrder.orderNumber}`,
      action: {
        label: "Voir",
        onClick: () => {
          // Navigation dans le toast
          window.location.href = `/costs/orders/${purchaseOrder.id}`
        }
      }
    })
    
    // 🔥 CORRECTION : Utiliser window.location.href au lieu de router.push()
    // Attendre un peu pour laisser le toast s'afficher
    setTimeout(() => {
      window.location.href = `/costs/orders/${purchaseOrder.id}`
    }, 1500)

  } catch (error: any) {
    console.error("Erreur lors de la création de la commande:", error)
    toast.error(error.message || "Erreur lors de la création de la commande")
  } finally {
    // NE PAS mettre setSaving(false) ici car la navigation va se faire
    // Le composant sera démonté avant que finally ne s'exécute
  }
}

  const handleCancel = () => {
    if (orderItems.some(item => item.material_id) || formData.notes || formData.supplier_id) {
      if (confirm("Des modifications non sauvegardées seront perdues. Continuer ?")) {
        router.push("/costs")
      }
    } else {
      router.push("/costs")
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id)
  const selectedProject = projects.find(p => p.id === formData.project_id)

  if (loading) {
    return (
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
    )
  }

  return (
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
                        {tCommon("back")}
                      </Button>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{tCosts("newOrderTitle")}</h1>
                        <p className="text-gray-600 text-sm mt-1">
                          N° <span className="font-mono font-medium">{orderNumber || "-"}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {tCosts("statusDraft")}
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
                            {tCosts("orderInfoTitle")}
                          </h2>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Fournisseur */}
                            <div className="space-y-2">
                              <Label htmlFor="supplier_id" className="flex items-center gap-1">
                                {tCosts("supplierLabel")} <span className="text-red-500">*</span>
                              </Label>
                              <select
                                id="supplier_id"
                                value={formData.supplier_id}
                                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required
                              >
                                <option value="">{tCosts("selectSupplier")}</option>
                                {suppliers.map(supplier => (
                                  <option key={supplier.id} value={supplier.id}>
                                    {supplier.name} 
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
                              <Label htmlFor="project_id">{tCosts("projectLabelOptional")}</Label>
                              <select
                                id="project_id"
                                value={formData.project_id}
                                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                <option value="">{tCosts("selectProject")}</option>
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
                                {tCosts("expectedDeliveryDate")} <span className="text-red-500">*</span>
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
                              <Label htmlFor="status">{tCommon("status")}</Label>
                              <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                <option value="draft">{tCosts("statusDraft")}</option>
                                <option value="pending">{tCosts("statusPending")}</option>
                                <option value="ordered">{tCosts("statusOrdered")}</option>
                                <option value="approved">{tCosts("statusApproved")}</option>
                              </select>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mt-4 space-y-2">
                            <Label htmlFor="notes">{tCosts("notesOptional")}</Label>
                            <Textarea
                              id="notes"
                              value={formData.notes}
                              onChange={(e) => setFormData({...formData, notes: e.target.value})}
                              placeholder={tCosts("notesPlaceholder")}
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
                              {tCosts("orderItemsTitle")}
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
                                {tCosts("addItem")}
                              </Button>
                            </div>
                          </div>

                          {/* Recherche de matériau */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <Label>{tCosts("searchMaterialLabel")}</Label>
                              <span className="text-sm text-gray-500">
                                {materials.length} disponible{materials.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder={tCosts("searchMaterialPlaceholder")}
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
                                    {tCosts("searchResultsFor")
                                      .replace("{count}", String(filteredMaterials.length))
                                      .replace("{term}", searchMaterial)}
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
                                      toast.success(tCosts("materialAddedToOrder").replace("{name}", material.name))
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium group-hover:text-blue-600">
                                          {material.name}
                                          {material.sku && <span className="text-gray-500 ml-2">({material.sku})</span>}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                          {material.category && <span>{material.category} • </span>}
                                          <span>Stock: {material.current_stock} {material.unit_of_measure}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium text-blue-600">
                                          {material.unit_price.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
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
                                        {material ? material.name : tCosts("selectMaterial")}
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
                                      <Label htmlFor={`material-${item.id}`} className="text-xs">{tCosts("materialLabelRequired")}</Label>
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
                                        <option value="">{tCosts("selectMaterial")}</option>
                                        {materials.map(material => (
                                          <option key={material.id} value={material.id}>
                                            {material.name} 
                                            {material.sku && ` (${material.sku})`}
                                            {` - ${material.unit_price.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}/${material.unit_of_measure}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Quantité */}
                                    <div>
                                      <Label htmlFor={`quantity-${item.id}`} className="text-xs">{tCosts("quantityLabel")}</Label>
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
                                      <Label htmlFor={`unit_price-${item.id}`} className="text-xs">{tCosts("unitPriceMadLabel")}</Label>
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
                                      <Label htmlFor={`notes-${item.id}`} className="text-xs">{tCosts("notesOptional")}</Label>
                                      <Input
                                        id={`notes-${item.id}`}
                                        type="text"
                                        value={item.notes}
                                        onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                        placeholder={tCosts("itemNotesPlaceholder")}
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
                                          <span className="ml-2 font-medium">{material.category || "—"}</span>
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
                                      {tCosts("itemTotalLabel")}
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {item.total_price.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {orderItems.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600">{tCosts("noItemsInOrder")}</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddItem}
                                className="mt-3"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                {tCosts("addFirstItem")}
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
                          <h2 className="text-lg font-bold text-gray-900 mb-4">{tCosts("orderSummaryTitle")}</h2>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{tCosts("subtotalLabel")}</span>
                              <span className="font-semibold">
                                {totalAmount.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">{tCosts("vat20Label")}</span>
                              <span className="font-semibold">
                                {taxAmount.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
                              </span>
                            </div>
                            
                            <div className="border-t pt-3">
                              <div className="flex justify-between text-lg font-bold">
                                <span>{tCosts("grandTotalLabel")}</span>
                                <span className="text-blue-600">
                                  {finalAmount.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="mt-6 pt-6 border-t">
                            <h3 className="font-medium text-gray-900 mb-3">{tCosts("detailsTitle")}</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">{tCosts("orderNumberLabel")}</span>
                                <span className="font-mono font-medium">{orderNumber || "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{tCosts("itemsCountLabel")}</span>
                                <span>{orderItems.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{tCosts("supplierLabel")}</span>
                                <span className="font-medium text-right max-w-[150px] truncate">
                                  {selectedSupplier?.name || "—"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{tCommon("projects")}</span>
                                <span className="text-right max-w-[150px] truncate">
                                  {selectedProject?.name || "Non attribué"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">{tCosts("deliveryDateLabel")}</span>
                                <span>
                                  {formData.expected_delivery_date.toLocaleDateString(dateLocale)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Liste des articles (mini) */}
                          {orderItems.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                              <h3 className="font-medium text-gray-900 mb-3">{tCosts("itemsMiniTitle").replace("{count}", String(orderItems.length))}</h3>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {orderItems.map((item, index) => (
                                  <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded text-sm">
                                    <div className="truncate flex-1">
                                      <div className="font-medium truncate">
                                        {index + 1}. {item.material_name || tCosts("materialNotSelected")}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {item.quantity} × {item.unit_price.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-blue-600 whitespace-nowrap ml-2">
                                      {item.total_price.toLocaleString(currencyLocale, {style: 'currency', currency: 'MAD'})}
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
                                <h3 className="font-bold text-red-800">{tCosts("stockCriticalTitle")}</h3>
                                <p className="text-sm text-red-700 mt-1">
                                  {tCosts("stockCriticalDescription").replace("{name}", selectedMaterial.name)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="destructive" className="text-xs">
                                    {tCosts("stockCurrentAmount")
                                      .replace("{amount}", String(selectedMaterial.current_stock))
                                      .replace("{unit}", selectedMaterial.unit_of_measure)}
                                  </Badge>
                                  <span className="text-xs text-red-600">
                                    {tCosts("criticalThresholdLabel")
                                      .replace("{threshold}", String(selectedMaterial.critical_threshold))
                                      .replace("{unit}", selectedMaterial.unit_of_measure)}
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
                                  {tCosts("creatingOrder")}
                                </>
                              ) : (
                                <>
                                  <Save size={18} />
                                  {tCosts("createOrderButton")}
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
                                {tCommon("cancel")}
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
                                  toast.info(tCosts("statusDraftSetInfo"))
                                }}
                                disabled={saving}
                              >
                                {tCosts("saveDraftButton")}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t">
                            <div className="text-center text-sm text-gray-500 space-y-2">
                              <p>
                                <span className="font-medium">{tCosts("statusDraft")}:</span> {tCosts("draftHelpLine1")}
                              </p>
                              <p>
                                <span className="font-medium">{tCosts("statusOrdered")}:</span> {tCosts("draftHelpLine2")}
                              </p>
                              <p className="mt-3">
                                {tCosts("draftHelpLine3")}
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
  )
}
