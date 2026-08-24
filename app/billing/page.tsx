"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/mysql/auth-context";
import {
  CreditCard,
  Receipt,
  LayoutDashboard,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Building2,
  Zap,
  Shield,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Banknote,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "payment" | "invoices";
type Interval = "month" | "year";
type PlanKey = "pro" | "enterprise";

interface Plan {
  key: PlanKey;
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlight: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "open" | "void";
  description: string;
  pdfUrl?: string;
}

const PLANS: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    icon: <Zap size={18} />,
    monthlyPrice: 49,
    yearlyPrice: 39,
    highlight: true,
    features: [
      "10 projects & 10 users",
      "Full procurement workflow",
      "QA & stock management",
      "Advanced analytics",
      "Priority email support",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    icon: <Shield size={18} />,
    monthlyPrice: 149,
    yearlyPrice: 119,
    highlight: false,
    features: [
      "Unlimited projects & users",
      "All Pro features",
      "Custom roles & SSO",
      "Dedicated account manager",
      "SLA & uptime guarantee",
    ],
  },
];

const STATUS_CONFIG = {
  paid: { label: "Paid", cls: "bg-green-100 text-green-800", icon: <CheckCircle size={12} /> },
  open: { label: "Open", cls: "bg-yellow-100 text-yellow-800", icon: <Clock size={12} /> },
  void: { label: "Void", cls: "bg-gray-100 text-gray-600", icon: <AlertTriangle size={12} /> },
};

// ─── Checkout helper ─────────────────────────────────────────────────────────

