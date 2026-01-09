"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  Trash2,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { costService } from "@/lib/services/costService"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface OrdersListProps {
  searchTerm: string
}

export function OrdersList({ searchTerm }: OrdersListProps) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.company_id) {
      fetchOrders()
    }
  }, [user?.company_id, searchTerm])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      const companyId = user?.company_id
      if (!companyId) return

      const data = await costService.getPurchaseOrders(companyId, {
        search: searchTerm || undefined
      })
      
      // Limiter à 3 commandes pour garder le design original
      setOrders(data.slice(0, 3) || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return "bg-green-50 text-green-700"
      case 'ordered':
      case 'partially_received':
        return "bg-blue-50 text-blue-700"
      case 'approved':
        return "bg-purple-50 text-purple-700"
      case 'pending':
        return "bg-yellow-50 text-yellow-700"
      case 'cancelled':
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return "Livrée"
      case 'ordered': return "Commandée"
      case 'partially_received': return "Partiellement livrée"
      case 'approved': return "Approuvée"
      case 'pending': return "En attente"
      case 'cancelled': return "Annulée"
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return CheckCircle
      case 'ordered': case 'partially_received': return Package
      case 'approved': return CheckCircle
      case 'pending': return Clock
      case 'cancelled': return AlertTriangle
      default: return Package
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <Card>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commande</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fournisseur</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Montant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Card>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commande</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fournisseur</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Montant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{order.order_number}</div>
                          {order.project?.name && (
                            <div className="text-xs text-gray-500">{order.project.name}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-gray-900">
                        {order.supplier?.name || "Non spécifié"}
                      </td>
                      
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(order.order_date)}
                      </td>
                      
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatCurrency(order.total_amount || 0)}
                      </td>
                      
                      <td className="px-6 py-4">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                          <StatusIcon size={12} />
                          {getStatusText(order.status)}
                        </Badge>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Link href={`/costs/orders/${order.id}`}>
                              <Eye size={16} className="text-gray-600" />
                            </Link>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
                                // Logique de suppression
                              }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Bouton pour voir plus de commandes */}
      {orders.length > 0 && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/costs/orders">
              Voir toutes les commandes
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}