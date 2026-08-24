"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, MessageSquare, X } from "lucide-react";

type PR = { id: string; status: string; project_id: string; notes: string | null; created_at: string };
type Project = { id: string; name: string };
type Tab = "pending" | "all";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ApprovalsQueuePage() {
  const [items, setItems] = useState<PR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");

  // Rejection comment
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

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
    fetch("/api/projects?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => setProjects(json.projects || []));
    load();
  }, []);

  const decide = async (id: string, decision: "approved" | "rejected", comment?: string) => {
    setDeciding(id + decision);
    try {
      await fetch(`/api/procurement/purchase-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decision, comment: comment || null }),
      });
      setRejectTarget(null);
      setRejectComment("");
      await load();
    } finally {
      setDeciding(null);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || "Unknown project";

  const pending = items.filter((x) => x.status === "pending");
  const displayed = tab === "pending" ? pending : items;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve pending purchase requests</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Refresh"
          className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats banner */}
      {!loading && pending.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>
            <strong>{pending.length}</strong> request{pending.length !== 1 ? "s" : ""} awaiting your decision
          </span>
        </div>
      )}

      {/* Rejection comment modal */}
      {rejectTarget && (
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare size={15} className="text-red-500" />
              Rejection reason (optional)
            </p>
            <button onClick={() => { setRejectTarget(null); setRejectComment(""); }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Explain why this request is being rejected…"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => decide(rejectTarget, "rejected", rejectComment)}
              disabled={deciding !== null}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deciding ? "Rejecting…" : "Confirm Rejection"}
            </button>
            <button
              onClick={() => { setRejectTarget(null); setRejectComment(""); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setTab("pending")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "pending" ? "text-blue-600 bg-white border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending
            {pending.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                tab === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600"
              }`}>
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "all" ? "text-blue-600 bg-white border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Requests
            {items.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                tab === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
              }`}>
                {items.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading requests…</div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle size={32} className="mx-auto text-green-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              {tab === "pending" ? "All caught up! No pending requests." : "No requests found."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((item) => (
              <div key={item.id} className={`p-4 sm:p-5 transition-colors ${item.status === "pending" ? "hover:bg-amber-50/30" : "hover:bg-gray-50"}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.status === "pending" && <Clock size={14} className="text-amber-500 flex-shrink-0" />}
                      {item.status === "approved" && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                      {item.status === "rejected" && <XCircle size={14} className="text-red-400 flex-shrink-0" />}
                      <p className="text-sm font-semibold text-gray-900 truncate">{projectName(item.project_id)}</p>
                      {tab === "all" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[item.status] || "bg-gray-100 text-gray-700"}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-600 ml-5 bg-gray-50 px-2 py-1 rounded border border-gray-200 max-w-md">
                        {item.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 ml-5">
                      Submitted: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>

                  {item.status === "pending" && (
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => decide(item.id, "approved")}
                        disabled={deciding !== null || rejectTarget !== null}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle size={14} />
                        {deciding === item.id + "approved" ? "Approving…" : "Approve"}
                      </button>
                      <button
                        onClick={() => { setRejectTarget(item.id); setRejectComment(""); }}
                        disabled={deciding !== null || rejectTarget !== null}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
