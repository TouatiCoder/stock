import { db } from "@/lib/db";

// Define types for project data
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Company {
  id: string;
  name: string;
}

export interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client_name: string | null;
  start_date: Date | null;
  planned_end_date: Date | null;
  total_budget: number;
  current_cost: number;
  progress_percentage: number;
  city: string | null;
  project_type: string | null;
  site_manager: User | null;
  structural_engineer: User | null;
  company: Company | null;
  created_at: Date;
  updated_at: Date;
}

// Define proper types for the function parameters
interface CreateProjectData {
  name: string;
  description?: string | null;
  status?: string;
  clientName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalBudget?: number;
  companyId: string;
  siteManagerId?: string | null;
  structuralEngineerId?: string | null;
}

// جلب كل المشاريع لشركة معينة
export async function getProjects(companyId: string) {
  try {
    const projects = await db.project.findMany({
      where: { companyId },
      include: {
        siteManager: true,
        structuralEngineer: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

// جلب مشروع واحد بال(details)
export async function getProjectById(projectId: string) {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        siteManager: true,
        structuralEngineer: true,
        company: true
      }
    });
    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

// إنشاء
export async function createProject(data: CreateProjectData) {
  try {
    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        status: data.status || 'planning',
        clientName: data.clientName || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        totalBudget: data.totalBudget || 0,
        companyId: data.companyId,
        siteManagerId: data.siteManagerId || null,
        structuralEngineerId: data.structuralEngineerId || null,
        updatedAt: new Date(), // Added to satisfy TypeScript, will be overwritten by middleware
      }
    });
    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

// حساب الإحصائيات (مثال)
export async function getProjectStats(companyId: string) {
  const total = await db.project.count({ where: { companyId } });
  const active = await db.project.count({ where: { companyId, status: 'active' } });
  const completed = await db.project.count({ where: { companyId, status: 'completed' } });
  
  return { total, active, completed };
}

// Service object to match the expected interface
export const projectService = {
  getProjects: async (page: number, limit: number, searchTerm?: string, statusFilter?: string) => {
    // This function needs to be adapted to use MySQL instead of Prisma
    // Since the project is migrating to MySQL, we'll implement a temporary version
    // that returns the same format as expected
    try {
      const offset = (page - 1) * limit;
      
      // For now, we'll use the existing function and transform the data
      // In a full MySQL implementation, we'd query the database directly
      const allProjects = await getProjects(''); // We'll need to pass the company ID in a real implementation
      const filteredProjects = allProjects.filter(project => {
        const matchesSearch = !searchTerm || 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = !statusFilter || statusFilter === 'all' || project.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });
      
      const paginatedProjects = filteredProjects.slice(offset, offset + limit);
      
      // Transform to the expected format
      const transformedProjects: ProjectWithDetails[] = paginatedProjects.map(project => {
        // Calculate progress percentage based on budget and cost
        const totalBudgetNum = Number(project.totalBudget) || 0;
        const currentCostNum = Number(project.currentCost) || 0;
        const progressPercentage = totalBudgetNum > 0 
          ? (currentCostNum / totalBudgetNum) * 100 
          : 0;
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          client_name: project.clientName,
          start_date: project.startDate,
          planned_end_date: project.endDate,
          total_budget: totalBudgetNum,
          current_cost: currentCostNum,
          progress_percentage: progressPercentage,
          city: null, // This would come from a related table in the full implementation
          project_type: null, // This would come from the project record in the full implementation
          site_manager: project.siteManager,
          structural_engineer: project.structuralEngineer,
          company: project.companyId ? { id: project.companyId, name: '' } as Company : null, // Simplified for now
          created_at: project.createdAt,
          updated_at: project.updatedAt
        };
      });
      
      return {
        data: transformedProjects,
        pagination: {
          page,
          limit,
          total: filteredProjects.length,
          totalPages: Math.ceil(filteredProjects.length / limit)
        }
      };
    } catch (error) {
      console.error("Error in getProjects with pagination:", error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  },
  
  getProjectById,
  createProject,
  getProjectStats
};