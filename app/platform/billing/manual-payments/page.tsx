"use client";

import { useEffect, useState } from "react";
import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
import {
  confirmManualPayment,
  getManualPayments,
  rejectManualPayment,
  type ManualPlanPaymentDto,
} from "@/lib/platform-admin/client";

const statusBadgeClass = (status: string) => {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

export default function ManualPaymentsPage() {
  const t = usePlatformTranslations();
  const { locale } = useLocale();
  const [items, setItems] = useState<ManualPlanPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getManualPayments();
      setItems(response.items);
    } catch (err: any) {
      setError(err.message || t("manualPayments.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US";
    return new Date(value).toLocaleString(dateLocale);
  };

  const handleConfirm = async (id: string) => {
    try {
      setActingId(id);
      await confirmManualPayment(id);
      await load();
    } catch (err: any) {
      window.alert(err.message || t("manualPayments.errors.confirmFailed"));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    try {
      setActingId(rejectTargetId);
      await rejectManualPayment(rejectTargetId, rejectReason);
      setRejectTargetId(null);
      setRejectReason("");
      await load();
    } catch (err: any) {
      window.alert(err.message || t("manualPayments.errors.rejectFailed"));
    } finally {
      setActingId(null);
    }
  };

  const pending = items.filter((item) => item.status === "pending");
  const resolved = items.filter((item) => item.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t("manualPayments.title")}</h2>
        <p className="text-sm text-gray-600">{t("manualPayments.subtitle")}</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{t("manualPayments.loading")}</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {t("manualPayments.pendingTitle")} ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500">{t("manualPayments.noPending")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4">{t("manualPayments.columns.company")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.plan")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.method")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.amount")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.requestedBy")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.requestedAt")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">{item.company.name}</td>
                        <td className="py-2 pr-4 capitalize">
                          {item.planCode} · {item.cadence}
                        </td>
                        <td className="py-2 pr-4 capitalize">{item.method}</td>
                        <td className="py-2 pr-4">{item.amountMad} MAD</td>
                        <td className="py-2 pr-4">
                          {item.requestedBy.firstName} {item.requestedBy.lastName}
                        </td>
                        <td className="py-2 pr-4">{formatDate(item.createdAt)}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirm(item.id)}
                              disabled={actingId === item.id}
                              className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {t("manualPayments.confirmButton")}
                            </button>
                            <button
                              onClick={() => setRejectTargetId(item.id)}
                              disabled={actingId === item.id}
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {t("manualPayments.rejectButton")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">{t("manualPayments.historyTitle")}</h3>
            {resolved.length === 0 ? (
              <p className="text-sm text-gray-500">{t("manualPayments.noHistory")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4">{t("manualPayments.columns.company")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.plan")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.method")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.amount")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.status")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.confirmedBy")}</th>
                      <th className="py-2 pr-4">{t("manualPayments.columns.paidAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">{item.company.name}</td>
                        <td className="py-2 pr-4 capitalize">
                          {item.planCode} · {item.cadence}
                        </td>
                        <td className="py-2 pr-4 capitalize">{item.method}</td>
                        <td className="py-2 pr-4">{item.amountMad} MAD</td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {item.confirmedBy ? `${item.confirmedBy.firstName} ${item.confirmedBy.lastName}` : "-"}
                        </td>
                        <td className="py-2 pr-4">{formatDate(item.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {rejectTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("manualPayments.rejectDialogTitle")}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("manualPayments.rejectReasonPlaceholder")}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectTargetId(null);
                  setRejectReason("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("manualPayments.cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={actingId === rejectTargetId}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t("manualPayments.rejectButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