async function startCheckout(planCode: PlanKey, interval: Interval) {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ plan_code: planCode, interval }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || "Checkout failed");
  if (json.checkout_url) {
    window.location.href = json.checkout_url;
    return;
  }
  throw new Error("No checkout URL returned");
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const defaultPlan = (searchParams.get("plan") as PlanKey) || null;
  const defaultInterval = (searchParams.get("interval") as Interval) || "month";

  const [tab, setTab] = useState<Tab>("overview");
  const [interval, setInterval] = useState<Interval>(defaultInterval);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(defaultPlan);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Company/subscription state
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    if (!user?.companyId) return;
    Promise.all([
      fetch(`/api/company/${user.companyId}`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : {}
      ),
      fetch("/api/company/subscription-payment-method", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : {}
      ),
    ]).then(([company, pmData]) => {
      setCompanyData(company);
      if (typeof pmData?.payment_method === "string") setPaymentMethod(pmData.payment_method);
      setPaymentLoading(false);
    });
  }, [user?.companyId]);

  const handleCheckout = async (planKey: PlanKey, iv: Interval) => {
    const key = `${planKey}-${iv}`;
    try {
      setCheckoutError(null);
      setCheckoutLoading(key);
      await startCheckout(planKey, iv);
    } catch (err: any) {
      setCheckoutError(err?.message || "Checkout failed. Please try again.");
      setCheckoutLoading(null);
    }
  };

  const handleSavePaymentMethod = async () => {
    try {
      setPaymentSaving(true);
      setPaymentMsg(null);
      const res = await fetch("/api/company/subscription-payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payment_method: paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      setPaymentMsg({ type: "ok", text: "Payment method saved successfully." });
    } catch (err: any) {
      setPaymentMsg({ type: "err", text: err?.message || "Failed to update payment method." });
    } finally {
      setPaymentSaving(false);
    }
  };

  const currentPlan = companyData?.subscriptionPlanCode || "free";
  const currentStatus = companyData?.subscriptionStatus || user?.subscriptionStatus || "free";

  // ── Tab nav ────────────────────────────────────────────────────────────────

  const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "overview", label: "Plans & Upgrade", icon: <LayoutDashboard size={15} /> },
    { key: "payment", label: "Payment method", icon: <CreditCard size={15} /> },
    { key: "invoices", label: "Invoices", icon: <Receipt size={15} /> },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your subscription plan and payment details.
          </p>
        </div>
        <Link
          href="/subscription"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          View subscription details
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Current plan status bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5">
        <div className="flex items-center gap-2">
          {currentPlan === "pro" ? (
            <Zap size={16} className="text-blue-600" />
          ) : currentPlan === "enterprise" ? (
            <Shield size={16} className="text-purple-600" />
          ) : (
            <Building2 size={16} className="text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-900 capitalize">
            {currentPlan} plan
          </span>
        </div>
        <span className="text-gray-200">|</span>
        <span
          className={`text-xs font-medium ${
            currentStatus === "active"
              ? "text-green-600"
              : currentStatus === "trialing"
              ? "text-blue-600"
              : currentStatus === "past_due"
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {currentStatus === "active"
            ? "Active"
            : currentStatus === "trialing"
            ? "Trial active"
            : currentStatus === "past_due"
            ? "Payment past due"
            : "No active subscription"}
        </span>
        {currentStatus === "past_due" && (
          <span className="ml-auto flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle size={13} />
            Update payment method to restore access
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview / Plans ──────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Interval toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Billing:</span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {(["month", "year"] as Interval[]).map((iv) => (
                <button
                  key={iv}
                  onClick={() => setInterval(iv)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    interval === iv
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {iv === "month" ? "Monthly" : "Yearly"}
                  {iv === "year" && (
                    <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                      −20%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2">
            {PLANS.map((plan) => {
              const price =
                interval === "year" ? plan.yearlyPrice : plan.monthlyPrice;
              const key = `${plan.key}-${interval}`;
              const isCurrent = currentPlan === plan.key;
              const isLoadingThis = checkoutLoading === key;

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.highlight
                      ? "border-blue-400 ring-2 ring-blue-100"
                      : "border-gray-200"
                  } ${isCurrent ? "bg-gray-50" : "bg-white"}`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-0.5 text-xs font-semibold text-white">
                      Recommended
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white flex items-center gap-1">
                      <CheckCircle size={10} /> Current plan
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        plan.highlight ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {plan.icon}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                  </div>

                  <div className="flex items-end gap-1 mb-5">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ${price}
                    </span>
                    <span className="mb-1 text-sm text-gray-400">/ mo</span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle size={14} className="mt-0.5 shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50 py-2.5 text-sm font-medium text-green-700">
                      <CheckCircle size={14} /> Active plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.key, interval)}
                      disabled={checkoutLoading !== null}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        plan.highlight
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-gray-300 text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          Upgrade to {plan.name}
                          <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {checkoutError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={15} />
              {checkoutError}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Secure payment via Stripe · Cancel anytime · No hidden fees
          </p>
        </div>
      )}

      {/* ── Tab: Payment method ────────────────────────────────────── */}
      {tab === "payment" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 max-w-lg">
          <h3 className="text-base font-semibold text-gray-900">
            Default payment method
          </h3>
          <p className="text-sm text-gray-500">
            Choose how your subscription renewals are processed.
          </p>

          {paymentLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    key: "stripe",
                    label: "Stripe",
                    icon: <CreditCard size={20} />,
                    desc: "Credit / Debit card",
                  },
                  {
                    key: "paypal",
                    label: "PayPal",
                    icon: <ExternalLink size={20} />,
                    desc: "PayPal account",
                  },
                  {
                    key: "bank_transfer",
                    label: "Bank transfer",
                    icon: <Banknote size={20} />,
                    desc: "Wire / SEPA",
                  },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPaymentMethod(opt.key)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm transition-all ${
                      paymentMethod === opt.key
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.icon}
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-gray-400">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleSavePaymentMethod}
                disabled={paymentSaving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {paymentSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Save payment method
              </button>

              {paymentMsg && (
                <p
                  className={`text-sm ${
                    paymentMsg.type === "ok" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {paymentMsg.text}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Invoices ──────────────────────────────────────────── */}
      {tab === "invoices" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Invoice history</h3>
              <span className="text-xs text-gray-400">
                Showing all invoices for this account
              </span>
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                <FileText size={24} className="text-gray-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700">No invoices yet</h4>
              <p className="mt-2 text-sm text-gray-500 max-w-xs">
                Invoices will appear here after your first subscription payment.
                They are available as PDF for download.
              </p>
              {(currentPlan === "free" ||
                currentStatus === "trialing" ||
                currentStatus === "free") && (
                <button
                  onClick={() => setTab("overview")}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <CreditCard size={14} />
                  Subscribe to get started
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700 flex items-start gap-3">
            <CreditCard size={16} className="mt-0.5 shrink-0" />
            <p>
              After subscribing via Stripe, your invoices are automatically
              generated and available here for download. You'll also receive
              them by email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
