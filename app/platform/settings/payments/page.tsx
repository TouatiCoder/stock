"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getPaymentProviders,
  testPaypalConnection,
  updatePaymentProvider,
} from "@/lib/platform-admin/client";
import type { PaymentProviderDto, ProviderMode } from "@/lib/payment-providers/types";

type ProviderFormState = {
  is_enabled: boolean;
  mode: ProviderMode;
  config: Record<string, string>;
};

const stripeKeys = [
  "test_secret_key",
  "live_secret_key",
  "test_webhook_secret",
  "live_webhook_secret",
  "test_publishable_key",
  "live_publishable_key",
];

const paypalKeys = [
  "test_client_id",
  "test_client_secret",
  "live_client_id",
  "live_client_secret",
  "test_webhook_id",
  "live_webhook_id",
];

function buildInitial(provider: PaymentProviderDto): ProviderFormState {
  const cfg: Record<string, string> = {};
  Object.keys(provider.config).forEach((k) => {
    cfg[k] = "";
  });
  return {
    is_enabled: provider.is_enabled,
    mode: provider.mode,
    config: cfg,
  };
}

export default function PlatformPaymentProvidersPage() {
  const [providers, setProviders] = useState<Record<string, PaymentProviderDto>>({});
  const [forms, setForms] = useState<Record<string, ProviderFormState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [paypalTestResult, setPaypalTestResult] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPaymentProviders();
        const byCode: Record<string, PaymentProviderDto> = {};
        const formState: Record<string, ProviderFormState> = {};
        response.items.forEach((p) => {
          byCode[p.provider_code] = p;
          formState[p.provider_code] = buildInitial(p);
        });
        setProviders(byCode);
        setForms(formState);
      } catch (err: any) {
        setError(err.message || "Failed to load providers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stripe = providers.stripe;
  const paypal = providers.paypal;

  const handleSave = async (providerCode: "stripe" | "paypal") => {
    try {
      setSavingProvider(providerCode);
      const form = forms[providerCode];
      const updated = await updatePaymentProvider({
        provider: providerCode,
        is_enabled: form.is_enabled,
        mode: form.mode,
        config: form.config,
      });
      setProviders((prev) => ({ ...prev, [providerCode]: updated }));
      setForms((prev) => ({ ...prev, [providerCode]: buildInitial(updated) }));
    } catch (err: any) {
      window.alert(err.message || "Save failed");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestPaypal = async () => {
    try {
      setPaypalTestResult("Testing...");
      const result = await testPaypalConnection();
      setPaypalTestResult(`Connected (${result.mode})`);
    } catch (err: any) {
      setPaypalTestResult(`Failed: ${err.message || "unknown error"}`);
    }
  };

  const disableAllWarning = useMemo(() => {
    const stripeEnabled = forms.stripe?.is_enabled ?? stripe?.is_enabled;
    const paypalEnabled = forms.paypal?.is_enabled ?? paypal?.is_enabled;
    return !stripeEnabled && !paypalEnabled;
  }, [forms, stripe, paypal]);

  if (loading) return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading payment providers...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Payment Providers</h2>
        <p className="text-sm text-gray-600">Configure Stripe and PayPal credentials securely (encrypted at rest).</p>
      </div>

      {disableAllWarning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          At least one provider must be enabled.
        </div>
      )}

      {stripe && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Stripe</h3>
            <button
              onClick={() =>
                setForms((prev) => ({
                  ...prev,
                  stripe: { ...prev.stripe, is_enabled: !prev.stripe.is_enabled },
                }))
              }
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                forms.stripe?.is_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {forms.stripe?.is_enabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Mode</label>
            <select
              value={forms.stripe?.mode || "test"}
              onChange={(e) =>
                setForms((prev) => ({
                  ...prev,
                  stripe: { ...prev.stripe, mode: e.target.value as ProviderMode },
                }))
              }
              className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {stripeKeys.map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-gray-600">{key}</label>
                <input
                  value={forms.stripe?.config[key] || ""}
                  onChange={(e) =>
                    setForms((prev) => ({
                      ...prev,
                      stripe: {
                        ...prev.stripe,
                        config: { ...prev.stripe.config, [key]: e.target.value },
                      },
                    }))
                  }
                  placeholder={stripe.config[key] || "Not configured"}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500">Current: {stripe.config[key] || "-"}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={() => handleSave("stripe")}
              disabled={savingProvider === "stripe"}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingProvider === "stripe" ? "Saving..." : "Save Stripe Config"}
            </button>
          </div>
        </section>
      )}

      {paypal && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">PayPal</h3>
            <button
              onClick={() =>
                setForms((prev) => ({
                  ...prev,
                  paypal: { ...prev.paypal, is_enabled: !prev.paypal.is_enabled },
                }))
              }
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                forms.paypal?.is_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {forms.paypal?.is_enabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Mode</label>
            <select
              value={forms.paypal?.mode || "test"}
              onChange={(e) =>
                setForms((prev) => ({
                  ...prev,
                  paypal: { ...prev.paypal, mode: e.target.value as ProviderMode },
                }))
              }
              className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {paypalKeys.map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-gray-600">{key}</label>
                <input
                  value={forms.paypal?.config[key] || ""}
                  onChange={(e) =>
                    setForms((prev) => ({
                      ...prev,
                      paypal: {
                        ...prev.paypal,
                        config: { ...prev.paypal.config, [key]: e.target.value },
                      },
                    }))
                  }
                  placeholder={paypal.config[key] || "Not configured"}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500">Current: {paypal.config[key] || "-"}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => handleSave("paypal")}
              disabled={savingProvider === "paypal"}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingProvider === "paypal" ? "Saving..." : "Save PayPal Config"}
            </button>
            <button
              onClick={handleTestPaypal}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Test connection
            </button>
            {paypalTestResult && <span className="text-sm text-gray-600">{paypalTestResult}</span>}
          </div>
        </section>
      )}
    </div>
  );
}
