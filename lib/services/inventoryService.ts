// lib/services/inventoryService.ts
import { supabase } from '@/lib/supabase'
import { Material, MaterialWithStock } from './materialService'

export interface InventoryStats {
  totalMaterials: number
  totalValue: number
  lowStockCount: number
  criticalStockCount: number
  outOfStockCount: number
  recentMovements: number
  categoriesCount: number
}

export interface StockMovement {
  id: string
  reference: string
  movement_type: 'in' | 'out' | 'transfer' | 'return' | 'adjustment' | 'consumption'
  material_id: string
  quantity: number
  unit_price?: number | null  // Ajoutez | null
  total_value?: number | null  // Ajoutez | null
  source_type?: 'supplier' | 'warehouse' | 'project' | 'adjustment' | null  // Ajoutez | null
  source_id?: string | null  // Ajoutez | null
  destination_type?: 'warehouse' | 'project' | 'supplier' | 'scrap' | null  // Ajoutez | null
  destination_id?: string | null  // Ajoutez | null
  project_id?: string | null  // Ajoutez | null
  user_id: string
  notes?: string | null  // Ajoutez | null
  movement_date: string
  created_at: string
}

export const inventoryService = {
  // Récupérer les statistiques de l'inventaire
  async getInventoryStats(companyId: string): Promise<InventoryStats> {
    // Récupérer tous les matériaux de l'entreprise
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('current_stock, min_stock_level, critical_threshold, total_value, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (materialsError) throw materialsError

    // Récupérer le nombre de catégories
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('material_categories')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if (categoriesError) throw categoriesError

    // Récupérer les mouvements récents (7 derniers jours)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: recentMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .gte('movement_date', weekAgo)

    if (movementsError) throw movementsError

    const activeMaterials = materials || []
    
    // Calculer les statistiques
    const stats = {
      totalMaterials: activeMaterials.length,
      totalValue: activeMaterials.reduce((sum, m) => sum + (m.total_value || 0), 0),
      lowStockCount: activeMaterials.filter(m => 
        m.current_stock <= m.min_stock_level && 
        m.current_stock > m.critical_threshold
      ).length,
      criticalStockCount: activeMaterials.filter(m => 
        m.current_stock <= m.critical_threshold && 
        m.current_stock > 0
      ).length,
      outOfStockCount: activeMaterials.filter(m => m.current_stock <= 0).length,
      recentMovements: recentMovements || 0,
      categoriesCount: categoriesCount || 0
    }

    return stats
  },

  // Récupérer tous les matériaux avec filtres
  async getAllMaterials(companyId: string, filters?: {
  search?: string
  categoryId?: string
  lowStock?: boolean
  criticalStock?: boolean
}) {
  // 1. Récupérer les matériaux de base
  let query = supabase
    .from('materials')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.categoryId && filters.categoryId !== 'all') {
    query = query.eq('category_id', filters.categoryId)
  }

  const { data: materials, error } = await query.order('name', { ascending: true })

  if (error) throw error

  // 2. Enrichir avec les relations si nécessaire
  if (materials && materials.length > 0) {
    // Récupérer les catégories
    const categoryIds = [...new Set(materials.map(m => m.category_id).filter(Boolean))]
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('material_categories')
        .select('id, name, color_code')
        .in('id', categoryIds)

      // Fusionner les données
      return materials.map(material => ({
        ...material,
        category: categories?.find(c => c.id === material.category_id) || null
      }))
    }
  }

  return materials || []
},

  // Récupérer les catégories de matériaux
