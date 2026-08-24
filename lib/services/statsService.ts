// lib/services/statsService.ts
import { getDb } from '@/lib/mysql/connection';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  totalBudget?: number | string;
  currentCost?: number | string;
  is_active?: boolean;
  [key: string]: any;
}

export const statsService = {
  async getProjectStats() {
    try {
      const db = getDb();
      
      // Query all projects from MySQL database
      const result = await db.query(
        'SELECT * FROM projects WHERE is_active = 1 OR is_active IS NULL',
        []
      );

      const projects: Project[] = result.rows;

      const total = projects?.length || 0;
      const active = projects?.filter((p: Project) => p.status === 'active').length || 0;
      const planning = projects?.filter((p: Project) => p.status === 'planning').length || 0;
      const completed = projects?.filter((p: Project) => p.status === 'completed').length || 0;
      const paused = projects?.filter((p: Project) => p.status === 'paused').length || 0;
      const cancelled = projects?.filter((p: Project) => p.status === 'cancelled').length || 0;
      
      const totalBudget = projects?.reduce((sum: number, p: Project) => sum + (Number(p.totalBudget) || 0), 0) || 0;
      const totalCost = projects?.reduce((sum: number, p: Project) => sum + (Number(p.currentCost) || 0), 0) || 0;
      
      const overBudgetCount = projects?.filter((p: Project) => 
        (Number(p.currentCost) || 0) > (Number(p.totalBudget) || 0) && (Number(p.totalBudget) || 0) > 0
      ).length || 0;
      
      // Calcul du pourcentage d'utilisation du budget
      const budgetUsage = projects?.reduce((sum: number, p: Project) => {
        if ((Number(p.totalBudget) || 0) > 0) {
          return sum + ((Number(p.currentCost) || 0) / (Number(p.totalBudget) || 0) * 100);
        }
        return sum;
      }, 0) / Math.max(projects?.length || 1, 1) || 0;

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
      };
    } catch (error) {
      console.error('Error in getProjectStats:', error);
      throw error;
    }
  }
};