"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
import {
  activatePlatformCompany,
  getPlatformCompanyDetail,
  suspendPlatformCompany,
} from "@/lib/platform-admin/client";
import type { PlatformCompanyDetailDto } from "@/lib/platform-admin/types";

const LOCALE_MAP = { ar: "ar-MA", en: "en-US", fr: "fr-FR" } as const;

const statusBadgeClass: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
};

const paymentBadgeClass: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  none: "bg-gray-100 text-gray-700",
};

export default function PlatformCompanyDetailClient({ companyId }: { companyId: string }) {
  const t = usePlatformTranslations();
  const { locale } = useLocale();
  const resolvedLocale = LOCALE_MAP[locale];

  const [company, setCompany] = useState<PlatformCompanyDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlatformCompanyDetail(companyId);
      setCompany(data);
    } catch (err: any) {
      if (/not found/i.test(err?.message || "")) setNotFound(true);
      else setError(err?.message || t("companyDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(resolvedLocale) : t("shared.notAvailable");

  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString(resolvedLocale) : t("companyDetail.neverLoggedIn");

  const formatMoney = (value: number, currency: string) =>
    new Intl.NumberFormat(resolvedLocale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

  const translateValue = (prefix: string, value: string | null | undefined) => {
    if (!value) return t("shared.notAvailable");
    const key = `${prefix}.${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  const handleSuspend = async () => {
    const reason = window.prompt(t("dashboard.suspendReasonPrompt"));
    if (!reason || !reason.trim()) return;
    try {
      setActionPending(true);
      await suspendPlatformCompany(companyId, reason.trim());
      await load();
    } catch (err: any) {
      setError(err?.message || t("dashboard.suspendError"));
    } finally {
      setActionPending(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActionPending(true);
      await activatePlatformCompany(companyId);
      await load();
    } catch (err: any) {
      setError(err?.message || t("dashboard.activateError"));
    } finally {
      setActionPending(false);
    }
  };

  if (notFound) {
    return (
      <div className="space-y-4">
        <Link href="/platform" className="text-sm text-blue-700 hover:underline">
          ← {t("companyDetail.back")}
        </Link>
        <p className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          {t("companyDetail.notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/platform" className="inline-block text-sm text-blue-700 hover:underline">
        ← {t("companyDetail.back")}
      </Link>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading && !company ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" aria-label={t("companyDetail.loading")} />
      ) : company ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
              <p className="mt-1 font-mono text-xs text-gray-500">{company.id}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                  statusBadgeClass[company.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {translateValue("status", company.status)}
              </span>
            </div>
            <div className="flex gap-2">
              {company.status === "active" ? (
                <button
                  type="button"
                  onClick={handleSuspend}
                  disabled={actionPending}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("companies.actions.suspend")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={actionPending}
                  className="rounded-md border border-green-200 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  {t("companies.actions.activate")}
                </button>
              )}
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("companyDetail.identity")}
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label={t("companyDetail.email")} value={company.email || t("shared.notAvailable")} />
                <Row label={t("companyDetail.phone")} value={company.phone || t("shared.notAvailable")} />
                <Row label={t("companyDetail.city")} value={company.city || t("shared.notAvailable")} />
                <Row label={t("companyDetail.country")} value={company.country || t("shared.notAvailable")} />
                <Row label={t("companyDetail.ice")} value={company.ice || t("shared.notAvailable")} />
                <Row label={t("companyDetail.createdAt")} value={formatDate(company.created_at)} />
                {company.suspended_at && (
                  <Row label={t("companyDetail.suspendedAt")} value={formatDate(company.suspended_at)} />
                )}
                {company.suspended_reason && (
                  <Row label={t("companyDetail.suspendedReason")} value={company.suspended_reason} />
                )}
              </dl>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("companyDetail.counts")}
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Metric label={t("companyDetail.usersCount")} value={company.counts.users} />
                <Metric label={t("companyDetail.projectsCount")} value={company.counts.projects} />
                <Metric label={t("companyDetail.warehousesCount")} value={company.counts.warehouses} />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("companyDetail.subscription")}
              </h2>
              {company.subscription ? (
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label={t("companyDetail.plan")} value={company.subscription.plan_code} />
                  <Row
                    label={t("companies.headers.status")}
                    value={translateValue("subscription", company.subscription.status)}
                  />
                  <Row
                    label={t("companyDetail.monthlyAmount")}
                    value={formatMoney(company.subscription.monthly_amount, company.subscription.currency)}
                  />
                  <Row label={t("companyDetail.trialEndsAt")} value={formatDate(company.subscription.trial_ends_at)} />
                  <Row
                    label={t("companyDetail.currentPeriod")}
                    value={`${formatDate(company.subscription.current_period_start)} → ${formatDate(
                      company.subscription.current_period_end,
                    )}`}
                  />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-gray-500">{t("companyDetail.noSubscription")}</p>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 p-4 text-lg font-semibold text-gray-900">
              {t("companyDetail.users")}
            </h2>
            {company.users.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">{t("companyDetail.usersEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">{t("companyDetail.userName")}</th>
                      <th className="px-4 py-3">{t("companyDetail.userEmail")}</th>
                      <th className="px-4 py-3">{t("companyDetail.userRole")}</th>
                      <th className="px-4 py-3">{t("companies.headers.status")}</th>
                      <th className="px-4 py-3">{t("companyDetail.userLastLogin")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {company.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-gray-600">{user.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.is_active ? t("companyDetail.userActive") : t("companyDetail.userInactive")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(user.last_login_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 p-4 text-lg font-semibold text-gray-900">
              {t("companyDetail.payments")}
            </h2>
            {company.payments.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">{t("companyDetail.paymentsEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">{t("companyDetail.paymentDate")}</th>
                      <th className="px-4 py-3">{t("companyDetail.paymentAmount")}</th>
                      <th className="px-4 py-3">{t("companyDetail.paymentStatus")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {company.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(payment.paid_at || payment.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatMoney(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              paymentBadgeClass[payment.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {translateValue("payment", payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}
