"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  projectTypes: string[];
  totalProjects: number;
  currentPage: number;
  totalPages: number;
  initialSearch?: string;
  initialStatus?: string;
  initialType?: string;
}

export default function ProjectsPageClient({
  initialProjects,
  initialStats,
  projectTypes,
  totalProjects,
  currentPage,
  totalPages,
  initialSearch = "",
  initialStatus = "all",
  initialType = "all",
}: ProjectPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterStatus, setFilterStatus] = useState<"all" | "planning" | "active" | "paused" | "completed" | "cancelled">(
    initialStatus as any
  );
  const [filterType, setFilterType] = useState(initialType);
  const isMounted = useRef(false);

  const tProject = useProjectTranslations();
  const tCommon = useCommonTranslations();

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case "R+2":
        return tProject("rPlus2Residential") || "R+2"
      case "Villa":
        return tProject("villa") || "Villa"
      case "Immeuble":
        return tProject("building") || "Immeuble"
      case "Commercial":
        return tProject("commercial") || "Commercial"
      case "Industrial":
        return tProject("industrial") || "Industrial"
      case "Other":
        return tProject("otherType") || "Autre"
      default:
        return type
    }
  }

  const availableProjectTypes = Array.from(
    new Set(projectTypes.map((type) => type?.trim()).filter((type): type is string => Boolean(type))),
  )

  const applyFilters = useCallback((search: string, status: string, type: string, page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (page > 1) params.set("page", String(page));
    router.replace(`/projects${params.toString() ? `?${params}` : ""}`);
  }, [router]);

  // Debounce search — skip on first mount
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      applyFilters(searchTerm, filterStatus, filterType, 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  const handleExportProjects = async () => {
    try {
      // Export simple to CSV
      const csv = `\uFEFF${convertToCSV(initialProjects)}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
    applyFilters(searchTerm, filterStatus, filterType, page);
  };

  const formatExportDate = (value: Date | string | null | undefined) => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    // Force Excel to keep the value as text so it stays left-aligned in the cell.
    return `="${day}/${month}/${year}"`;
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
        formatExportDate(row.startDate),
        formatExportDate(row.endDate)
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
      <ProjectStats stats={initialStats} showAllStats />

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={tProject("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="ps-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              const val = e.target.value as any;
              setFilterStatus(val);
              applyFilters(searchTerm, val, filterType, 1);
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

          <select
            value={filterType}
            onChange={(e) => {
              const val = e.target.value;
              setFilterType(val);
              applyFilters(searchTerm, filterStatus, val, 1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            <option value="all">{tProject("allTypes") || "Tous les types"}</option>
            {availableProjectTypes.map((type) => (
              <option key={type} value={type}>
                {getProjectTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Projects List */}
      <ProjectsList
        projects={initialProjects}
        loading={false}
        onProjectClick={(id) => router.push(`/projects/${id}`)}
        onDeleteProject={async (id) => {
          try {
            const response = await fetch(`/api/projects/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || tProject("deleteError"));
            }

            toast.success(tProject("deletedSuccess"));
            router.refresh();
          } catch (error: any) {
            toast.error(error.message || tProject("deleteError"));
            throw error;
          }
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <ProjectsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalProjects}
            pageSize={Math.ceil(totalProjects / totalPages)}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
