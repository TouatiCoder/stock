// lib/services/calculationService.ts
// Utility functions for structural calculations

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
  // Récupérer tous les calculs d'un projet (à implémenter avec Prisma)
  async getCalculationsByProject(projectId: string) {
    console.warn('calculationService.getCalculationsByProject: Not implemented with Prisma yet');
    return [];
  },

  // Récupérer un calcul spécifique (à implémenter avec Prisma)
  async getCalculation(id: string) {
    console.warn('calculationService.getCalculation: Not implemented with Prisma yet');
    return null;
  },

  // Créer un nouveau calcul (à implémenter avec Prisma)
  async createCalculation(calculation: Partial<StructuralCalculation>) {
    console.warn('calculationService.createCalculation: Not implemented with Prisma yet');
    return null;
  },

  // Mettre à jour un calcul (à implémenter avec Prisma)
  async updateCalculation(id: string, updates: Partial<StructuralCalculation>) {
    console.warn('calculationService.updateCalculation: Not implemented with Prisma yet');
    return null;
  },

  // Supprimer un calcul (à implémenter avec Prisma)
  async deleteCalculation(id: string) {
    console.warn('calculationService.deleteCalculation: Not implemented with Prisma yet');
  },

  // Ajouter un élément de calcul (à implémenter avec Prisma)
  async addCalculationItem(item: Partial<CalculationItem>) {
    console.warn('calculationService.addCalculationItem: Not implemented with Prisma yet');
    return null;
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