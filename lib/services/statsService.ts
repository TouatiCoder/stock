// lib/services/statsService.ts
import { supabase } from '@/lib/supabase'

export const statsService = {
  async getProjectStats() {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      const total = projects?.length || 0
      const active = projects?.filter(p => p.status === 'active').length || 0
      const planning = projects?.filter(p => p.status === 'planning').length || 0
      const completed = projects?.filter(p => p.status === 'completed').length || 0
      const paused = projects?.filter(p => p.status === 'paused').length || 0
      const cancelled = projects?.filter(p => p.status === 'cancelled').length || 0
      
      const totalBudget = projects?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0
      const totalCost = projects?.reduce((sum, p) => sum + (p.current_cost || 0), 0) || 0
      
      const overBudgetCount = projects?.filter(p => 
        (p.current_cost || 0) > (p.total_budget || 0) && (p.total_budget || 0) > 0
      ).length || 0
      
      // Calcul du pourcentage d'utilisation du budget
      const budgetUsage = projects?.reduce((sum, p) => {
        if ((p.total_budget || 0) > 0) {
          return sum + ((p.current_cost || 0) / (p.total_budget || 0) * 100)
        }
        return sum
      }, 0) / Math.max(projects?.length || 1, 1) || 0

      return {
        total,
        active,
        planning,
        completed,
        paused,
        cancelled,
        totalBudget,
        totalCost,
        overBudgetCount,
        budgetUsage: Math.round(budgetUsage)
      }
    } catch (error) {
      console.error('Error in getProjectStats:', error)
      throw error
    }
  }
}