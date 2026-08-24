"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/mysql/auth-context";
import {
  CreditCard,
  Zap,
  Shield,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Users,
  FolderOpen,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionData {
  planCode: string;
  planName: string;
  status: string;
  trialEndsAt: string | null;
  projectsUsed: number;
  projectsLimit: number | null;
  usersUsed: number;
  usersLimit: number | null;
  nextBillingDate: string | null;
  amount: number | null;
  currency: string;
  interval: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function statusConfig(status: string) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        icon: <CheckCircle size={14} />,
        cls: "bg-green-100 text-green-800",
      };
    case "trialing":
      return {
        label: "Trial",
        icon: <Clock size={14} />,
        cls: "bg-blue-100 text-blue-800",
      };
    case "past_due":
      return {
        label: "Past due",
        icon: <AlertTriangle size={14} />,
        cls: "bg-red-100 text-red-800",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: <XCircle size={14} />,
        cls: "bg-gray-100 text-gray-600",
      };
    default:
      return {
        label: "Free",
        icon: <Building2 size={14} />,
        cls: "bg-gray-100 text-gray-600",
      };
  }
}

function planIcon(code: string) {
  switch (code) {
    case "pro":
      return <Zap size={22} className="text-blue-600" />;
    case "enterprise":
      return <Shield size={22} className="text-purple-600" />;
    default:
      return <Building2 size={22} className="text-gray-500" />;
  }
}

