// lib/services/calculationService.ts
import { supabase } from '@/lib/supabase'

export interface StructuralCalculation {
  id: string
  project_id: string
  calculation_type: 'concrete_volume' | 'steel_quantity' | 'formwork' | 'load_analysis' | 'other'
  reference: string
  version: number
  engineer_id: string
  status: 'draft' | 'in_review' | 'approved' | 'rejected'
  calculation_data: Record<string, any>
  total_concrete_volume?: number
  total_steel_weight?: number
  total_formwork_area?: number
  notes?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface CalculationItem {
  id: string
  calculation_id: string
  element_name: string
  element_type?: string
  quantity: number
  unit_of_measure?: string
  concrete_volume?: number
  steel_weight?: number
  formwork_area?: number
  unit_cost?: number
  total_cost?: number
  notes?: string
}

export const calculationService = {
  // Récupérer tous les calculs d'un projet
  async getCalculationsByProject(projectId: string) {
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

  // Récupérer un calcul spécifique
  async getCalculation(id: string) {
    const { data, error } = await supabase
      .from('structural_calculations')
      .select(`
        *,
        engineer:users!engineer_id(*),
        items:calculation_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Créer un nouveau calcul
  async createCalculation(calculation: Partial<StructuralCalculation>) {
    const { data, error } = await supabase
      .from('structural_calculations')
      .insert([{
        ...calculation,
        version: 1,
        status: 'draft'
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour un calcul
  async updateCalculation(id: string, updates: Partial<StructuralCalculation>) {
    const { data, error } = await supabase
      .from('structural_calculations')
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

  // Supprimer un calcul
  async deleteCalculation(id: string) {
    const { error } = await supabase
      .from('structural_calculations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Ajouter un élément de calcul
  async addCalculationItem(item: Partial<CalculationItem>) {
    const { data, error } = await supabase
      .from('calculation_items')
      .insert([item])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Calculer les charges ELU/ELS (exemple pour les charges permanentes/variables)
  calculateLoads(permanentLoad: number, variableLoad: number) {
    const ELU = (permanentLoad * 1.35) + (variableLoad * 1.5)
    const ELS = permanentLoad + variableLoad
    
    return {
      permanent: permanentLoad,
      variable: variableLoad,
      ELU: Math.round(ELU * 100) / 100, // Arrondi à 2 décimales
      ELS: Math.round(ELS * 100) / 100
    }
  },

  // Calculer le volume de béton
  calculateConcreteVolume(length: number, width: number, height: number): number {
    return length * width * height
  },

  // Calculer la quantité d'acier
  calculateSteelWeight(volume: number, density: number = 7850): number {
    return volume * density
  },

  // Calculer la surface de coffrage
  calculateFormworkArea(length: number, width: number, height: number): number {
    return 2 * (length * height + width * height)
  }
}