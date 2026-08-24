"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { PrintButton } from "@/components/print/PrintButton";
import { PrintHeader } from "@/components/print/PrintHeader";

type PR = { id: string; status: string; project_id: string; notes: string | null; created_at: string };
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit_of_measure: string };
type Tab = "all" | "pending" | "approved" | "rejected";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={11} />,
  approved: <CheckCircle size={11} />,
  rejected: <XCircle size={11} />,
};

export default function PurchaseRequestsPage() {
  const [items, setItems] = useState<PR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/procurement/purchase-requests", { credentials: "include" });
      const json = await res.json();
      setItems(json.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/projects?limit=200", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/materials", { credentials: "include" }).then((r) => r.json()),
    ]).then(([projJson, matJson]) => {
      setProjects(projJson.projects || []);
      setMaterials(Array.isArray(matJson) ? matJson : []);
    });
    load();
  }, []);

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!projectId) e.projectId = "Select a project";
    if (!materialId) e.materialId = "Select a material";
    if (!quantity || Number(quantity) <= 0) e.quantity = "Enter a positive quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const create = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/procurement/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project_id: projectId,
          items: [{ description: selectedMaterial!.name, material_id: materialId, quantity: Number(quantity) }],
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        setProjectId(""); setMaterialId(""); setQuantity("1"); setNotes(""); setErrors({});
        setShowForm(false);
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || "—";

  const counts = {
    all: items.length,
    pending: items.filter((x) => x.status === "pending").length,
    approved: items.filter((x) => x.status === "approved").length,
    rejected: items.filter((x) => x.status === "rejected").length,
  };

  const filtered = tab === "all" ? items : items.filter((x) => x.status === tab);

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const inputCls = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <PrintHeader
        title="Purchase Requests"
        subtitle={`Material purchase request log — ${items.length} request${items.length !== 1 ? "s" : ""}`}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Purchase Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Submit and track material purchase requests</p>
        </div>
        <div className="no-print flex items-center gap-2">
          <PrintButton />
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setErrors({}); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">New Request</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total", value: counts.all, cls: "text-gray-900" },
            { label: "Pending", value: counts.pending, cls: "text-yellow-700" },
            { label: "Approved", value: counts.approved, cls: "text-green-700" },
            { label: "Rejected", value: counts.rejected, cls: "text-red-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="no-print rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">New Purchase Request</h2>
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
              <select
                value={materialId}
                onChange={(e) => { setMaterialId(e.target.value); setErrors((p) => ({ ...p, materialId: "" })); }}
                className={inputCls("materialId")}
              >
                <option value="">— Select material —</option>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit_of_measure})</option>)}
              </select>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="Additional context for approvers…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={create}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Request"}
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

      {/* Table with filter tabs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="no-print flex border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-blue-600 bg-white border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
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
          <div className="p-10 text-center text-sm text-gray-500">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileText size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              {tab === "all" ? "No purchase requests yet." : `No ${tab} requests.`}
            </p>
            {tab === "all" && (
              <p className="text-xs text-gray-400 mt-1">Click "New Request" to submit your first one.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Notes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((x) => (
                  <tr key={x.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px]">
                      <span className="truncate block">{projectName(x.project_id)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs hidden sm:table-cell">
                      {x.notes ? (
                        <span className="truncate block">{x.notes}</span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No notes</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[x.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_ICON[x.status]}
                        <span className="capitalize">{x.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                      {x.created_at ? new Date(x.created_at).toLocaleDateString() : "—"}
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
