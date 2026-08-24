"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  X,
  Building2,
  Zap,
  Shield,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { usePricingTranslations, useLocale } from "@/components/LocaleProvider";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const MONTHLY_PRICES = { free: 0, pro: 49, enterprise: 149 };
const YEARLY_PRICES = { free: 0, pro: 39, enterprise: 119 };

type PlanKey = "free" | "pro" | "enterprise";

// ─── Component ─────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = usePricingTranslations();
  const { dir } = useLocale();

  const price = (key: PlanKey) =>
    yearly ? YEARLY_PRICES[key] : MONTHLY_PRICES[key];

  const savings = (key: PlanKey) =>
    Math.round(((MONTHLY_PRICES[key] - YEARLY_PRICES[key]) / MONTHLY_PRICES[key]) * 100);

  const PLANS = [
    {
      key: "free" as PlanKey,
      name: t("planFreeName"),
      icon: <Building2 size={20} />,
      tagline: t("planFreeTagline"),
      highlight: false,
      cta: t("planFreeCta"),
      ctaHref: () => "/signup",
      features: [
        t("featureFree1"), t("featureFree2"), t("featureFree3"),
        t("featureFree4"), t("featureFree5"), t("featureFree6"),
      ],
      limits: { projects: "2", users: "3", storage: "1 GB" },
    },
    {
      key: "pro" as PlanKey,
      name: t("planProName"),
      icon: <Zap size={20} />,
      tagline: t("planProTagline"),
      highlight: true,
      badge: t("mostPopular"),
      cta: t("planProCta"),
      ctaHref: (y: boolean) => `/billing?plan=pro&interval=${y ? "year" : "month"}`,
      features: [
        t("featurePro1"), t("featurePro2"), t("featurePro3"),
        t("featurePro4"), t("featurePro5"), t("featurePro6"), t("featurePro7"),
      ],
      limits: { projects: "10", users: "10", storage: "25 GB" },
    },
    {
      key: "enterprise" as PlanKey,
      name: t("planEnterpriseName"),
      icon: <Shield size={20} />,
      tagline: t("planEnterpriseTagline"),
      highlight: false,
      cta: t("planEnterpriseCta"),
      ctaHref: (y: boolean) => `/billing?plan=enterprise&interval=${y ? "year" : "month"}`,
      features: [
        t("featureEnterprise1"), t("featureEnterprise2"), t("featureEnterprise3"),
        t("featureEnterprise4"), t("featureEnterprise5"), t("featureEnterprise6"), t("featureEnterprise7"),
      ],
      limits: { projects: t("unlimited"), users: t("unlimited"), storage: t("unlimited") },
    },
  ];

  const FEATURE_GROUPS = [
    {
      group: t("groupCore"),
      rows: [
        { label: t("rowInventory"), free: true, pro: true, enterprise: true },
        { label: t("rowCalculators"), free: true, pro: true, enterprise: true },
        { label: t("rowCostTracking"), free: true, pro: true, enterprise: true },
        { label: t("rowWarehouse"), free: true, pro: true, enterprise: true },
        { label: t("rowMaterials"), free: true, pro: true, enterprise: true },
      ],
    },
    {
      group: t("groupProcurement"),
      rows: [
        { label: t("rowPurchaseRequests"), free: false, pro: true, enterprise: true },
        { label: t("rowApprovals"), free: false, pro: true, enterprise: true },
        { label: t("rowGoodsReceipts"), free: false, pro: true, enterprise: true },
        { label: t("rowInvoices"), free: false, pro: true, enterprise: true },
      ],
    },
    {
      group: t("groupQualityStock"),
      rows: [
        { label: t("rowQaTemplates"), free: false, pro: true, enterprise: true },
        { label: t("rowInspections"), free: false, pro: true, enterprise: true },
        { label: t("rowStockSessions"), free: false, pro: true, enterprise: true },
        { label: t("rowReservations"), free: false, pro: true, enterprise: true },
        { label: t("rowAlerts"), free: false, pro: true, enterprise: true },
      ],
    },
    {
      group: t("groupAnalytics"),
      rows: [
        { label: t("rowDashboard"), free: true, pro: true, enterprise: true },
        { label: t("rowAnalytics"), free: false, pro: true, enterprise: true },
        { label: t("rowCustomReports"), free: false, pro: true, enterprise: true },
        { label: t("rowExport"), free: false, pro: true, enterprise: true },
      ],
    },
    {
      group: t("groupTeamSecurity"),
      rows: [
        { label: t("rowRoles"), free: t("roleBasic"), pro: t("roleStandard"), enterprise: t("roleCustom") },
        { label: t("rowAuditLogs"), free: false, pro: true, enterprise: true },
        { label: t("rowSso"), free: false, pro: false, enterprise: true },
        { label: t("rowSupport"), free: false, pro: t("supportEmail"), enterprise: t("supportDedicated") },
      ],
    },
  ];

  const FAQ = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir={dir}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <Building2 size={18} className="text-blue-600" />
            BuildStock Pro
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              {t("signIn")}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {t("createFreeAccount")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <header className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <span className="inline-block rounded-full bg-blue-50 px-4 py-1 text-xs font-medium text-blue-700 mb-4">
          {t("simplePricing")}
        </span>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          {t("rightPlanTitle")}
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          {t("rightPlanSubtitle")}
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              !yearly
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              yearly
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("yearly")}
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              {t("savePercent")}
            </span>
          </button>
        </div>
      </header>

      {/* ── Plan cards ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-200"
                  : "border-gray-200 bg-white text-gray-900"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-400 px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  plan.highlight ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <span className={plan.highlight ? "text-white" : "text-gray-600"}>
                  {plan.icon}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold">{plan.name}</h2>
              <p
                className={`mt-1 text-sm ${
                  plan.highlight ? "text-blue-200" : "text-gray-500"
                }`}
              >
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-extrabold">
                  ${price(plan.key)}
                </span>
                {price(plan.key) > 0 && (
                  <span
                    className={`mb-1 text-sm ${
                      plan.highlight ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {t("perMonth")}
                  </span>
                )}
              </div>
              {yearly && price(plan.key) > 0 && (
                <p
                  className={`text-xs mt-1 ${
                    plan.highlight ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {t("billedYearly").replace("{percent}", String(savings(plan.key)))}
                </p>
              )}

              <Link
                href={plan.ctaHref(yearly)}
                className={`mt-6 flex items-center justify-center gap-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-white text-blue-700 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta}
                <ChevronRight size={14} />
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={15}
                      className={`mt-0.5 shrink-0 ${
                        plan.highlight ? "text-blue-200" : "text-green-500"
                      }`}
                    />
                    <span className={plan.highlight ? "text-blue-100" : "text-gray-700"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-8 rounded-xl p-4 text-xs ${
                  plan.highlight
                    ? "bg-blue-500/40"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <p className={plan.highlight ? "text-blue-200 font-medium" : "text-gray-500 font-medium"}>
                  {t("limits")}
                </p>
                <ul className="mt-2 space-y-1">
                  <li className={plan.highlight ? "text-blue-100" : "text-gray-600"}>
                    {t("projects")}: {plan.limits.projects}
                  </li>
                  <li className={plan.highlight ? "text-blue-100" : "text-gray-600"}>
                    {t("users")}: {plan.limits.users}
                  </li>
                  <li className={plan.highlight ? "text-blue-100" : "text-gray-600"}>
                    {t("storage")}: {plan.limits.storage}
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature comparison table ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          {t("featureComparison")}
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 -mx-2 sm:mx-0">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left font-medium text-gray-500 w-1/2">
                  {t("feature")}
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.key}
                    className={`px-4 py-4 text-center font-semibold w-1/6 ${
                      p.highlight ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_GROUPS.map((group, gi) => (
                <>
                  <tr key={`group-${gi}`} className="bg-gray-50/60">
                    <td
                      colSpan={4}
                      className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.rows.map((row, ri) => (
                    <tr
                      key={`${gi}-${ri}`}
                      className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-gray-700">{row.label}</td>
                      {(["free", "pro", "enterprise"] as const).map((key) => {
                        const val = row[key];
                        return (
                          <td key={key} className="px-4 py-3 text-center">
                            {val === true ? (
                              <Check size={16} className="mx-auto text-green-500" />
                            ) : val === false ? (
                              <X size={16} className="mx-auto text-gray-300" />
                            ) : (
                              <span className="text-xs text-gray-600 font-medium">
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          {t("faqTitle")}
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={15} className="text-gray-400 shrink-0" />
                  {item.q}
                </span>
                <ChevronRight
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform ${
                    openFaq === i ? "rotate-90" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-gray-600">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            {t("ctaTitle")}
          </h2>
          <p className="mt-3 text-blue-200">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {t("createFreeAccount")}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-blue-400 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} BuildStock Pro · {t("allRightsReserved")}
      </footer>
    </div>
  );
}
