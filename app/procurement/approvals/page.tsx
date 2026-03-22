"use client";

import { useEffect, useState } from "react";

type PR = { id: string; status: string };

export default function ApprovalsQueuePage() {
  const [items, setItems] = useState<PR[]>([]);
  const [targetId, setTargetId] = useState("");

  const load = async () => {
    const res = await fetch("/api/procurement/purchase-requests?status=pending", { credentials: "include" });
    const json = await res.json();
    setItems(json.items || []);
  };
  useEffect(() => { load(); }, []);

  const decide = async (decision: "approved" | "rejected") => {
    await fetch(`/api/procurement/purchase-requests/${targetId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ decision }),
    });
    await load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Approval Queue</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Purchase Request ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={() => decide("approved")}>Approve</button>
          <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={() => decide("rejected")}>Reject</button>
        </div>
      </div>
      <div className="rounded border p-4 bg-white text-sm">
        {items.map((x) => <div key={x.id}>{x.id} - {x.status}</div>)}
      </div>
    </div>
  );
}