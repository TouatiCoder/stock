"use client";

import { useEffect, useState } from "react";
import { Receipt, Plus, RefreshCw } from "lucide-react";
import { PrintButton } from "@/components/print/PrintButton";
import { PrintHeader } from "@/components/print/PrintHeader";

type Invoice = { id: string; project_id: string; invoice_number: string; amount: number; currency: string; issued_at: string | null; created_at: string };
type Project = { id: string; name: string };

export default function InvoiceEntryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [projectId, setProjectId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [issuedAt, setIssuedAt] = useState("");

  const loadInvoices = async () => {
    const res = await fetch("/api/procurement/supplier-invoices", { credentials: "include" });
    const json = await res.json();
    setInvoices(json.items || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [projRes] = await Promise.all([
          fetch("/api/projects?limit=200", { credentials: "include" }),
          loadInvoices(),
        ]);
        const projJson = await projRes.json();
        setProjects(projJson.projects || []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || "—";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!projectId) e.projectId = "Select a project";
    if (!invoiceNumber.trim()) e.invoiceNumber = "Enter invoice number";
    if (!amount || Number(amount) <= 0) e.amount = "Enter a positive amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const create = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/procurement/supplier-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project_id: projectId,
          invoice_number: invoiceNumber.trim(),
          amount: Number(amount),
          issued_at: issuedAt || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Invoice ${invoiceNumber} recorded successfully.` });
        setProjectId(""); setInvoiceNumber(""); setAmount(""); setIssuedAt(""); setErrors({});
        setShowForm(false);
        await loadInvoices();
      } else {
        setMessage({ type: "error", text: json.error || "Failed to create invoice." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  const inputCls = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <PrintHeader
        title="Supplier Invoices"
        subtitle={`Invoice register — ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} · Total: ${totalAmount.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Record and track invoices from suppliers</p>
        </div>
        <div className="no-print flex items-center gap-2">
          <PrintButton />
          <button
            onClick={async () => { setLoading(true); await loadInvoices(); setLoading(false); }}
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
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{invoices.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">
              {totalAmount.toLocaleString("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="no-print rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">New Supplier Invoice</h2>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
              <input
                type="text"
                placeholder="e.g. INV-2025-001"
                value={invoiceNumber}
                onChange={(e) => { setInvoiceNumber(e.target.value); setErrors((p) => ({ ...p, invoiceNumber: "" })); }}
                className={inputCls("invoiceNumber")}
              />
              {errors.invoiceNumber && <p className="text-xs text-red-600 mt-1">{errors.invoiceNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (MAD) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
                className={inputCls("amount")}
              />
              {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date (optional)</label>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
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
              {submitting ? "Creating…" : "Create Invoice"}
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

      {/* Invoice table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Invoice Register</h2>
          <span className="text-xs text-gray-400">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading invoices…</div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">No invoices recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "New Invoice" to record your first supplier invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Invoice Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[120px]">
                      <span className="truncate block">{projectName(inv.project_id)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {Number(inv.amount).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} {inv.currency}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 whitespace-nowrap">
                    {totalAmount.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
