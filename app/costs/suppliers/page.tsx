// app/costs/suppliers/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  Building, 
  Download,
  BarChart3,
  List,
  Grid3X3
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { getSuppliers, getSupplierStats } from "@/app/actions/supplier-actions"

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  deliveryScore?: number;
  qualityScore?: number;
}

export default function SuppliersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    topSupplier: "",
    totalSpent: 0
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.companyId) {
      fetchSuppliers()
      fetchStats()
    }
  }, [user?.companyId])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      
      if (!user?.companyId) return

      const result = await getSuppliers(user.companyId)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch")
      }
      
      // Map the suppliers to match the expected interface
      const mappedSuppliers: Supplier[] = result.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson,
        email: s.email,
        phone: s.phone,
        address: s.address,
        isActive: s.isActive,
        companyId: s.companyId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        rating: typeof s.rating === 'number' ? s.rating : 0,
        deliveryScore: typeof s.deliveryScore === 'number' ? s.deliveryScore : undefined,
        qualityScore: typeof s.qualityScore === 'number' ? s.qualityScore : undefined
      }));
      
      setSuppliers(mappedSuppliers)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast.error("Erreur lors du chargement des fournisseurs")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      if (!user?.companyId) return

      const result = await getSupplierStats(user.companyId)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch stats")
      }

      setStats(result.data)
    } catch (error) {
      console.error("Error fetching supplier stats:", error)
    }
  }

  const handleExport = () => {
    // Logique d'export
    console.log("Exporting suppliers data...")
    toast.info("Export en cours...")
  }

  // Filtrer les fournisseurs selon les critères
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchTerm === "" || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "active" && supplier.isActive) ||
      (activeTab === "inactive" && !supplier.isActive)

    return matchesSearch && matchesTab
  })

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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fournisseurs</h1>
                    <p className="text-gray-600 mt-1">Gérez vos fournisseurs et suivez leurs performances</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                    <Button asChild>
                      <Link href="/costs/suppliers/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Fournisseur
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">fournisseurs</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Actifs</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                        </div>
                        <Building className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">en activité</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Principal</p>
                          <p className="text-lg font-bold text-gray-900 truncate">{stats.topSupplier}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">meilleur évaluation</p>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Dépensé</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(stats.totalSpent)}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-amber-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">tous fournisseurs</p>
                    </div>
                  </Card>
                </div>

                {/* Barre de recherche et filtres */}
                <Card className="mb-6">
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Rechercher un fournisseur..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtrer
                        </Button>
                        
                        <div className="flex border rounded-lg overflow-hidden">
                          <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-none h-10 w-10"
                            onClick={() => setViewMode("list")}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            className="rounded-none h-10 w-10"
                            onClick={() => setViewMode("grid")}
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tabs pour filtrage rapide */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                      <TabsList className="grid grid-cols-3 w-full max-w-md">
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        <TabsTrigger value="active">Actifs</TabsTrigger>
                        <TabsTrigger value="inactive">Inactifs</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </Card>

                {/* Liste des fournisseurs */}
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="p-6 animate-pulse">
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
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {[...Array(4)].map((_, j) => (
                              <div key={j}>
                                <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-12"></div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <Card>
                    <div className="p-8 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
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
                ) : viewMode === "list" ? (
                  <div className="space-y-4">
                    {filteredSuppliers.map((supplier) => (
                      <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Building className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {supplier.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-gray-600">{supplier.contactPerson}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`text-xs px-2 py-1 rounded-full ${
                                  supplier.isActive 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {supplier.isActive ? "Actif" : "Inactif"}
                                </div>
                              </div>
                              
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/costs/suppliers/${supplier.id}`}>
                                  Voir détails
                                </Link>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Email</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {supplier.email || "—"}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Téléphone</p>
                              <p className="text-sm font-medium text-gray-900">
                                {supplier.phone || "—"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/costs/suppliers/${supplier.id}`}>
                                Détails
                              </Link>
                            </Button>
                            <Button size="sm" asChild className="flex-1">
                              <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                                Nouvelle commande
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuppliers.map((supplier) => (
                      <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <div className="p-6">
                          <div className="text-center mb-4">
                            <div className="inline-flex h-16 w-16 rounded-full bg-blue-100 items-center justify-center mb-3">
                              <Building className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {supplier.name}
                            </h3>
                            <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Note</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatRating(supplier.rating || 0)}/5
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Statut</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                supplier.isActive 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {supplier.isActive ? "Actif" : "Inactif"}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Ponctualité</span>
                              <span className="text-sm font-medium text-gray-900">
                                {supplier.rating ? Math.round(Number(supplier.rating)) : 0}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Qualité</span>
                              <span className="text-sm font-medium text-gray-900">
                                {supplier.rating ? Math.round(Number(supplier.rating)) : 0}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/costs/suppliers/${supplier.id}`}>
                                Détails
                              </Link>
                            </Button>
                            <Button size="sm" asChild className="flex-1">
                              <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                                Commander
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination (si besoin) */}
                {filteredSuppliers.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Précédent
                      </Button>
                      <Button variant="outline" size="sm">
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
      </div>
    </div>
  )
}
