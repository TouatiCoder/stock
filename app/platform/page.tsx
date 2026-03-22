"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricsCards } from "@/components/platform-admin/metrics-cards";
import { CompaniesTable } from "@/components/platform-admin/companies-table";
import {
  activatePlatformCompany,
  getPlatformCompanies,
  getPlatformDashboard,
  suspendPlatformCompany,
} from "@/lib/platform-admin/client";
import type { CompanyStatusFilter, PlatformCompaniesListDto, PlatformDashboardDto } from "@/lib/platform-admin/types";

export default function PlatformDashboardPage() {
  const [dashboard, setDashboard] = useState<PlatformDashboardDto | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [companiesData, setCompaniesData] = useState<PlatformCompaniesListDto | null>(null);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CompanyStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        setDashboardError(null);
        const data = await getPlatformDashboard();
        setDashboard(data);
      } catch (error: any) {
        setDashboardError(error.message || "Failed to load platform dashboard");
      } finally {
        setDashboardLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setCompaniesLoading(true);
        setCompaniesError(null);
        const data = await getPlatformCompanies({ page, page_size: 20, search, status });
        setCompaniesData(data);
      } catch (error: any) {
        setCompaniesError(error.message || "Failed to load companies");
      } finally {
        setCompaniesLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, status]);

  const metricItems = useMemo(
    () => [
      { label: "Total companies", value: dashboardLoading ? "..." : dashboard?.total_companies ?? "N/A" },
      { label: "Active", value: dashboardLoading ? "..." : dashboard?.active_companies ?? "N/A" },
      { label: "Suspended", value: dashboardLoading ? "..." : dashboard?.suspended_companies ?? "N/A" },
      { label: "On trial", value: dashboardLoading ? "..." : dashboard?.companies_on_trial ?? "N/A" },
      {
        label: "Revenue (MRR est.)",
        value: dashboardLoading ? "..." : dashboard ? `${dashboard.monthly_revenue_estimate.toLocaleString()} MAD` : "N/A",
      },
    ],
    [dashboard, dashboardLoading],
  );

  const handleSuspend = async (companyId: string) => {
    const reason = window.prompt("Suspension reason");
    if (!reason || !reason.trim()) return;
    try {
      setActionLoadingId(companyId);
      await suspendPlatformCompany(companyId, reason.trim());
      const [updatedDashboard, updatedCompanies] = await Promise.all([
        getPlatformDashboard(),
        getPlatformCompanies({ page, page_size: 20, search, status }),
      ]);
      setDashboard(updatedDashboard);
      setCompaniesData(updatedCompanies);
    } catch (error: any) {
      window.alert(error.message || "Failed to suspend company");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivate = async (companyId: string) => {
    try {
      setActionLoadingId(companyId);
      await activatePlatformCompany(companyId);
      const [updatedDashboard, updatedCompanies] = await Promise.all([
        getPlatformDashboard(),
        getPlatformCompanies({ page, page_size: 20, search, status }),
      ]);
      setDashboard(updatedDashboard);
      setCompaniesData(updatedCompanies);
    } catch (error: any) {
      window.alert(error.message || "Failed to activate company");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {dashboardError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{dashboardError}</div>}
      <MetricsCards items={metricItems} />
      <CompaniesTable
        items={companiesData?.items || []}
        loading={companiesLoading}
        error={companiesError}
        page={companiesData?.page || page}
        totalPages={companiesData?.total_pages || 1}
        search={search}
        status={status}
        actionLoadingId={actionLoadingId}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        onStatusChange={(value) => {
          setPage(1);
          setStatus(value);
        }}
        onPageChange={setPage}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
      />
    </div>
  );
}

