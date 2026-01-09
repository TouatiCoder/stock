// services/projectDetailService.ts
import { supabase } from '@/lib/supabase'

export const projectDetailService = {
  // Récupérer les calculs structurels d'un projet
  async getStructuralCalculations(projectId: string) {
    const { data, error } = await supabase
      .from('structural_calculations')
      .select(`
        *,
        engineer:users!engineer_id(first_name, last_name),
        items:calculation_items(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Récupérer les matériaux du projet
  async getProjectMaterials(projectId: string) {
    const { data, error } = await supabase
      .from('project_stock')
      .select(`
        *,
        material:materials(*, category:material_categories(name))
      `)
      .eq('project_id', projectId)

    if (error) throw error
    return data
  },

  // Récupérer les mouvements de stock du projet
  async getProjectStockMovements(projectId: string) {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        material:materials(name, unit_of_measure),
        user:users(first_name, last_name)
      `)
      .eq('project_id', projectId)
      .order('movement_date', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  },

  // Récupérer les anomalies du projet
  async getProjectAnomalies(projectId: string) {
    const { data, error } = await supabase
      .from('anomalies')
      .select(`
        *,
        reported_by:users!reported_by(first_name, last_name),
        assigned_to:users!assigned_to(first_name, last_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Récupérer les checklists du projet
  async getProjectChecklists(projectId: string) {
    const { data, error } = await supabase
      .from('checklists')
      .select(`
        *,
        phase:project_phases(name),
        completed_by:users(first_name, last_name),
        items:checklist_items(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Récupérer les documents techniques
  async getProjectDocuments(projectId: string) {
    const { data, error } = await supabase
      .from('technical_documents')
      .select(`
        *,
        uploaded_by:users(first_name, last_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Récupérer les commandes liées au projet
  async getProjectPurchaseOrders(projectId: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name),
        items:purchase_order_items(*, material:materials(name, unit_of_measure))
      `)
      .eq('project_id', projectId)
      .order('order_date', { ascending: false })

    if (error) throw error
    return data
  },

  // Ajouter un calcul structurel
  async addStructuralCalculation(projectId: string, calculationData: any) {
    const { data, error } = await supabase
      .from('structural_calculations')
      .insert([{
        ...calculationData,
        project_id: projectId,
        version: 1,
        status: 'draft'
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour le stock du projet
  async updateProjectStock(projectId: string, materialId: string, quantity: number) {
    const { data, error } = await supabase
      .from('project_stock')
      .upsert({
        project_id: projectId,
        material_id: materialId,
        quantity,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Créer un mouvement de stock
  async createStockMovement(movementData: any) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([{
        ...movementData,
        movement_date: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}