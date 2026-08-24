"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Plus, RefreshCw, Truck } from "lucide-react";

type Receipt = { id: string; project_id: string; purchase_request_id: string; status: string; created_at: string };
type PR = { id: string; status: string; project_id: string; created_at: string };
type Project = { id: string; name: string };
type Material = { id: string; name: string; unit_of_measure: string };

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<PR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const loadReceipts = async () => {
    const res = await fetch("/api/procurement/goods-receipts", { credentials: "include" });
    const json = await res.json();
    setReceipts(json.items || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [receiptsRes, reqRes, projRes, matRes] = await Promise.all([
          fetch("/api/procurement/goods-receipts", { credentials: "include" }),
          fetch("/api/procurement/purchase-requests?status=approved", { credentials: "include" }),
          fetch("/api/projects?limit=200", { credentials: "include" }),
          fetch("/api/materials", { credentials: "include" }),
        ]);
        const [receiptsJson, reqJson, projJson, matJson] = await Promise.all([
          receiptsRes.json(), reqRes.json(), projRes.json(), matRes.json(),
        ]);
        setReceipts(receiptsJson.items || []);
        setApprovedRequests(reqJson.items || []);
        setProjects(projJson.projects || []);
        setMaterials(Array.isArray(matJson) ? matJson : []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRequestSelect = (reqId: string) => {
    setPurchaseRequestId(reqId);
    const req = approvedRequests.find((r) => r.id === reqId);
    if (req?.project_id) setProjectId(req.project_id);
    setErrors((p) => ({ ...p, purchaseRequestId: "" }));
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || "—";
  const selectedMaterial = materials.find((m) => m.id === materialId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!purchaseRequestId) e.purchaseRequestId = "Select an approved request";
    if (!projectId) e.projectId = "Select a project";
    if (!materialId) e.materialId = "Select a material";
    if (!quantity || Number(quantity) <= 0) e.quantity = "Enter a positive quantity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const create = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/procurement/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          purchase_request_id: purchaseRequestId,
          project_id: projectId,
          items: [{ description: selectedMaterial?.name || "Material", material_id: materialId, quantity: Number(quantity) }],
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Goods receipt recorded and stock updated." });
        setPurchaseRequestId(""); setProjectId(""); setMaterialId(""); setQuantity("1"); setErrors({});
        setShowForm(false);
        await loadReceipts();
      } else {
        setMessage({ type: "error", text: json.error || "Failed to post receipt." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goods Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">Record deliveries against approved purchase requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => { setLoading(true); await loadReceipts(); setLoading(false); }}
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
            Record Receipt
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Record Goods Receipt</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approved Purchase Request *</label>
            <select
              value={purchaseRequestId}
              onChange={(e) => handleRequestSelect(e.target.value)}
              className={inputCls("purchaseRequestId")}
            >
              <option value="">— Select approved request —</option>
              {approvedRequests.length === 0 ? (
                <option disabled>No approved requests available</option>
              ) : (
                approvedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {projectName(r.project_id)} — {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                  </option>
                ))
              )}
            </select>
            {errors.purchaseRequestId && <p className="text-xs text-red-600 mt-1">{errors.purchaseRequestId}</p>}
          </div>

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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material received *</label>
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
                Quantity received{selectedMaterial ? ` (${selectedMaterial.unit_of_measure})` : ""} *
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
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={create}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Posting…" : "Post Receipt"}
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

      {/* History table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Receipt History</h2>
          <span className="text-xs text-gray-400">{receipts.length} total</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading receipts…</div>
        ) : receipts.length === 0 ? (
          <div className="p-10 text-center">
            <Truck size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">No receipts recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Post a receipt once goods arrive from a supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[380px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Receipt ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[140px]">
                      <span className="truncate block">{projectName(r.project_id)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <PackageCheck size={11} />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono hidden sm:table-cell">
                      {r.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
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
