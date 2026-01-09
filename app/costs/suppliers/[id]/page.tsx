// app/costs/suppliers/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Building, 
  User as UserIcon, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Percent,
  Clock,
  Check,
  Star,
  Package,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  const supplierId = params.id as string

  useEffect(() => {
    if (supplierId && user?.company_id) {
      fetchSupplier()
      fetchOrders()
    }
  }, [supplierId, user?.company_id])

  const fetchSupplier = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .eq('company_id', user?.company_id)
        .single()
      
      if (error) throw error
      setSupplier(data)
    } catch (error) {
      console.error("Error fetching supplier:", error)
      toast.error("Erreur lors du chargement du fournisseur")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('order_date', { ascending: false })
      
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      return
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
      
      if (error) throw error
      
      toast.success("Fournisseur supprimé avec succès")
      router.push("/costs/suppliers")
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
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
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
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

  if (!supplier) {
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
                    Fournisseur non trouvé
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Le fournisseur que vous recherchez n'existe pas ou vous n'avez pas accès.
                  </p>
                  <Button asChild>
                    <Link href="/costs/suppliers">
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

  const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  const completedOrders = orders.filter(order => order.status === 'received').length

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
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <Link href="/costs/suppliers">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={supplier.is_active ? "default" : "secondary"}>
                          {supplier.is_active ? "Actif" : "Inactif"}
                        </Badge>
                        <span className="text-gray-600">{supplier.contact_person}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/costs/suppliers/${supplier.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                    <Button asChild>
                      <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                        <Package className="h-4 w-4 mr-2" />
                        Nouvelle commande
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full max-w-lg mb-8">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="orders">Commandes</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Informations principales */}
                      <Card className="lg:col-span-2">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Informations
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Personne de contact</p>
                                <p className="font-medium">{supplier.contact_person}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Email</p>
                                <p className="font-medium">{supplier.email || "—"}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                                <p className="font-medium">{supplier.phone || "—"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Conditions de paiement</p>
                                <p className="font-medium">{supplier.payment_terms || "—"}</p>
                              </div>
                            </div>
                            
                            {supplier.address && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Adresse</p>
                                <p className="font-medium">{supplier.address}</p>
                                <p className="text-gray-600">
                                  {supplier.city} {supplier.postal_code}
                                </p>
                              </div>
                            )}
                            
                            {supplier.tax_id && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">ICE / IF</p>
                                <p className="font-medium">{supplier.tax_id}</p>
                              </div>
                            )}
                            
                            {supplier.notes && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Notes</p>
                                <p className="text-gray-700">{supplier.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* Statistiques */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques</h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Commandes totales</span>
                              </div>
                              <span className="font-bold">{orders.length}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                <span className="text-sm text-gray-600">Commandes terminées</span>
                              </div>
                              <span className="font-bold">{completedOrders}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-blue-400" />
                                <span className="text-sm text-gray-600">Total dépensé</span>
                              </div>
                              <span className="font-bold">{formatCurrency(totalSpent)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-400" />
                                <span className="text-sm text-gray-600">Membre depuis</span>
                              </div>
                              <span className="font-medium">{formatDate(supplier.created_at)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t">
                            <h4 className="font-medium text-gray-900 mb-2">Évaluation</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">Note globale</span>
                                  <span className="font-bold">{supplier.rating?.toFixed(1) || "0.0"}/5</span>
                                </div>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={16}
                                      className={
                                        i < Math.floor(supplier.rating || 0)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">Ponctualité</span>
                                  <span className="font-bold">{supplier.delivery_score || 0}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${supplier.delivery_score || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">Qualité</span>
                                  <span className="font-bold">{supplier.quality_score || 0}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${supplier.quality_score || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="orders">
                    <Card>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900">Historique des Commandes</h3>
                          <Button asChild size="sm">
                            <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                              <Package className="h-4 w-4 mr-2" />
                              Nouvelle commande
                            </Link>
                          </Button>
                        </div>
                        
                        {orders.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Aucune commande pour ce fournisseur</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">N° Commande</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Montant</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Livraison</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map((order) => (
                                  // app/costs/suppliers/[id]/page.tsx - Section corrigée
<tr key={order.id} className="border-b hover:bg-gray-50">
  <td className="py-3 px-4 font-medium">{order.order_number}</td>
  <td className="py-3 px-4">{formatDate(order.order_date)}</td>
  <td className="py-3 px-4">{formatCurrency(order.total_amount)}</td>
  <td className="py-3 px-4">
    <Badge 
      variant={
        order.status === 'received' ? 'default' :
        order.status === 'pending' ? 'secondary' :
        order.status === 'cancelled' ? 'destructive' : 'outline'
      }
      className={
        order.status === 'received' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
        order.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
        'bg-gray-100 text-gray-700 hover:bg-gray-100'
      }
    >
      {order.status}
    </Badge>
  </td>
  <td className="py-3 px-4">
    {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "—"}
  </td>
  <td className="py-3 px-4">
    <Button variant="ghost" size="sm" asChild>
      <Link href={`/costs/orders/${order.id}`}>
        Voir
      </Link>
    </Button>
  </td>
</tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}