// lib/services/materialService.ts
import { supabase } from '@/lib/supabase'

export interface Material {
  id: string
  name: string
  description?: string | null
  sku?: string | null 
  barcode?: string | null 
  category_id: string
  company_id: string
  unit_of_measure: 'kg' | 'ton' | 'm3' | 'm2' | 'm' | 'unit' | 'bag' | 'pallet' | 'other'
  unit_weight?: number | null 
  unit_price: number
  min_stock_level: number
  max_stock_level?: number | null
  critical_threshold: number
  current_stock: number
  reserved_stock: number
  total_value: number
  storage_location?: string | null 
  technical_specifications?: Record<string, any> | null 
  supplier_id?: string | null 
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProjectStock {
  id: string
  project_id: string
  material_id: string
  quantity: number
  allocated_quantity: number
  consumed_quantity: number
  min_level?: number
  last_updated: string
}

export interface MaterialWithStock extends Material {
  category?: { name: string }
  project_stock?: ProjectStock
  supplier?: { name: string }
}

export const materialService = {
  // Récupérer tous les matériaux d'un projet
  async getProjectMaterials(projectId: string) {
    const { data, error } = await supabase
      .from('project_stock')
      .select(`
        *,
        material:materials(
          *,
          category:material_categories(name),
          supplier:suppliers(name)
        )
      `)
      .eq('project_id', projectId)
      .order('last_updated', { ascending: false })

    if (error) throw error
    return data
  },

  // Récupérer les matériaux par catégorie
  async getMaterialsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        category:material_categories(name)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  // Récupérer tous les matériaux d'une entreprise
  async getCompanyMaterials(companyId: string, filters?: {
    categoryId?: string
    search?: string
    lowStock?: boolean
  }) {
    let query = supabase
      .from('materials')
      .select(`
        *,
        category:material_categories(name, color_code),
        supplier:suppliers(name)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.lowStock) {
      query = query.lte('current_stock', supabase.from('materials').select('min_stock_level'))
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error
    return data
  },

  // Récupérer un matériau spécifique
  async getMaterial(id: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        category:material_categories(*),
        supplier:suppliers(*),
        project_stock:project_stock(
          *,
          project:projects(name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Créer un nouveau matériau
  async createMaterial(material: Partial<Material>) {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        ...material,
        current_stock: 0,
        reserved_stock: 0,
        total_value: 0,
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour un matériau
  async updateMaterial(id: string, updates: Partial<Material>) {
    const { data, error } = await supabase
      .from('materials')
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

  // Mettre à jour le stock d'un matériau
  async updateStock(materialId: string, quantity: number) {
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('unit_price')
      .eq('id', materialId)
      .single()

    if (fetchError) throw fetchError

    const totalValue = (material.unit_price || 0) * quantity

    const { data, error } = await supabase
      .from('materials')
      .update({
        current_stock: quantity,
        total_value: totalValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Ajouter du stock à un projet
  async addToProjectStock(projectId: string, materialId: string, quantity: number) {
    const { data, error } = await supabase
      .from('project_stock')
      .upsert({
        project_id: projectId,
        material_id: materialId,
        quantity: quantity,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Consommer du matériau dans un projet
  async consumeMaterial(projectId: string, materialId: string, quantity: number) {
    const { data: stock, error: fetchError } = await supabase
      .from('project_stock')
      .select('quantity, consumed_quantity')
      .eq('project_id', projectId)
      .eq('material_id', materialId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

    const currentQuantity = stock?.quantity || 0
    const currentConsumed = stock?.consumed_quantity || 0
    
    if (currentQuantity < quantity) {
      throw new Error('Stock insuffisant')
    }

    const { data, error } = await supabase
      .from('project_stock')
      .upsert({
        project_id: projectId,
        material_id: materialId,
        quantity: currentQuantity - quantity,
        consumed_quantity: currentConsumed + quantity,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Récupérer les mouvements de stock d'un projet
  async getProjectStockMovements(projectId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        material:materials(name, unit_of_measure),
        user:users(first_name, last_name)
      `)
      .eq('project_id', projectId)
      .order('movement_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  // Vérifier le niveau de stock
  checkStockLevel(material: Material): 'normal' | 'low' | 'critical' {
    if (material.current_stock <= material.critical_threshold) {
      return 'critical'
    } else if (material.current_stock <= material.min_stock_level) {
      return 'low'
    }
    return 'normal'
  },

  // Calculer la valeur totale du stock
  calculateTotalValue(materials: Material[]): number {
    return materials.reduce((total, material) => {
      return total + (material.total_value || 0)
    }, 0)
  }
}