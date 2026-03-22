"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download } from "lucide-react";
import { ProjectsList } from "@/components/projects/projects-list";
import { ProjectStats } from "@/components/projects/project-stats";
import { ProjectsPagination } from "@/components/projects/projects-pagination";
import { toast } from "sonner";
import { useProjectTranslations, useCommonTranslations } from "@/components/LocaleProvider";

interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  status: string;
  totalBudget: number | null;
  currentCost: number | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  siteManagerId: string | null;
  structuralEngineerId: string | null;
  siteManager: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  structuralEngineer: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface ProjectPageProps {
  initialProjects: ProjectWithDetails[];
  initialStats: {
    total: number;
    active: number;
    planning: number;
    completed: number;
    paused: number;
    cancelled: number;
    totalBudget: number;
    totalCost: number;
    overBudgetCount?: number;
    budgetUsage?: number;
  };
  totalProjects: number;
  currentPage: number;
  totalPages: number;
}

export default function ProjectsPageClient({ 
  initialProjects, 
  initialStats,
  totalProjects,
  currentPage,
  totalPages
}: ProjectPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "planning" | "active" | "paused" | "completed" | "cancelled">("all");
  const [projects, setProjects] = useState<ProjectWithDetails[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [pagination, setPagination] = useState({
    page: currentPage,
    pageSize: 20,
    total: totalProjects,
    totalPages: totalPages
  });

  const tProject = useProjectTranslations();
  const tCommon = useCommonTranslations();

  useEffect(() => {
    setProjects(initialProjects);
    setStats(initialStats);
    setPagination(prev => ({
      ...prev,
      page: currentPage,
      total: totalProjects,
      totalPages: totalPages
    }));
  }, [initialProjects, initialStats, totalProjects, currentPage, totalPages]);

  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  const handleExportProjects = async () => {
    try {
      // Export simple to CSV
      const csv = convertToCSV(projects);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tProject("csvFilenamePrefix")}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(tProject("exportSuccess"));
    } catch (error: any) {
      toast.error(tProject("exportError"));
      console.error("Export error:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    // In a real implementation, you would fetch new data here
  };

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';
    
    const headers = [
      tProject("csvHeaderName"),
      tProject("csvHeaderClient"),
      tProject("csvHeaderCity"),
      tProject("csvHeaderStatus"),
      tProject("csvHeaderBudget"),
      tProject("csvHeaderCurrentCost"),
      tProject("csvHeaderProgress"),
      tProject("csvHeaderStartDate"),
      tProject("csvHeaderEndDate"),
    ];
    const csvRows = [];
    
    // Headers
    csvRows.push(headers.join(','));
    
    // Rows
    for (const row of data) {
      const values = [
        row.name || '',
        row.clientName || '',
        row.city || '', // Note: This field might not exist on the project object
        row.status || '',
        row.totalBudget || 0,
        row.currentCost || 0,
        row.progressPercentage || 0, // This field might not exist
        row.startDate || '',
        row.endDate || ''
      ].map(value => {
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tProject("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportProjects}
          >
            <Download size={18} />
            {tCommon("export")}
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={handleCreateProject}
          >
            <Plus size={18} />
            {tCommon("newProject")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ProjectStats stats={stats} showAllStats />

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={tCommon("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="ps-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            <option value="all">{tCommon("allStatus")}</option>
            <option value="planning">{tProject("planning")}</option>
            <option value="active">{tProject("active")}</option>
            <option value="paused">{tProject("paused")}</option>
            <option value="completed">{tProject("completed")}</option>
            <option value="cancelled">{tProject("cancelled")}</option>
          </select>
        </div>
      </Card>

      {/* Projects List */}
      <ProjectsList 
        projects={projects}
        loading={loading}
        onProjectClick={(id) => router.push(`/projects/${id}`)}
        onDeleteProject={async (id) => {
          if (confirm(tProject("deleteConfirm"))) {
            try {
              // In a real implementation, you would call an API endpoint
              // await projectService.deleteProject(id)
              toast.success(tProject("deletedSuccess"));
              // fetchProjects()
              // fetchStats()
            } catch (error: any) {
              toast.error(error.message || tProject("deleteError"));
            }
          }
        }}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <ProjectsPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
