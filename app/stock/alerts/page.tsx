"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, PackageCheck } from "lucide-react";

type Alert = {
  id: string;
  material_id: string;
  current_qty: number;
  threshold_qty: number;
  status: string;
  triggered_at?: string;
};
type Material = { id: string; name: string; unit_of_measure: string };

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    const res = await fetch("/api/stock/alerts", { credentials: "include" });
    const json = await res.json();
    setAlerts(json.items || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [_, matRes] = await Promise.all([
          loadAlerts(),
          fetch("/api/materials", { credentials: "include" }),
        ]);
        const matJson = await matRes.json();
        setMaterials(Array.isArray(matJson) ? matJson : []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAlerts();
    } finally {
      setRefreshing(false);
    }
  };

  const getMaterial = (id: string) => materials.find((m) => m.id === id);

  const getStockPct = (current: number, threshold: number) =>
    threshold > 0 ? Math.min(Math.round((current / threshold) * 100), 100) : 0;

  const getSeverity = (current: number, threshold: number) => {
    const pct = getStockPct(current, threshold);
    if (pct === 0) return { label: "Out of stock", color: "text-red-700", bg: "bg-red-100", bar: "bg-red-500", border: "border-red-200" };
    if (pct <= 25) return { label: "Critical", color: "text-red-700", bg: "bg-red-100", bar: "bg-red-500", border: "border-red-200" };
    if (pct <= 60) return { label: "Low", color: "text-orange-700", bg: "bg-orange-100", bar: "bg-orange-500", border: "border-orange-200" };
    return { label: "Alert", color: "text-yellow-700", bg: "bg-yellow-100", bar: "bg-yellow-500", border: "border-yellow-200" };
  };

  const openAlerts = alerts.filter((a) => a.status === "open");

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Materials that have fallen below their minimum threshold</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {!loading && openAlerts.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <AlertTriangle size={16} />
          <span><strong>{openAlerts.length}</strong> material{openAlerts.length !== 1 ? "s" : ""} below threshold and require restocking</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <PackageCheck size={32} className="mx-auto text-green-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">All stock levels are healthy</p>
            <p className="text-xs text-gray-400 mt-1">No materials are below their minimum threshold.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((a) => {
              const material = getMaterial(a.material_id);
              const severity = getSeverity(Number(a.current_qty), Number(a.threshold_qty));
              const pct = getStockPct(Number(a.current_qty), Number(a.threshold_qty));

              return (
                <div key={a.id} className={`p-4 sm:p-5 border-l-4 ${severity.border}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {material?.name || a.material_id}
                      </p>
                      {material?.unit_of_measure && (
                        <p className="text-xs text-gray-500">{material.unit_of_measure}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${severity.bg} ${severity.color}`}>
                        {severity.label}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === "open" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Current: <strong className={severity.color}>{Number(a.current_qty)} {material?.unit_of_measure || ""}</strong></span>
                      <span>Threshold: <strong>{Number(a.threshold_qty)} {material?.unit_of_measure || ""}</strong></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${severity.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{pct}% of minimum threshold</p>
                  </div>

                  <div className="mt-3">
                    <a
                      href={`/costs/orders/new?material=${a.material_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Create purchase order →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
