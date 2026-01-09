"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  Clock, 
  Package,
  TrendingUp,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Eye,
  ShoppingCart
} from "lucide-react"
import { costService } from "@/lib/services/costService"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface SuppliersListProps {
  searchTerm: string
  limit?: number
}

export function SuppliersList({ searchTerm, limit = 3 }: SuppliersListProps) {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [supplierStats, setSupplierStats] = useState<Record<string, any>>({})

  useEffect(() => {
    if (user?.company_id) {
      fetchSuppliers()
    }
  }, [user?.company_id, searchTerm])

  useEffect(() => {
    if (suppliers.length > 0) {
      fetchSuppliersStats()
    }
  }, [suppliers])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      
      const companyId = user?.company_id
      if (!companyId) return

      const data = await costService.getSuppliers(companyId, {
        search: searchTerm || undefined
      })
      
      // Limiter au nombre spécifié
      setSuppliers(data.slice(0, limit) || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliersStats = async () => {
    try {
      const stats: Record<string, any> = {}
      
      for (const supplier of suppliers) {
        try {
          const details = await costService.getSupplier(supplier.id)
          const orders = details.purchase_orders || []
          
          const totalSpent = orders.reduce((sum: number, order: any) => 
            sum + (order.total_amount || 0), 0
          )
          
          const completedOrders = orders.filter((order: any) => 
            order.status === 'received' || order.status === 'completed'
          ).length
          
          const onTimeOrders = orders.filter((order: any) => 
            order.status === 'received' && 
            (!order.expected_delivery_date || 
             new Date(order.actual_delivery_date) <= new Date(order.expected_delivery_date))
          ).length
          
          const onTimeRate = orders.length > 0 ? Math.round((onTimeOrders / orders.length) * 100) : 0
          
          stats[supplier.id] = {
            totalOrders: orders.length,
            completedOrders,
            totalSpent,
            onTimeRate,
            qualityRate: supplier.quality_score || 0,
            deliveryScore: supplier.delivery_score || 0
          }
        } catch (error) {
          console.error(`Error fetching stats for supplier ${supplier.id}:`, error)
          stats[supplier.id] = {
            totalOrders: 0,
            completedOrders: 0,
            totalSpent: 0,
            onTimeRate: 0,
            qualityRate: 0,
            deliveryScore: 0
          }
        }
      }
      
      setSupplierStats(stats)
    } catch (error) {
      console.error("Error fetching suppliers stats:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    })
  }

  const formatRating = (rating: number) => {
    if (!rating) return "0.0"
    return rating.toFixed(1)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(limit)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 animate-pulse">
              {/* Header skeleton */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              
              {/* Contact skeleton */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-28"></div>
              </div>
              
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                ))}
              </div>
              
              {/* Actions skeleton */}
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (suppliers.length === 0 && !loading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun fournisseur trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? `Aucun résultat pour "${searchTerm}"`
              : "Commencez par ajouter votre premier fournisseur"}
          </p>
          <Button asChild>
            <Link href="/costs/suppliers/new">
              Ajouter un fournisseur
            </Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {suppliers.map((supplier) => {
        const stats = supplierStats[supplier.id] || {}
        
        return (
          <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              {/* Header avec avatar et info */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-gray-100">
                    <AvatarFallback 
                      className="text-lg font-semibold"
                      style={{ 
                        backgroundColor: supplier.is_active ? '#DCFCE7' : '#F3F4F6',
                        color: supplier.is_active ? '#166534' : '#6B7280'
                      }}
                    >
                      {getInitials(supplier.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {supplier.name}
                      </h3>
                      {supplier.contact_person && (
                        <span className="text-sm text-gray-600">
                          ({supplier.contact_person})
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < Math.floor((supplier.rating || 0)) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }
                          />
                        ))}
                        <span className="text-sm font-medium text-gray-700 ml-1">
                          {formatRating(supplier.rating || 0)}
                        </span>
                      </div>
                      
                      <Badge 
                        variant={supplier.is_active ? "default" : "secondary"}
                        className={
                          supplier.is_active 
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" 
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                        }
                      >
                        {supplier.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Depuis</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-3">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <Phone size={14} />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm">
                      <Mail size={14} />
                      <span className="truncate max-w-[180px]">{supplier.email}</span>
                    </div>
                  )}
                  
                  {supplier.city && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                      <MapPin size={14} />
                      <span>{supplier.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                  Performance
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-blue-600" />
                      <p className="text-xs text-gray-600">Ponctualité</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.onTimeRate || 0}%
                      </p>
                      <span className="text-xs text-gray-500">/100%</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={14} className="text-amber-600" />
                      <p className="text-xs text-gray-600">Qualité</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {supplier.quality_score || 0}%
                      </p>
                      <span className="text-xs text-gray-500">/100%</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={14} className="text-green-600" />
                      <p className="text-xs text-gray-600">Commandes</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders || 0}
                      </p>
                      <span className="text-xs text-gray-500">
                        ({stats.completedOrders || 0} complétées)
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-purple-600" />
                      <p className="text-xs text-gray-600">Total Dépensé</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalSpent || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link href={`/costs/suppliers/${supplier.id}`}>
                    <Eye size={16} />
                    Voir Détails
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link href={`/costs/suppliers/${supplier.id}/orders`}>
                    <Package size={16} />
                    Historique Commandes
                  </Link>
                </Button>
                
                <Button 
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                    <ShoppingCart size={16} />
                    Nouvelle Commande
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

      {/* Bouton pour voir plus de fournisseurs */}
      {suppliers.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link href="/costs/suppliers">
              Voir tous les fournisseurs ({suppliers.length})
              <TrendingUp size={16} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}