"use client";

import { useState } from "react";

export default function StockCountSessionsPage() {
  const [materialId, setMaterialId] = useState("");
  const [systemQty, setSystemQty] = useState("0");
  const [countedQty, setCountedQty] = useState("0");
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");

  const createSession = async () => {
    const res = await fetch("/api/stock/count-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: [{ material_id: materialId, system_qty: Number(systemQty), counted_qty: Number(countedQty) }],
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setSessionId(json.id);
      setMessage(`Created count session ${json.id}`);
    } else {
      setMessage(json.error || "Failed");
    }
  };

  const postVariance = async () => {
    const res = await fetch(`/api/stock/count-sessions/${sessionId}/post-variance`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    setMessage(res.ok ? "Variance posted" : json.error || "Failed");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Count Session Screen</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Material ID" value={materialId} onChange={(e) => setMaterialId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="System qty" value={systemQty} onChange={(e) => setSystemQty(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Counted qty" value={countedQty} onChange={(e) => setCountedQty(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={createSession}>Create count session</button>
      </div>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
        <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={postVariance}>Post variance</button>
      </div>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}