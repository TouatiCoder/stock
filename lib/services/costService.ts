// lib/services/costService.ts
// Simplified version focusing on calculation utilities
// Database integration will be added later with Prisma

// ============ TYPES ============
export type OrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled'
export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled'
export type CostType = 'material' | 'labor' | 'equipment' | 'subcontractor' | 'overhead' | 'other'

export interface Supplier {
  id: string
  companyId: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  taxId?: string
  paymentTerms?: string
  rating: number
  deliveryScore: number
  qualityScore: number
  isActive: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  companyId: string
  projectId?: string
  requestedBy: string
  approvedBy?: string
  status: OrderStatus
  totalAmount: number
  taxAmount: number
  orderDate: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  supplier?: { name: string }
  project?: { name: string }
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  materialId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  material?: { name: string; unitOfMeasure: string }
}

export interface Invoice {
  id: string
  invoiceNumber: string
  supplierId: string
  companyId: string
  purchaseOrderId?: string
  projectId?: string
  status: InvoiceStatus
  invoiceDate: Date
  dueDate?: Date
  totalAmount: number
  taxAmount: number
  paidAmount: number
  paidDate?: Date
  fileUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CostCenter {
  id: string
  projectId: string
  name: string
  code?: string
  budget: number
  actualCost: number
  costType: CostType
  createdAt: Date
  updatedAt: Date
}

export interface CostStats {
  totalOrders: number
  pendingOrders: number
  totalSuppliers: number
  activeSuppliers: number
  totalInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalSpent: number
  totalBudget: number
  budgetUtilization: number
  byMonth: Array<{ month: string; spent: number; budget: number }>
  byCategory: Array<{ category: string; amount: number; percentage: number }>
  bySupplier: Array<{ name: string; percentage: number; amount: number }>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface FilterOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: string
  supplierId?: string
  projectId?: string
  startDate?: string
  endDate?: string
}

// Clés de cache
const CACHE_KEYS = {
  COST_STATS: (companyId: string) => `cost-stats-${companyId}`,
  SUPPLIER_STATS: (companyId: string) => `supplier-stats-${companyId}`
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ============ FONCTIONS UTILITAIRES PRIVÉES ============
function getCategoryLabel(category: CostType): string {
  const labels: Record<CostType, string> = {
    material: 'Matériaux',
    labor: 'Main d\'œuvre',
    equipment: 'Équipement',
    subcontractor: 'Sous-traitance',
    overhead: 'Frais généraux',
    other: 'Autres'
  }
  return labels[category] || category
}

function getDefaultCategories(totalSpent: number) {
  const percentages = [0.6, 0.25, 0.1, 0.05]
  const categories = ['Matériaux', 'Main d\'œuvre', 'Équipement', 'Sous-traitance']
  
  return categories.map((category, index) => ({
    category,
    amount: totalSpent * percentages[index],
    percentage: Math.round(percentages[index] * 100)
  }))
}

function getDefaultSuppliers() {
  return [
    { name: "Fournisseur A", percentage: 35, amount: 0 },
    { name: "Fournisseur B", percentage: 28, amount: 0 },
    { name: "Fournisseur C", percentage: 22, amount: 0 },
    { name: "Autres", percentage: 15, amount: 0 }
  ]
}

// Fonctions utilitaires pour le cache
async function getCachedData<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    
    return data
  } catch (error) {
    console.warn('Cache read error:', error)
    return null
  }
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.warn('Cache write error:', error)
  }
}

