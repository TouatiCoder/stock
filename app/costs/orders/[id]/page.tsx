// app/costs/orders/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Printer,
  Download,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  DollarSign,
  Calendar,
  User,
  Building,
  FileText,
  ExternalLink,
  MoreVertical,
  Copy,
  Eye
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PurchaseOrder {
  id: string
  order_number: string
  supplier_id: string
  project_id: string | null
  requested_by: string
  status: 'draft' | 'pending' | 'ordered' | 'approved' | 'delivered' | 'cancelled'
  total_amount: number
  tax_amount: number
  order_date: string
  expected_delivery_date: string
  actual_delivery_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  supplier: {
    id: string
    name: string
    contact_person: string | null
    email: string | null
    phone: string | null
    rating: number | null
  }
  project: {
    id: string
    name: string
    client_name: string | null
  } | null
  requested_by_user: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
}

interface OrderItem {
  id: string
  material_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes: string | null
  material: {
    id: string
    name: string
    sku: string | null
    unit_of_measure: string
    category: {
      name: string
    } | null
  }
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const orderId = params.id as string

  useEffect(() => {
    if (orderId && user?.company_id) {
      fetchOrderDetails()
    }
  }, [orderId, user?.company_id])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)

      // Récupérer la commande avec les relations
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, contact_person, email, phone, rating),
          project:projects(id, name, client_name),
          requested_by_user:users(id, first_name, last_name, email)
        `)
        .eq('id', orderId)
        .eq('company_id', user?.company_id)
        .single()

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          toast.error("Commande non trouvée")
          router.push('/costs/orders')
          return
        }
        throw orderError
      }

      setOrder(orderData)

      // Récupérer les articles de la commande
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          material:materials(
            id,
            name,
            sku,
            unit_of_measure,
            category:material_categories(name)
          )
        `)
        .eq('purchase_order_id', orderId)
        .order('created_at')

      if (itemsError) throw itemsError
      setItems(itemsData || [])

    } catch (error: any) {
      console.error("Erreur lors du chargement de la commande:", error)
      toast.error("Erreur lors du chargement de la commande")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
      pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
      ordered: { label: "Commandée", color: "bg-blue-100 text-blue-800" },
      approved: { label: "Approuvée", color: "bg-green-100 text-green-800" },
      delivered: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
      cancelled: { label: "Annulée", color: "bg-red-100 text-red-800" }
    }
    
    const statusVariant = variants[status as keyof typeof variants] || variants.draft
    return (
      <Badge className={`${statusVariant.color} px-3 py-1`}>
        {statusVariant.label}
      </Badge>
    )
  }

  const handleUpdateStatus = async (newStatus: PurchaseOrder['status']) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success(`Statut mis à jour: ${newStatus}`)
      fetchOrderDetails()
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleDeleteOrder = async () => {
    try {
      setDeleting(true)
      
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      toast.success("Commande supprimée avec succès")
      router.push('/costs/orders')
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression de la commande")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handlePrint = () => {
    toast.info("Fonction d'impression à implémenter")
    // Implémenter la logique d'impression ici
  }

  const handleDownloadPDF = () => {
    toast.info("Fonction de téléchargement PDF à implémenter")
    // Implémenter la génération de PDF ici
  }

  const handleSendEmail = () => {
    if (!order?.supplier.email) {
      toast.error("Aucun email disponible pour ce fournisseur")
      return
    }
    toast.info(`Envoi d'email à ${order.supplier.email}`)
    // Implémenter l'envoi d'email ici
  }

  const handleDuplicateOrder = async () => {
    try {
      toast.loading("Duplication en cours...")
      
      // Générer un nouveau numéro de commande
      const date = new Date()
      const year = date.getFullYear().toString().slice(-2)
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const newOrderNumber = `CMD-${year}${month}${day}-${random}`

      // Créer la nouvelle commande
      const { data: newOrder, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{
          order_number: newOrderNumber,
          supplier_id: order?.supplier_id,
          company_id: user?.company_id,
          project_id: order?.project_id,
          requested_by: user?.id,
          status: 'draft',
          total_amount: order?.total_amount,
          tax_amount: order?.tax_amount,
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: order?.expected_delivery_date,
          notes: `Copie de ${order?.order_number}\n${order?.notes || ''}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Dupliquer les articles
      const newItems = items.map(item => ({
        purchase_order_id: newOrder.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(newItems)

      if (itemsError) throw itemsError

      toast.dismiss()
      toast.success("Commande dupliquée avec succès")
      router.push(`/costs/orders/${newOrder.id}`)
      
    } catch (error: any) {
      console.error("Erreur lors de la duplication:", error)
      toast.error("Erreur lors de la duplication de la commande")
    }
  }

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
                        <div className="h-96 bg-gray-200 rounded"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-64 bg-gray-200 rounded"></div>
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

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Commande non trouvée</h2>
                <p className="text-gray-600 mb-6">La commande que vous recherchez n'existe pas ou a été supprimée.</p>
                <Button onClick={() => router.push('/costs/orders')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux commandes
                </Button>
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
                        onClick={() => router.push('/costs/orders')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        Retour
                      </Button>
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="text-3xl font-bold text-gray-900">
                            Commande {order.order_number}
                          </h1>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          Créée le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="flex items-center gap-2"
                      >
                        <Printer size={16} />
                        Imprimer
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleDownloadPDF}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSendEmail} disabled={!order.supplier.email}>
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer par email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDuplicateOrder}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <Link href={`/costs/orders/${order.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Informations principales */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Informations de la commande */}
                    <Card>
                      <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                          Détails de la commande
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Fournisseur */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">Fournisseur</h3>
                            </div>
                            <div className="ml-6 space-y-1">
                              <p className="font-medium">{order.supplier.name}</p>
                              {order.supplier.contact_person && (
                                <p className="text-sm text-gray-600">
                                  Contact: {order.supplier.contact_person}
                                </p>
                              )}
                              {order.supplier.email && (
                                <p className="text-sm text-gray-600">{order.supplier.email}</p>
                              )}
                              {order.supplier.phone && (
                                <p className="text-sm text-gray-600">{order.supplier.phone}</p>
                              )}
                              {order.supplier.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-sm text-gray-600">Note:</span>
                                  <span className="text-sm font-medium">
                                    {order.supplier.rating.toFixed(1)} ⭐
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 ml-6">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/costs/suppliers/${order.supplier.id}`}>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Voir le fournisseur
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Dates */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">Dates</h3>
                            </div>
                            <div className="ml-6 space-y-2">
                              <div>
                                <p className="text-sm text-gray-600">Date de commande</p>
                                <p className="font-medium">
                                  {new Date(order.order_date).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Livraison prévue</p>
                                <p className="font-medium">
                                  {new Date(order.expected_delivery_date).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              {order.actual_delivery_date && (
                                <div>
                                  <p className="text-sm text-gray-600">Livraison effective</p>
                                  <p className="font-medium">
                                    {new Date(order.actual_delivery_date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Projet */}
                          {order.project && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <h3 className="font-medium text-gray-900">Projet</h3>
                              </div>
                              <div className="ml-6 space-y-1">
                                <p className="font-medium">{order.project.name}</p>
                                {order.project.client_name && (
                                  <p className="text-sm text-gray-600">
                                    Client: {order.project.client_name}
                                  </p>
                                )}
                              </div>
                              <div className="mt-3 ml-6">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/projects/${order.project.id}`}>
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Voir le projet
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Demandeur */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">Demandeur</h3>
                            </div>
                            <div className="ml-6 space-y-1">
                              {order.requested_by_user ? (
                                <>
                                  <p className="font-medium">
                                    {order.requested_by_user.first_name} {order.requested_by_user.last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {order.requested_by_user.email}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600">Utilisateur non disponible</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">Notes</h3>
                            </div>
                            <p className="ml-6 text-gray-700 whitespace-pre-line">
                              {order.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Articles de la commande */}
                    <Card>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            Articles de la commande ({items.length})
                          </h2>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Fonctionnalité pour ajouter un article
                              toast.info("Fonctionnalité d'ajout à implémenter")
                            }}
                          >
                            + Ajouter un article
                          </Button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Matériau</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Quantité</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Prix unitaire</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Notes</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{item.material.name}</p>
                                      <div className="text-sm text-gray-500">
                                        {item.material.sku && (
                                          <span>SKU: {item.material.sku} • </span>
                                        )}
                                        <span>{item.material.category?.name}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">
                                        {item.quantity} {item.material.unit_of_measure}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium">
                                      {item.unit_price.toLocaleString('fr-MA', {
                                        style: 'currency',
                                        currency: 'MAD'
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      / {item.material.unit_of_measure}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-blue-600">
                                      {item.total_price.toLocaleString('fr-MA', {
                                        style: 'currency',
                                        currency: 'MAD'
                                      })}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                      {item.notes || '—'}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // Voir le matériau
                                          router.push(`/materials/${item.material.id}`)
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // Modifier l'article
                                          toast.info("Fonctionnalité de modification à implémenter")
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {items.length === 0 && (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">Aucun article dans cette commande</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Résumé financier */}
                    <Card>
                      <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé financier</h2>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Sous-total</span>
                            <span className="font-semibold">
                              {order.total_amount.toLocaleString('fr-MA', {
                                style: 'currency',
                                currency: 'MAD'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">TVA (20%)</span>
                            <span className="font-semibold">
                              {order.tax_amount.toLocaleString('fr-MA', {
                                style: 'currency',
                                currency: 'MAD'
                              })}
                            </span>
                          </div>
                          
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total TTC</span>
                              <span className="text-blue-600">
                                {(order.total_amount + order.tax_amount).toLocaleString('fr-MA', {
                                  style: 'currency',
                                  currency: 'MAD'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nombre d'articles</span>
                              <span>{items.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dernière mise à jour</span>
                              <span>
                                {new Date(order.updated_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Actions rapides */}
                    <Card>
                      <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus('ordered')}
                              disabled={order.status !== 'draft' && order.status !== 'pending'}
                              className="justify-start"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Marquer comme commandée
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus('approved')}
                              disabled={order.status !== 'ordered'}
                              className="justify-start"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approuver
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus('delivered')}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                              className="justify-start"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Marquer comme livrée
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus('cancelled')}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                              className="justify-start text-red-600 hover:text-red-700 hover:border-red-200"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              // Historique des modifications
                              toast.info("Historique des modifications à implémenter")
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Voir l'historique
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Logs d'activité */}
                    <Card>
                      <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Activité récente</h2>
                        
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Commande créée</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Statut modifié</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.updated_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Dernière vue</p>
                            <p className="text-xs text-gray-500">
                              Maintenant
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Dialogue de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la commande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la commande {order.order_number} ? 
              Cette action est irréversible et supprimera également tous les articles associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}