"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, Plus, RefreshCw } from "lucide-react";

type Material = { id: string; name: string; unit_of_measure: string; current_stock?: number };
type Project = { id: string; name: string };
type Reservation = { id: string; project_id: string; material_id: string; quantity: number; status: string; created_at?: string };
type Tab = "all" | "active" | "released";

export default function StockReservationsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const loadReservations = async () => {
    const res = await fetch("/api/stock/reservations", { credentials: "include" });
    const json = await res.json();
    setReservations(json.items || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [projRes, matRes] = await Promise.all([
          fetch("/api/projects?limit=200", { credentials: "include" }),
          fetch("/api/materials", { credentials: "include" }),
        ]);
        const [projJson, matJson] = await Promise.all([projRes.json(), matRes.json()]);
        setProjects(projJson.projects || []);
        setMaterials(Array.isArray(matJson) ? matJson : []);
        await loadReservations();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!projectId) e.projectId = "Select a project";
    if (!materialId) e.materialId = "Select a material";
    if (!quantity || Number(quantity) <= 0) e.quantity = "Enter a positive quantity";
    if (selectedMaterial?.current_stock != null && Number(quantity) > selectedMaterial.current_stock) {
      e.quantity = `Exceeds available stock (${selectedMaterial.current_stock} ${selectedMaterial.unit_of_measure})`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createReservation = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stock/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ project_id: projectId, material_id: materialId, quantity: Number(quantity) }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Reserved ${quantity} ${selectedMaterial?.unit_of_measure || "units"} of ${selectedMaterial?.name}.` });
        setProjectId(""); setMaterialId(""); setQuantity("1"); setErrors({});
        setShowForm(false);
        await loadReservations();
      } else {
        setMessage({ type: "error", text: json.error || "Failed to create reservation." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const releaseReservation = async (id: string) => {
    setReleasing(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/stock/reservations/${id}/release`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Reservation released." });
        await loadReservations();
      } else {
        const json = await res.json();
        setMessage({ type: "error", text: json.error || "Failed to release." });
      }
    } finally {
      setReleasing(null);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || "—";
  const materialName = (id: string) => materials.find((m) => m.id === id)?.name || "—";
  const materialUnit = (id: string) => materials.find((m) => m.id === id)?.unit_of_measure || "";

  const counts = {
    all: reservations.length,
    active: reservations.filter((r) => r.status === "active").length,
    released: reservations.filter((r) => r.status === "released").length,
  };

  const displayed = tab === "all" ? reservations : reservations.filter((r) => r.status === tab);

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "released", label: "Released" },
  ];

  const inputCls = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Reserve materials for specific projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => { setLoading(true); await loadReservations(); setLoading(false); }}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setMessage(null); setErrors({}); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Reservation
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{counts.all}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-blue-600">Active</p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">{counts.active}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Released</p>
            <p className="text-2xl font-bold text-gray-600 mt-0.5">{counts.released}</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* New reservation form */}
      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Reserve Material</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setErrors((p) => ({ ...p, projectId: "" })); }}
                className={inputCls("projectId")}
              >
                <option value="">— Select project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.projectId && <p className="text-xs text-red-600 mt-1">{errors.projectId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
              {loading ? (
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ) : (
                <select
                  value={materialId}
                  onChange={(e) => { setMaterialId(e.target.value); setErrors((p) => ({ ...p, materialId: "" })); }}
                  className={inputCls("materialId")}
                >
                  <option value="">— Select material —</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.current_stock ?? "?"} {m.unit_of_measure} available
                    </option>
                  ))}
                </select>
              )}
              {errors.materialId && <p className="text-xs text-red-600 mt-1">{errors.materialId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity{selectedMaterial ? ` (${selectedMaterial.unit_of_measure})` : ""} *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setErrors((p) => ({ ...p, quantity: "" })); }}
                className={inputCls("quantity")}
              />
              {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
              {selectedMaterial?.current_stock != null && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {selectedMaterial.current_stock} {selectedMaterial.unit_of_measure}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={createReservation}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Reserving…" : "Confirm Reservation"}
            </button>
            <button
              onClick={() => { setShowForm(false); setErrors({}); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reservations table with tabs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? "text-blue-600 bg-white border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  tab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading reservations…</div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <Lock size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {tab === "all" ? "No reservations yet." : `No ${tab} reservations.`}
            </p>
            {tab === "all" && (
              <p className="text-xs text-gray-400 mt-1">Reserve materials to guarantee stock availability for a project.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Material</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[120px]">
                      <span className="truncate block">{materialName(r.material_id)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[120px]">
                      <span className="truncate block">{projectName(r.project_id)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{Number(r.quantity)} {materialUnit(r.material_id)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "active" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {r.status === "active" ? <Lock size={10} /> : <Unlock size={10} />}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "active" && (
                        <button
                          onClick={() => releaseReservation(r.id)}
                          disabled={releasing !== null}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {releasing === r.id ? "…" : "Release"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {displayed.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            Showing {displayed.length} of {reservations.length} reservation{reservations.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