// ============ SERVICE ============
export const costService = {
  
  // ============ CACHE ============
  async getCachedData<T>(key: string): Promise<T | null> {
    return getCachedData(key)
  },

  async setCachedData<T>(key: string, data: T): Promise<void> {
    return setCachedData(key, data)
  },

  async invalidateCache(companyId: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    Object.values(CACHE_KEYS).forEach(keyFn => {
      const key = keyFn(companyId)
      localStorage.removeItem(key)
    })
  },

  // ============ STATISTIQUES ============
  async getCostStats(companyId: string): Promise<CostStats> {
    try {
      // Vérifier le cache
      const cacheKey = CACHE_KEYS.COST_STATS(companyId)
      const cached = await getCachedData<CostStats>(cacheKey)
      if (cached) return cached
      
      // Données de démonstration - à remplacer par les vraies données Prisma
      const demoData: CostStats = {
        totalOrders: 12,
        pendingOrders: 3,
        totalSuppliers: 8,
        activeSuppliers: 7,
        totalInvoices: 45,
        pendingInvoices: 2,
        overdueInvoices: 1,
        totalSpent: 125000,
        totalBudget: 200000,
        budgetUtilization: 62.5,
        byMonth: [
          { month: 'juil. 2024', spent: 18000, budget: 33333 },
          { month: 'août 2024', spent: 22000, budget: 33333 },
          { month: 'sept. 2024', spent: 15000, budget: 33333 },
          { month: 'oct. 2024', spent: 25000, budget: 33333 },
          { month: 'nov. 2024', spent: 20000, budget: 33333 },
          { month: 'déc. 2024', spent: 25000, budget: 33333 }
        ],
        byCategory: [
          { category: 'Matériaux', amount: 75000, percentage: 60 },
          { category: 'Main d\'œuvre', amount: 31250, percentage: 25 },
          { category: 'Équipement', amount: 12500, percentage: 10 },
          { category: 'Sous-traitance', amount: 6250, percentage: 5 }
        ],
        bySupplier: [
          { name: "Fournisseur A", percentage: 35, amount: 43750 },
          { name: "Fournisseur B", percentage: 28, amount: 35000 },
          { name: "Fournisseur C", percentage: 22, amount: 27500 },
          { name: "Autres", percentage: 15, amount: 18750 }
        ]
      }

      // Mettre en cache
      await setCachedData(cacheKey, demoData)
      
      return demoData

    } catch (error) {
      console.error('Error in getCostStats:', error)
      
      // Retourner des données par défaut en cas d'erreur
      return {
        totalOrders: 0,
        pendingOrders: 0,
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalSpent: 0,
        totalBudget: 0,
        budgetUtilization: 0,
        byMonth: [],
        byCategory: getDefaultCategories(0),
        bySupplier: getDefaultSuppliers()
      }
    }
  },

  async getSupplierStats(companyId: string): Promise<Array<{ name: string; percentage: number; amount: number }>> {
    try {
      const cacheKey = CACHE_KEYS.SUPPLIER_STATS(companyId)
      const cached = await getCachedData<Array<{ name: string; percentage: number; amount: number }>>(cacheKey)
      if (cached) return cached

      const demoStats = [
        { name: "Fournisseur A", percentage: 35, amount: 43750 },
        { name: "Fournisseur B", percentage: 28, amount: 35000 },
        { name: "Fournisseur C", percentage: 22, amount: 27500 },
        { name: "Autres", percentage: 15, amount: 18750 }
      ]

      // Mettre en cache
      await setCachedData(cacheKey, demoStats)
      
      return demoStats

    } catch (error) {
      console.error('Error in getSupplierStats:', error)
      return getDefaultSuppliers()
    }
  },

  // ============ FOURNISSEURS ============
  async getSuppliers(companyId: string, filters?: {
    search?: string
    activeOnly?: boolean
  }): Promise<Supplier[]> {
    console.warn('costService.getSuppliers: Not implemented with Prisma yet');
    return [];
  },

  async getSupplier(id: string): Promise<Supplier & {
    purchaseOrders?: PurchaseOrder[]
    invoices?: Invoice[]
  }> {
    console.warn('costService.getSupplier: Not implemented with Prisma yet');
    return {} as any;
  },

  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    console.warn('costService.createSupplier: Not implemented with Prisma yet');
    return {} as any;
  },

  async updateSupplier(id: string, companyId: string, updates: Partial<Supplier>): Promise<Supplier> {
    console.warn('costService.updateSupplier: Not implemented with Prisma yet');
    return {} as any;
  },

  // ============ COMMANDES ============
  async getPurchaseOrders(
    companyId: string, 
    filters?: FilterOptions
  ): Promise<PurchaseOrder[]> {
    console.warn('costService.getPurchaseOrders: Not implemented with Prisma yet');
    return [];
  },

  async getPurchaseOrdersPaginated(
    companyId: string, 
    filters?: FilterOptions
  ): Promise<PaginatedResponse<PurchaseOrder>> {
    console.warn('costService.getPurchaseOrdersPaginated: Not implemented with Prisma yet');
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      hasMore: false
    };
  },

  async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> {
    console.warn('costService.createPurchaseOrder: Not implemented with Prisma yet');
    return {} as any;
  },

  async updatePurchaseOrder(id: string, companyId: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    console.warn('costService.updatePurchaseOrder: Not implemented with Prisma yet');
    return {} as any;
  },

  async deletePurchaseOrder(companyId: string, orderId: string): Promise<void> {
    console.warn('costService.deletePurchaseOrder: Not implemented with Prisma yet');
  },

  // ============ FACTURES ============
  async getInvoices(companyId: string, filters?: {
    status?: string
    supplierId?: string
    overdueOnly?: boolean
  }): Promise<Invoice[]> {
    console.warn('costService.getInvoices: Not implemented with Prisma yet');
    return [];
  },

  // ============ CENTRES DE COÛTS ============
  async getProjectCostCenters(projectId: string): Promise<CostCenter[]> {
    console.warn('costService.getProjectCostCenters: Not implemented with Prisma yet');
    return [];
  },

  async getBudgetVsSpent(companyId: string) {
    console.warn('costService.getBudgetVsSpent: Not implemented with Prisma yet');
    return [];
  },

  // ============ RAPPORTS ============
  async generateCostReport(companyId: string, startDate?: string, endDate?: string): Promise<PurchaseOrder[]> {
    console.warn('costService.generateCostReport: Not implemented with Prisma yet');
    return [];
  },

  // ============ MÉTHODES DE FORMATAGE ============
  formatCurrency(amount: number, currency: string = 'MAD'): string {
    return amount.toLocaleString('fr-MA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  },

  getStatusColor(status: OrderStatus | InvoiceStatus): string {
    const colors: Record<string, string> = {
      // Commandes
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-indigo-100 text-indigo-800',
      partially_received: 'bg-purple-100 text-purple-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      // Factures
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  },

  getStatusText(status: OrderStatus | InvoiceStatus): string {
    const texts: Record<string, string> = {
      draft: 'Brouillon',
      pending: 'En attente',
      approved: 'Approuvée',
      ordered: 'Commandée',
      partially_received: 'Partiellement reçue',
      received: 'Reçue',
      cancelled: 'Annulée',
      paid: 'Payée',
      overdue: 'En retard'
    }
    return texts[status] || status
  },

  // Exposer les fonctions utilitaires si besoin
  getCategoryLabel(category: CostType): string {
    return getCategoryLabel(category)
  }
}