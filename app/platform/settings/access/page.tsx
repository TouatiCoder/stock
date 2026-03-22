"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { getPlatformAccessSettings, updatePlatformAccessSettings } from "@/lib/platform-admin/client";

export default function PlatformAccessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [persistedEnabled, setPersistedEnabled] = useState(false);
  const [nextEnabled, setNextEnabled] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const settings = await getPlatformAccessSettings();
        setPersistedEnabled(settings.require_active_subscription);
        setNextEnabled(settings.require_active_subscription);
      } catch (err: any) {
        setError(err.message || "Failed to load access settings");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const hasChanges = useMemo(() => persistedEnabled !== nextEnabled, [persistedEnabled, nextEnabled]);

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await updatePlatformAccessSettings({
        require_active_subscription: nextEnabled,
        confirm: true,
      });
      setPersistedEnabled(updated.require_active_subscription);
      setNextEnabled(updated.require_active_subscription);
      setSuccess("Access enforcement setting updated.");
    } catch (err: any) {
      setError(err.message || "Failed to save access settings");
    } finally {
      setSaving(false);
      setOpenConfirm(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading access settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Access Enforcement</h2>
        <p className="text-sm text-gray-600">
          Require an active or trialing company subscription to access the platform. Super Admin routes remain accessible.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Require Active Subscription</h3>
            <p className="mt-1 text-sm text-gray-600">
              When enabled, companies without an active/trialing subscription (or valid past-due grace) are redirected to billing.
            </p>
          </div>
          <Switch checked={nextEnabled} onCheckedChange={setNextEnabled} aria-label="Require active subscription" />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-green-700">{success}</p>}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={!hasChanges || saving}
            onClick={() => setOpenConfirm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={saving || !hasChanges}
            onClick={() => setNextEnabled(persistedEnabled)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </section>

      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm access policy change</AlertDialogTitle>
            <AlertDialogDescription>
              {nextEnabled
                ? "This will require payment-valid subscriptions for company access. Super Admin access will remain allowed."
                : "This will disable payment-based access enforcement and allow all authenticated companies to access."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={save} disabled={saving}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}