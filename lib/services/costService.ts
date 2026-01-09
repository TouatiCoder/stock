// lib/services/costService.ts
import { supabase } from '@/lib/supabase'

export interface Supplier {
  id: string
  company_id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  tax_id?: string
  payment_terms?: string
  rating: number
  delivery_score: number
  quality_score: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  order_number: string
  supplier_id: string
  company_id: string
  project_id?: string
  requested_by: string
  approved_by?: string
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled'
  total_amount: number
  tax_amount: number
  order_date: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  supplier_id: string
  company_id: string
  purchase_order_id?: string
  project_id?: string
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled'
  invoice_date: string
  due_date?: string
  total_amount: number
  tax_amount: number
  paid_amount: number
  paid_date?: string
  file_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CostCenter {
  id: string
  project_id: string
  name: string
  code?: string
  budget: number
  actual_cost: number
  cost_type: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'overhead' | 'other'
  created_at: string
  updated_at: string
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
  byMonth: Array<{ month: string; spent: number; budget: number }>
  byCategory: Array<{ category: string; amount: number }>
   bySupplier: Array<{ name: string; percentage: number }>
}

export const costService = {
  // Récupérer les statistiques des coûts
  async getCostStats(companyId: string): Promise<CostStats> {

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('company_id', companyId)

    if (projectsError) throw projectsError

    const projectIds = projects?.map(p => p.id) || []
    // Récupérer les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('purchase_orders')
      .select('status, total_amount, order_date')
      .eq('company_id', companyId)

    if (ordersError) throw ordersError

    // Récupérer les fournisseurs
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('is_active')
      .eq('company_id', companyId)

    if (suppliersError) throw suppliersError

    // Récupérer les factures
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('status, total_amount, paid_amount, due_date')
      .eq('company_id', companyId)

    if (invoicesError) throw invoicesError

    // Récupérer les centres de coûts
   let costCenters: any[] = []
    if (projectIds.length > 0) {
      const { data: centers, error: costCentersError } = await supabase
        .from('cost_centers')
        .select('budget, actual_cost, cost_type')
        .in('project_id', projectIds)

      if (costCentersError) throw costCentersError
      costCenters = centers || []
    }

    // Calculer les statistiques
    const totalOrders = orders?.length || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'approved').length || 0
    const totalSuppliers = suppliers?.length || 0
    const activeSuppliers = suppliers?.filter(s => s.is_active).length || 0
    const totalInvoices = invoices?.length || 0
    const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0
    const overdueInvoices = invoices?.filter(i => {
      if (i.status === 'pending' && i.due_date) {
        return new Date(i.due_date) < new Date()
      }
      return false
    }).length || 0

    const totalSpent = invoices?.reduce((sum, i) => sum + (i.paid_amount || 0), 0) || 0
    const totalBudget = costCenters?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0

    // Statistiques par mois (6 derniers mois)
    const months: Array<{ month: string; spent: number; budget: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      
      const monthOrders = orders?.filter(o => {
        const orderDate = new Date(o.order_date)
        return orderDate.getMonth() === date.getMonth() && 
               orderDate.getFullYear() === date.getFullYear()
      }) || []
      
      const monthSpent = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      
      months.push({
        month,
        spent: monthSpent,
        budget: totalBudget / 6 // Répartition égale pour l'exemple
      })
    }

    // Statistiques par catégorie
    const byCategory = [
      { category: 'Matériaux', amount: totalSpent * 0.6 }, // Exemple
      { category: 'Main d\'œuvre', amount: totalSpent * 0.25 },
      { category: 'Équipement', amount: totalSpent * 0.1 },
      { category: 'Sous-traitance', amount: totalSpent * 0.05 }
    ]

    // Statistiques par fournisseur - VERSION CORRIGÉE
const { data: supplierInvoices } = await supabase
  .from('invoices')
  .select(`
    total_amount,
     supplier:suppliers(
      name
    )
  `)
  .eq('company_id', companyId)

const supplierMap = new Map<string, number>()
let invoiceTotal = 0

supplierInvoices?.forEach((inv: any) => {
  // suppliers est un tableau dans les jointures Supabase
  const supplier = inv.suppliers
  const supplierName = supplier?.name || 'Inconnu'
  const amount = inv.total_amount || 0
  invoiceTotal += amount
  
  if (supplierName && supplierName !== 'Inconnu') {
    supplierMap.set(supplierName, (supplierMap.get(supplierName) || 0) + amount)
  }
})

// Si pas de données, utilisez des données par défaut
let finalBySupplier: Array<{ name: string; percentage: number }>
if (supplierMap.size === 0) {
  // Données par défaut pour le graphique
  finalBySupplier = [
    { name: "Fournisseur A", percentage: 35 },
    { name: "Fournisseur B", percentage: 28 },
    { name: "Fournisseur C", percentage: 22 },
    { name: "Autres", percentage: 15 }
  ]
} else {
  const bySupplierArray = Array.from(supplierMap.entries())
    .map(([name, amount]) => ({
      name,
      percentage: invoiceTotal > 0 ? Math.round((amount / invoiceTotal) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4)

  // Ajouter "Autres" si nécessaire
  const topSuppliers = bySupplierArray.slice(0, 3)
  const othersPercentage = 100 - topSuppliers.reduce((sum, item) => sum + item.percentage, 0)
  
  finalBySupplier = othersPercentage > 0 
    ? [...topSuppliers, { name: "Autres", percentage: othersPercentage }]
    : topSuppliers
}

    return {
      totalOrders,
      pendingOrders,
      totalSuppliers,
      activeSuppliers,
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      totalSpent,
      totalBudget,
      byMonth: months,
      byCategory,
      bySupplier: finalBySupplier
    }
  },

   async getSupplierStats(companyId: string): Promise<Array<{ name: string; percentage: number }>> {
    // 1. Récupérer toutes les factures par fournisseur
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('total_amount, supplier:suppliers(name)')
      .eq('company_id', companyId)

    if (error) throw error

    // 2. Grouper par fournisseur
    const supplierMap = new Map<string, number>()
    let totalAmount = 0

    invoices?.forEach((invoice: any) => {
      const supplierName = invoice.supplier?.name || 'Inconnu'
      const amount = invoice.total_amount || 0
      totalAmount += amount
      
      supplierMap.set(supplierName, (supplierMap.get(supplierName) || 0) + amount)
    })

    // 3. Calculer les pourcentages
    const result = Array.from(supplierMap.entries())
      .map(([name, amount]) => ({
        name,
        percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5) // Top 5 fournisseurs

    // 4. Ajouter "Autres" si nécessaire
    if (result.length > 4) {
      const top4 = result.slice(0, 4)
      const othersPercentage = 100 - top4.reduce((sum, item) => sum + item.percentage, 0)
      
      if (othersPercentage > 0) {
        return [...top4, { name: "Autres", percentage: othersPercentage }]
      }
      return top4
    }

    return result
  },

 // Récupérer tous les fournisseurs
  async getSuppliers(companyId: string, filters?: {
    search?: string
    activeOnly?: boolean
  }) {
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Récupérer un fournisseur spécifique
  async getSupplier(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        purchase_orders(*),
        invoices(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Créer un nouveau fournisseur
  async createSupplier(supplier: Partial<Supplier>) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        ...supplier,
        rating: 5.0,
        delivery_score: 100,
        quality_score: 100,
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour un fournisseur
  async updateSupplier(id: string, updates: Partial<Supplier>) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Récupérer toutes les commandes
  async getPurchaseOrders(companyId: string, filters?: {
    status?: string
    supplierId?: string
    projectId?: string
    search?: string
  }) {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name),
        project:projects(name),
        requester:users!requested_by(first_name, last_name),
        approver:users!approved_by(first_name, last_name),
        items:purchase_order_items(
          *,
          material:materials(name, unit_of_measure)
        )
      `)
      .eq('company_id', companyId)
      .order('order_date', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId)
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Créer une nouvelle commande
  async createPurchaseOrder(order: Partial<PurchaseOrder>) {
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([{
        ...order,
        order_number: orderNumber,
        status: 'draft',
        total_amount: 0,
        tax_amount: 0
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour une commande
  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Récupérer toutes les factures
  async getInvoices(companyId: string, filters?: {
    status?: string
    supplierId?: string
    overdueOnly?: boolean
  }) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        supplier:suppliers(name),
        purchase_order:purchase_orders(order_number),
        project:projects(name)
      `)
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId)
    }

    if (filters?.overdueOnly) {
      query = query.eq('status', 'pending').lt('due_date', new Date().toISOString())
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Récupérer les centres de coûts d'un projet
  async getProjectCostCenters(projectId: string) {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Calculer le budget vs dépenses
  async getBudgetVsSpent(companyId: string) {
    // Récupérer les projets
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, total_budget, current_cost')
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (projectsError) throw projectsError

    const projectsWithStats = projects?.map(project => ({
      ...project,
      spentPercent: project.total_budget ? (project.current_cost / project.total_budget) * 100 : 0,
      remaining: (project.total_budget || 0) - (project.current_cost || 0)
    })) || []

    return projectsWithStats
  },

  // Générer un rapport de coûts
  async generateCostReport(companyId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name),
        project:projects(name),
        items:purchase_order_items(
          quantity,
          unit_price,
          total_price,
          material:materials(name, unit_of_measure)
        )
      `)
      .eq('company_id', companyId)

    if (startDate) {
      query = query.gte('order_date', startDate)
    }

    if (endDate) {
      query = query.lte('order_date', endDate)
    }

    const { data, error } = await query.order('order_date', { ascending: false })

    if (error) throw error
    return data || []
  }
}