async getCategories(companyId: string) {
  console.log('🔍 getCategories called with companyId:', companyId)
  
  try {
    // 1. Essayez de récupérer les catégories existantes
    console.log('📡 Envoi requête Supabase...')
    const { data, error, status, count } = await supabase
      .from('material_categories')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    console.log('📊 Réponse Supabase:', {
      status,
      count,
      hasData: !!data,
      dataLength: data?.length,
      error: error ? error.message : null
    })

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      
      // Si c'est une erreur de permission, essayez sans filtre
      if (error.code === '42501' || error.message?.includes('permission')) {
        console.log('🔄 Tentative sans filtre company_id...')
        const { data: allData } = await supabase
          .from('material_categories')
          .select('*')
          .order('name', { ascending: true })
        
        // Filtrez côté client
        const filtered = allData?.filter(cat => cat.company_id === companyId) || []
        console.log('✅ Catégories filtrées côté client:', filtered)
        return filtered
      }
      
      throw error
    }
    
    // 2. Retournez les données si elles existent
    if (data && data.length > 0) {
      console.log('✅ Catégories existantes retournées:', data)
      return data
    }
    
    // 3. Si aucune donnée mais count > 0, c'est un problème de cache
    if (count && count > 0) {
      console.warn('⚠️ Incohérence: count > 0 mais data vide. Problème de cache?')
      
      // Forcez un rechargement avec un timeout
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: retryData } = await supabase
        .from('material_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true })
      
      if (retryData && retryData.length > 0) {
        console.log('✅ Données après retry:', retryData)
        return retryData
      }
    }
    
    // 4. Si vraiment vide, créez UNE catégorie par défaut (pas toutes)
    console.log('📝 Aucune catégorie trouvée, création d\'une catégorie par défaut...')
    
    const defaultCategory = {
      name: 'Divers',
      company_id: companyId,
      color_code: '#CCCCCC',
      description: 'Catégorie par défaut'
    }
    
    const { data: newCategory, error: insertError } = await supabase
      .from('material_categories')
      .insert([defaultCategory])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erreur création catégorie:', insertError)
      
      // Si c'est une erreur de duplication, essayez de récupérer à nouveau
      if (insertError.code === '23505') {
        console.log('🔄 Catégorie existe déjà, récupération...')
        const { data: existing } = await supabase
          .from('material_categories')
          .select('*')
          .eq('company_id', companyId)
          .eq('name', 'Divers')
          .single()
        
        if (existing) {
          console.log('✅ Catégorie "Divers" récupérée:', existing)
          return [existing]
        }
      }
      
      throw insertError
    }
    
    console.log('✅ Catégorie "Divers" créée:', newCategory)
    return [newCategory]
    
  } catch (error: any) {
    console.error('💥 Erreur dans getCategories:', error)
    
    // En cas d'erreur, retournez des catégories temporaires
    console.log('🔄 Utilisation catégories temporaires...')
    return [
      { id: 'temp-1', name: 'Acier', color_code: '#FF6B6B' },
      { id: 'temp-2', name: 'Béton', color_code: '#4ECDC4' },
      { id: 'temp-3', name: 'Bois', color_code: '#45B7D1' },
      { id: 'temp-4', name: 'Divers', color_code: '#CCCCCC' }
    ]
  }
},

  // Récupérer les mouvements de stock récents
async getRecentStockMovements(companyId: string, limit: number = 10) {
  try {
    // 1. Récupérer les IDs des matériaux
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (materialsError) throw materialsError

    const materialIds = materials?.map(m => m.id) || []
    
    if (materialIds.length === 0) {
      return []
    }

    // 2. Requête SIMPLIFIÉE sans warehouses
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        material:materials(name, unit_of_measure),
        user:users(first_name, last_name),
        project:projects(name)
        // Pas de warehouses !
      `)
      .in('material_id', materialIds)
      .order('movement_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
    
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return []
  }
},
  // Récupérer les seuils critiques
  async getCriticalThresholds(companyId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        id,
        name,
        current_stock,
        min_stock_level,
        critical_threshold,
        unit_of_measure,
        category:material_categories(name)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .lte('current_stock', supabase.from('materials').select('critical_threshold'))
      .order('current_stock', { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  },

  // Créer un mouvement de stock
  async createStockMovement(movementData: Partial<StockMovement>) {
    // Générer une référence unique
    const reference = `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([{
        ...movementData,
        reference,
        movement_date: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour le stock d'un matériau
  async updateMaterialStock(materialId: string, quantity: number, movementType: 'in' | 'out' | 'adjustment') {
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('current_stock, unit_price')
      .eq('id', materialId)
      .single()

    if (fetchError) throw fetchError

    let newStock = material.current_stock
    if (movementType === 'in') {
      newStock += quantity
    } else if (movementType === 'out') {
      newStock -= quantity
    } else {
      newStock = quantity // Ajustement
    }

    if (newStock < 0) {
      throw new Error('Stock insuffisant')
    }

    const totalValue = newStock * (material.unit_price || 0)

    const { data, error } = await supabase
      .from('materials')
      .update({
        current_stock: newStock,
        total_value: totalValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Générer un rapport d'inventaire
  async generateInventoryReport(companyId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        category:material_categories(name),
        supplier:suppliers(name),
        stock_movements!inner(
          movement_type,
          quantity,
          movement_date
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('category_id', { ascending: true })

    if (error) throw error
    return data || []
  }
}