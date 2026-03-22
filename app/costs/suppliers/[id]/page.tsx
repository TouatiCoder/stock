// app/costs/suppliers/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, Building, Calendar, Check, DollarSign, Package, Trash2 } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { getSupplierById, deleteSupplier } from "@/app/actions/supplier-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const supplierId = params.id as string

  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (supplierId && user?.companyId) {
      fetchSupplierData()
    }
  }, [supplierId, user?.companyId])

  const fetchSupplierData = async () => {
    try {
      setLoading(true)
      const result = await getSupplierById(supplierId)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch supplier")
      }

      const { orders: supplierOrders, ...supplierData } = result.data
      setSupplier(supplierData)
      setOrders(supplierOrders || [])
    } catch (error) {
      console.error("Error fetching supplier:", error)
      toast.error("Erreur lors du chargement du fournisseur")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Etes-vous sur de vouloir supprimer ce fournisseur ?")) return

    try {
      const result = await deleteSupplier(supplierId)
      if (!result.success) throw new Error(result.error || "Failed to delete")

      toast.success("Fournisseur supprime avec succes")
      router.push("/costs/suppliers")
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    })
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR")
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!supplier) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fournisseur non trouve</h2>
          <p className="text-gray-600 mb-6">
            Le fournisseur que vous recherchez n'existe pas ou vous n'avez pas acces.
          </p>
          <Button asChild>
            <Link href="/costs/suppliers">Retour a la liste</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  const totalSpent = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  const completedOrders = orders.filter((order) => order.status === "delivered").length

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
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
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? "Actif" : "Inactif"}
                </Badge>
                <span className="text-gray-600">{supplier.contactPerson || "-"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-lg mb-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Personne de contact</p>
                      <p className="font-medium">{supplier.contactPerson || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium">{supplier.email || "-"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Telephone</p>
                    <p className="font-medium">{supplier.phone || "-"}</p>
                  </div>

                  {supplier.address && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Adresse</p>
                      <p className="font-medium">{supplier.address}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
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
                      <span className="text-sm text-gray-600">Commandes terminees</span>
                    </div>
                    <span className="font-bold">{completedOrders}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-600">Total depense</span>
                    </div>
                    <span className="font-bold">{formatCurrency(totalSpent)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-gray-600">Membre depuis</span>
                    </div>
                    <span className="font-medium">{formatDate(supplier.createdAt)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Historique des commandes</h3>
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
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">No Commande</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Montant</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Livraison</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                          <td className="py-3 px-4">{formatDate(order.orderDate)}</td>
                          <td className="py-3 px-4">{formatCurrency(Number(order.totalAmount))}</td>
                          <td className="py-3 px-4">{order.status}</td>
                          <td className="py-3 px-4">{order.expectedDelivery ? formatDate(order.expectedDelivery) : "-"}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/costs/orders/${order.id}`}>Voir</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