function UsageMeter({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon: React.ReactNode;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const colorClass =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
      ? "bg-orange-400"
      : "bg-blue-500";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          {label}
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {used}
          <span className="font-normal text-gray-400">
            {" "}/ {limit ?? "∞"}
          </span>
        </span>
      </div>
      {limit ? (
        <>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${colorClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{pct}% used</p>
        </>
      ) : (
        <p className="text-xs text-gray-400 mt-1">Unlimited</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch company (subscription info) + projects count + users count in parallel
        const [companyRes, projectsRes, usersRes] = await Promise.all([
          fetch(`/api/company/${user.companyId}`, { credentials: "include" }),
          fetch("/api/projects?limit=1", { credentials: "include" }),
          fetch("/api/company/users", { credentials: "include" }),
        ]);

        const company = companyRes.ok ? await companyRes.json() : {};
        const projectsJson = projectsRes.ok ? await projectsRes.json() : {};
        const usersJson = usersRes.ok ? await usersRes.json() : [];

        const planCode = company.subscriptionPlanCode || "free";
        const planNames: Record<string, string> = {
          free: "Free",
          pro: "Pro",
          enterprise: "Enterprise",
        };

        // Limits from plan
        const limits: Record<string, { projects: number | null; users: number | null }> = {
          free: { projects: 2, users: 3 },
          pro: { projects: 10, users: 10 },
          enterprise: { projects: null, users: null },
        };

        const planLimits = limits[planCode] || limits.free;
        const status = company.subscriptionStatus || "free";

        setData({
          planCode,
          planName: planNames[planCode] || planCode,
          status,
          trialEndsAt: company.subscriptionTrialEndsAt || null,
          projectsUsed: projectsJson.total || projectsJson.projects?.length || 0,
          projectsLimit: status === "trialing" ? null : planLimits.projects,
          usersUsed: Array.isArray(usersJson) ? usersJson.length : (usersJson.length || 0),
          usersLimit: status === "trialing" ? null : planLimits.users,
          nextBillingDate: company.subscriptionCurrentPeriodEnd || null,
          amount: null,
          currency: company.currency || "usd",
          interval: company.subscriptionInterval || null,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Loading subscription...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || "Could not load subscription data."}
      </div>
    );
  }

  const sc = statusConfig(data.status);
  const isTrialing = data.status === "trialing";
  const isFree = data.status === "free";
  const isPro = data.planCode === "pro";
  const isEnterprise = data.planCode === "enterprise";
  const trialDays = isTrialing && data.trialEndsAt ? daysLeft(data.trialEndsAt) : 0;
  const trialPct = isTrialing && data.trialEndsAt
    ? Math.round(((7 - trialDays) / 7) * 100)
    : 0;

  return (
    <div className="max-w-3xl space-y-5 p-0 sm:p-0">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your plan, usage, and billing.
        </p>
      </div>

      {/* ── Current plan card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              {planIcon(data.planCode)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {data.planName} Plan
              </h2>
              <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.cls}`}>
                {sc.icon}
                {sc.label}
              </div>
            </div>
          </div>

          {/* Action button */}
          {(isFree || isTrialing) && !isEnterprise && (
            <Link
              href="/billing"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <TrendingUp size={15} />
              Upgrade plan
            </Link>
          )}
          {isPro && (
            <Link
              href="/billing?plan=enterprise"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              <Shield size={15} />
              Upgrade to Enterprise
            </Link>
          )}
        </div>

        {/* Billing details */}
        {data.nextBillingDate && (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <CreditCard size={14} className="text-gray-400" />
            Next billing:{" "}
            <span className="font-medium text-gray-800">
              {new Date(data.nextBillingDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* ── Trial countdown banner ─────────────────────────────────── */}
      {isTrialing && (
        <div
          className={`rounded-2xl border p-6 ${
            trialDays <= 2
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock
                size={16}
                className={trialDays <= 2 ? "text-red-600" : "text-blue-600"}
              />
              <span
                className={`text-sm font-semibold ${
                  trialDays <= 2 ? "text-red-800" : "text-blue-800"
                }`}
              >
                {trialDays === 0
                  ? "Trial ends today!"
                  : `${trialDays} day${trialDays !== 1 ? "s" : ""} left in trial`}
              </span>
            </div>
            {data.trialEndsAt && (
              <span className="text-xs text-gray-500">
                Ends{" "}
                {new Date(data.trialEndsAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          <div className="h-2 rounded-full bg-white/60 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                trialDays <= 2 ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${trialPct}%` }}
            />
          </div>

          <p
            className={`mt-3 text-sm ${
              trialDays <= 2 ? "text-red-700" : "text-blue-700"
            }`}
          >
            You currently have full Enterprise access. Subscribe before your
            trial ends to keep all features.
          </p>

          <Link
            href="/billing"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Subscribe now
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Usage meters ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Usage
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UsageMeter
            label="Projects"
            used={data.projectsUsed}
            limit={data.projectsLimit}
            icon={<FolderOpen size={15} className="text-gray-400" />}
          />
          <UsageMeter
            label="Team members"
            used={data.usersUsed}
            limit={data.usersLimit}
            icon={<Users size={15} className="text-gray-400" />}
          />
        </div>
        {isTrialing && (
          <p className="mt-2 text-xs text-gray-400">
            Limits are lifted during your trial — you have full Enterprise access.
          </p>
        )}
      </div>

      {/* ── What's included ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          What's included in your plan
        </h3>
        <ul className="space-y-2.5 text-sm text-gray-700">
          {(data.planCode === "enterprise" || isTrialing
            ? [
                "Unlimited projects & team members",
                "Full procurement workflow",
                "QA inspections & anomaly tracking",
                "Stock reservations & count sessions",
                "Advanced analytics & custom reports",
                "Priority support + dedicated manager",
              ]
            : data.planCode === "pro"
            ? [
                "Up to 10 projects & 10 team members",
                "Full procurement workflow",
                "QA inspections & anomaly tracking",
                "Stock reservations & count sessions",
                "Advanced analytics & reports",
                "Priority email support",
              ]
            : [
                "Up to 2 projects & 3 team members",
                "Inventory management",
                "Basic cost tracking",
                "Structural calculators",
                "Materials library",
              ]
          ).map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {(isFree || isTrialing) && (
          <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Want more projects, users, and advanced features?
            </p>
            <Link
              href="/pricing"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              View all plans
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* ── Quick links ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Billing & invoices", href: "/billing", icon: <CreditCard size={15} /> },
          { label: "All plans", href: "/pricing", icon: <TrendingUp size={15} /> },
          { label: "Settings", href: "/settings", icon: <Shield size={15} /> },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            <span className="text-gray-400">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
