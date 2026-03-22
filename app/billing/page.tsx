"use client";

import { useState } from "react";

async function startCheckout(interval: "month" | "year") {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      plan_code: "pro",
      interval,
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Checkout failed");
  }

  if (json.checkout_url) {
    window.location.href = json.checkout_url;
    return;
  }

  throw new Error("Checkout URL was not returned");
}

export default function BillingPage() {
  const [loading, setLoading] = useState<"month" | "year" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (interval: "month" | "year") => {
    try {
      setLoading(interval);
      setError(null);
      await startCheckout(interval);
    } catch (err: any) {
      setError(err?.message || "Unable to start checkout");
      setLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Billing Required</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your company needs an active subscription to continue using the platform.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleCheckout("month")}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === "month" ? "Redirecting..." : "Pay Monthly"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleCheckout("year")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === "year" ? "Redirecting..." : "Pay Yearly"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}