"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
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
  Package,
  Calendar,
  User,
  Building,
  ExternalLink,
  MoreVertical,
  Copy,
  Eye,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { getOrderById, deleteOrder } from "@/app/actions/order-actions"

interface OrderItem {
  id: string
  materialId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  material: {
    id: string
    name: string
    sku: string | null
    unitOfMeasure: string
    category: string | null
  }
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  status: string
  totalAmount: number | null
  orderDate: Date | null
  expectedDelivery: Date | null
  actualDelivery: Date | null
  companyId: string
  createdById: string
  createdAt: Date
  updatedAt: Date
  supplier: {
    id: string
    name: string
    contactPerson: string | null
    email: string | null
    phone: string | null
  }
  project: {
    id: string
    name: string
    clientName: string | null
  } | null
  createdBy: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  items?: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  const orderId = params.id as string

  useEffect(() => {
    if (orderId && user?.companyId) {
      fetchOrder()
    }
  }, [orderId, user?.companyId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      
      const result = await getOrderById(orderId)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Order not found")
      }
      
      const orderData = result.data
      
      // Transform dates from string to Date objects if necessary (server actions return JSON dates as strings usually, but Prisma returns Date objects. 
      // Next.js serializes Server Actions results, so dates might be strings.
      // Let's handle it safely.)
      
      const parseDate = (date: any) => date ? new Date(date) : null

      const { items: rawItems, ...orderBase } = orderData

      const enrichedOrder: PurchaseOrder = {
        ...orderBase,
        orderDate: parseDate(orderData.orderDate),
        expectedDelivery: parseDate(orderData.expectedDelivery),
        actualDelivery: parseDate(orderData.actualDelivery),
        createdAt: parseDate(orderData.createdAt)!,
        updatedAt: parseDate(orderData.updatedAt)!,
        totalAmount: orderData.totalAmount ? Number(orderData.totalAmount) : null,
        supplier: {
          ...orderData.supplier
        },
        project: null, // As per original code, project relation is missing in fetched data
        createdBy: orderData.createdBy ? {
          ...orderData.createdBy,
          firstName: orderData.createdBy.firstName || null,
          lastName: orderData.createdBy.lastName || null
        } : null
      }
      
      setOrder(enrichedOrder)
      
      const enrichedItems: OrderItem[] = (rawItems || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity.toString()),
        unitPrice: Number(item.unitPrice.toString()),
        totalPrice: Number(item.totalPrice.toString()),
        material: {
            ...item.material,
            category: item.material.category // Ensure category is handled as string | null
        }
      }))
      
      setItems(enrichedItems)
      
    } catch (error) {
      console.error("Error fetching order:", error)
      toast.error("Erreur lors du chargement de la commande")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      return
    }

    try {
      const result = await deleteOrder(orderId)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete")
      }
      
      toast.success("Commande supprimée avec succès")
      router.push("/costs/orders")
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string, color: string }> = {
      draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
      pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
      ordered: { label: "Commandée", color: "bg-blue-100 text-blue-800" },
      approved: { label: "Approuvée", color: "bg-green-100 text-green-800" },
      delivered: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
      cancelled: { label: "Annulée", color: "bg-red-100 text-red-800" }
    }
    
    const statusVariant = variants[status] || variants.draft
    return (
      <Badge className={`${statusVariant.color} px-3 py-1`}>
        {statusVariant.label}
      </Badge>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.info("Fonctionnalité de téléchargement PDF à venir")
  }

  const handleSendEmail = () => {
    if (!order?.supplier.email) {
      toast.error("Aucune adresse email pour ce fournisseur")
      return
    }
    toast.info(`Email envoyé à ${order.supplier.email}`)
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
                    <div className="h-64 bg-gray-200 rounded"></div>
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
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="max-w-7xl mx-auto text-center">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Commande non trouvée
                  </h2>
                  <p className="text-gray-600 mb-6">
                    La commande que vous recherchez n'existe pas ou vous n'avez pas accès.
                  </p>
                  <Button asChild>
                    <Link href="/costs/orders">
                      Retour à la liste
                    </Link>
                  </Button>
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
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
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
                            Commande {order.orderNumber}
                          </h1>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          Créée le {order.createdAt.toLocaleDateString('fr-FR')}
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
                          <DropdownMenuItem>
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
                            className="text-red-600 focus:text-red-600"
                            onClick={handleDelete}
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
                              {order.supplier.contactPerson && (
                                <p className="text-sm text-gray-600">
                                  Contact: {order.supplier.contactPerson}
                                </p>
                              )}
                              {order.supplier.email && (
                                <p className="text-sm text-gray-600">{order.supplier.email}</p>
                              )}
                              {order.supplier.phone && (
                                <p className="text-sm text-gray-600">{order.supplier.phone}</p>
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
                                  {order.orderDate ? order.orderDate.toLocaleDateString('fr-FR') : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Livraison prévue</p>
                                <p className="font-medium">
                                  {order.expectedDelivery ? order.expectedDelivery.toLocaleDateString('fr-FR') : '-'}
                                </p>
                              </div>
                              {order.actualDelivery && (
                                <div>
                                  <p className="text-sm text-gray-600">Livraison effective</p>
                                  <p className="font-medium">
                                    {order.actualDelivery.toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Demandeur */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">Demandeur</h3>
                            </div>
                            <div className="ml-6 space-y-1">
                              {order.createdBy ? (
                                <>
                                  <p className="font-medium">
                                    {order.createdBy.firstName} {order.createdBy.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {order.createdBy.email}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600">Utilisateur non disponible</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Articles de la commande */}
                    <Card>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            Articles de la commande ({items.length})
                          </h2>
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
                              {items.map((item: OrderItem) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{item.material.name}</p>
                                      <div className="text-sm text-gray-500">
                                        {item.material.sku && (
                                          <span>SKU: {item.material.sku} • </span>
                                        )}
                                        <span>{item.material.category}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">
                                        {item.quantity} {item.material.unitOfMeasure}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium">
                                      {item.unitPrice.toLocaleString('fr-MA', {
                                        style: 'currency',
                                        currency: 'MAD'
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      / {item.material.unitOfMeasure}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-blue-600">
                                      {item.totalPrice.toLocaleString('fr-MA', {
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
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
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
                            <span className="text-gray-600">Total</span>
                            <span className="font-semibold">
                              {(order.totalAmount || 0).toLocaleString('fr-MA', {
                                style: 'currency',
                                currency: 'MAD'
                              })}
                            </span>
                          </div>
                          
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total TTC</span>
                              <span className="text-blue-600">
                                {(order.totalAmount || 0).toLocaleString('fr-MA', {
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
                                {order.updatedAt.toLocaleDateString('fr-FR')}
                              </span>
                            </div>
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
    </ProtectedRoute>
  )
}
