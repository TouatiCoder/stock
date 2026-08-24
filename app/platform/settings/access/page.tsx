"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlatformTranslations } from "@/components/LocaleProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { getPlatformAccessSettings, updatePlatformAccessSettings } from "@/lib/platform-admin/client";

export default function PlatformAccessSettingsPage() {
  const t = usePlatformTranslations();
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
        setError(err.message || t("access.errors.load"));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [t]);

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
      setSuccess(t("access.success"));
    } catch (err: any) {
      setError(err.message || t("access.errors.save"));
    } finally {
      setSaving(false);
      setOpenConfirm(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{t("access.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t("access.title")}</h2>
        <p className="text-sm text-gray-600">{t("access.subtitle")}</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{t("access.card.title")}</h3>
            <p className="mt-1 text-sm text-gray-600">{t("access.card.description")}</p>
          </div>
          <Switch checked={nextEnabled} onCheckedChange={setNextEnabled} aria-label={t("access.card.switchLabel")} />
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
            {saving ? t("access.actions.saving") : t("access.actions.save")}
          </button>
          <button
            type="button"
            disabled={saving || !hasChanges}
            onClick={() => setNextEnabled(persistedEnabled)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("access.actions.reset")}
          </button>
        </div>
      </section>

      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("access.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {nextEnabled ? t("access.confirm.enableDescription") : t("access.confirm.disableDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t("access.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={save} disabled={saving}>
              {t("access.actions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
