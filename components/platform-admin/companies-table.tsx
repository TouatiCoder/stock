"use client";

import { useMemo } from "react";
import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
import type { CompanyStatusFilter, PlatformCompanyListItemDto } from "@/lib/platform-admin/types";

type Props = {
  items: PlatformCompanyListItemDto[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  search: string;
  status: CompanyStatusFilter;
  actionLoadingId: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CompanyStatusFilter) => void;
  onPageChange: (next: number) => void;
  onSuspend: (companyId: string) => void;
  onActivate: (companyId: string) => void;
};

const paymentBadgeClass: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  none: "bg-gray-100 text-gray-700",
};

const statusBadgeClass: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
};

export function CompaniesTable(props: Props) {
  const t = usePlatformTranslations();
  const { locale } = useLocale();
  const {
    items,
    loading,
    error,
    page,
    totalPages,
    search,
    status,
    actionLoadingId,
    onSearchChange,
    onStatusChange,
    onPageChange,
    onSuspend,
    onActivate,
  } = props;

  const hasItems = useMemo(() => items.length > 0, [items]);

  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale);
  const formatMessage = (key: string, values: Record<string, string>) => {
    let message = t(key);
    Object.entries(values).forEach(([name, value]) => {
      message = message.replace(`{${name}}`, value);
    });
    return message;
  };
  const translateValue = (keyPrefix: string, value: string | null | undefined) => {
    if (!value) return t("shared.notAvailable");
    const key = `${keyPrefix}.${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t("companies.title")}</h2>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("companies.searchPlaceholder")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as CompanyStatusFilter)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">{t("companies.filters.all")}</option>
            <option value="active">{translateValue("status", "active")}</option>
            <option value="suspended">{translateValue("status", "suspended")}</option>
            <option value="trialing">{translateValue("status", "trialing")}</option>
          </select>
        </div>
      </div>

      {loading && <div className="p-6 text-sm text-gray-500">{t("companies.loading")}</div>}
      {error && <div className="p-6 text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("companies.headers.name")}</th>
                <th className="px-4 py-3">{t("companies.headers.status")}</th>
                <th className="px-4 py-3">{t("companies.headers.subscription")}</th>
                <th className="px-4 py-3">{t("companies.headers.trial")}</th>
                <th className="px-4 py-3">{t("companies.headers.lastPayment")}</th>
                <th className="px-4 py-3">{t("companies.headers.createdAt")}</th>
                <th className="px-4 py-3">{t("companies.headers.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {!hasItems && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    {t("companies.empty")}
                  </td>
                </tr>
              )}
              {items.map((company) => {
                const trialActive = !!company.trial_ends_at && new Date(company.trial_ends_at) > new Date();
                return (
                  <tr key={company.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{company.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass[company.status] || "bg-gray-100 text-gray-700"}`}>
                        {translateValue("status", company.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{translateValue("status", company.subscription_status)}</td>
                    <td className="px-4 py-3">
                      {trialActive ? (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {formatMessage("companies.trialUntil", { date: formatDate(company.trial_ends_at as string) })}
                        </span>
                      ) : (
                        <span className="text-gray-500">{t("shared.notAvailable")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${paymentBadgeClass[company.last_payment_status] || "bg-gray-100 text-gray-700"}`}>
                        {translateValue("paymentStatus", company.last_payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(company.created_at)}</td>
                    <td className="px-4 py-3">
                      {company.status === "active" ? (
                        <button
                          disabled={actionLoadingId === company.id}
                          className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                          onClick={() => onSuspend(company.id)}
                        >
                          {t("companies.actions.suspend")}
                        </button>
                      ) : (
                        <button
                          disabled={actionLoadingId === company.id}
                          className="rounded-md border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
                          onClick={() => onActivate(company.id)}
                        >
                          {t("companies.actions.activate")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
        >
          {t("companies.pagination.previous")}
        </button>
        <span>{formatMessage("companies.pagination.pageOf", { page: String(page), total: String(totalPages) })}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
        >
          {t("companies.pagination.next")}
        </button>
      </div>
    </div>
  );
}
