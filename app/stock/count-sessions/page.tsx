"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CheckCheck, RefreshCw, History } from "lucide-react";
import { PrintButton } from "@/components/print/PrintButton";
import { PrintHeader } from "@/components/print/PrintHeader";

type Material = { id: string; name: string; unit_of_measure: string; current_stock?: number };
type CountSession = { id: string; status: string; created_at: string; posted_at: string | null };

const SESSION_STYLE: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  posted: "bg-green-100 text-green-800",
};

export default function StockCountSessionsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sessions, setSessions] = useState<CountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [materialId, setMaterialId] = useState("");
  const [countedQty, setCountedQty] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const loadSessions = async () => {
    const res = await fetch("/api/stock/count-sessions", { credentials: "include" });
    const json = await res.json();
    setSessions(json.items || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [, matRes] = await Promise.all([
          loadSessions(),
          fetch("/api/materials", { credentials: "include" }),
        ]);
        const matJson = await (matRes as Response).json();
        setMaterials(Array.isArray(matJson) ? matJson : []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!materialId) e.materialId = "Select a material";
    if (!countedQty || Number(countedQty) < 0) e.countedQty = "Enter a valid counted quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createSession = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const systemQty = Number(selectedMaterial?.current_stock ?? 0);
      const res = await fetch("/api/stock/count-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: [{ material_id: materialId, system_qty: systemQty, counted_qty: Number(countedQty) }],
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSessionId(json.id);
        setMessage({
          type: "success",
          text: `Count session created. System: ${systemQty}, Counted: ${countedQty} ${selectedMaterial?.unit_of_measure || ""}. Review and post variance below.`,
        });
        await loadSessions();
      } else {
        setMessage({ type: "error", text: json.error || "Failed to create session." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const postVariance = async () => {
    if (!sessionId) return;
    setPosting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/stock/count-sessions/${sessionId}/post-variance`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Variance posted — stock levels updated." });
        setSessionId(null);
        setMaterialId("");
        setCountedQty("");
        setErrors({});
        await loadSessions();
      } else {
        setMessage({ type: "error", text: json.error || "Failed to post variance." });
      }
    } finally {
      setPosting(false);
    }
  };

  const variance =
    materialId && countedQty !== ""
      ? Number(countedQty) - Number(selectedMaterial?.current_stock ?? 0)
      : null;

  const inputCls = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      <PrintHeader
        title="Stock Count Sessions"
        subtitle={`Physical inventory count and variance log — ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
          <p className="text-sm text-gray-500 mt-1">Perform a physical count and reconcile with system quantities</p>
        </div>
        <div className="no-print flex items-center gap-2">
          <PrintButton />
          <button
            onClick={async () => { setLoading(true); await loadSessions(); setLoading(false); }}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Step 1 — Create count session */}
      <div className="no-print rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList size={18} className="text-blue-600" />
          Step 1 — Select material and enter count
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
          {loading ? (
            <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ) : (
            <select
              value={materialId}
              onChange={(e) => { setMaterialId(e.target.value); setCountedQty(""); setErrors((p) => ({ ...p, materialId: "" })); }}
              className={inputCls("materialId")}
            >
              <option value="">— Select material —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit_of_measure})
                </option>
              ))}
            </select>
          )}
          {errors.materialId && <p className="text-xs text-red-600 mt-1">{errors.materialId}</p>}
        </div>

        {selectedMaterial && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
            <p className="text-blue-800 font-medium">
              System quantity: <span className="font-bold">{selectedMaterial.current_stock ?? "—"} {selectedMaterial.unit_of_measure}</span>
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Physically counted quantity *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter actual count…"
            value={countedQty}
            onChange={(e) => { setCountedQty(e.target.value); setErrors((p) => ({ ...p, countedQty: "" })); }}
            disabled={!materialId}
            className={inputCls("countedQty") + (!materialId ? " disabled:bg-gray-50 disabled:text-gray-400" : "")}
          />
          {errors.countedQty && <p className="text-xs text-red-600 mt-1">{errors.countedQty}</p>}
        </div>

        {variance !== null && countedQty !== "" && (
          <div className={`rounded-lg px-4 py-3 text-sm font-medium border ${
            variance === 0
              ? "bg-green-50 border-green-200 text-green-800"
              : variance > 0
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            Variance: {variance > 0 ? "+" : ""}{variance} {selectedMaterial?.unit_of_measure}
            {variance === 0 && " — No discrepancy"}
            {variance > 0 && " — Surplus (stock will increase)"}
            {variance < 0 && " — Shortage (stock will decrease)"}
          </div>
        )}

        <button
          onClick={createSession}
          disabled={submitting || !!sessionId}
          className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Creating session…" : sessionId ? "Session pending — post variance first" : "Create Count Session"}
        </button>
      </div>

      {/* Step 2 — Post variance */}
      {sessionId && (
        <div className="no-print rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-amber-900 flex items-center gap-2">
            <CheckCheck size={18} />
            Step 2 — Review and post variance
          </h2>
          <p className="text-sm text-amber-800">
            Session created. Post the variance to permanently update stock levels.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={postVariance}
              disabled={posting}
              className="px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {posting ? "Posting…" : "Post Variance & Update Stock"}
            </button>
            <button
              onClick={() => { setSessionId(null); setMaterialId(""); setCountedQty(""); setErrors({}); setMessage(null); }}
              className="px-4 py-2.5 rounded-lg border border-amber-300 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Session history */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <History size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Count Session History</h2>
          <span className="ml-auto text-xs text-gray-400">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">No count sessions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Session ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Posted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${s.id === sessionId ? "bg-amber-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${SESSION_STYLE[s.status] || "bg-gray-100 text-gray-700"}`}>
                        {s.status}
                      </span>
                      {s.id === sessionId && (
                        <span className="ml-2 text-xs text-amber-700 font-medium">← current</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                      {s.posted_at ? new Date(s.posted_at).toLocaleDateString() : <span className="italic">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
