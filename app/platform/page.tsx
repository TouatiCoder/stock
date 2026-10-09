"use client";

import { useEffect, useState } from "react";
import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
import { EnhancedPlatformMetrics } from "@/components/platform-admin/enhanced-metrics";
import { CompaniesTable } from "@/components/platform-admin/companies-table";
import { PlatformGrowthChart } from "@/components/platform-admin/growth-chart";
import {
  activatePlatformCompany,
  getPlatformCompanies,
  getPlatformDashboard,
  suspendPlatformCompany,
} from "@/lib/platform-admin/client";
import type { CompanyStatusFilter, PlatformCompaniesListDto, PlatformDashboardDto } from "@/lib/platform-admin/types";

export default function PlatformDashboardPage() {
  const t = usePlatformTranslations();
  const { locale } = useLocale();
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
        setDashboardError(error.message || t("dashboard.loadError"));
      } finally {
        setDashboardLoading(false);
      }
    };
    loadDashboard();
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setCompaniesLoading(true);
        setCompaniesError(null);
        const data = await getPlatformCompanies({ page, page_size: 20, search, status });
        setCompaniesData(data);
      } catch (error: any) {
        setCompaniesError(error.message || t("dashboard.loadCompaniesError"));
      } finally {
        setCompaniesLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, status, t]);

  const handleSuspend = async (companyId: string) => {
    const reason = window.prompt(t("dashboard.suspendReasonPrompt"));
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
      window.alert(error.message || t("dashboard.suspendError"));
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
      window.alert(error.message || t("dashboard.activateError"));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {dashboardError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{dashboardError}</div>}

      {dashboard && (
        <EnhancedPlatformMetrics
          totalCompanies={dashboard.total_companies}
          activeCompanies={dashboard.active_companies}
          suspendedCompanies={dashboard.suspended_companies}
          trialCompanies={dashboard.companies_on_trial}
          mrr={dashboard.monthly_revenue_estimate}
          locale={locale}
        />
      )}

      <PlatformGrowthChart />

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
