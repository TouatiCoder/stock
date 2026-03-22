"use client";

import { useEffect, useState } from "react";

type Anomaly = { id: string; title: string; status: string; severity: string };

export default function QaAnomaliesPage() {
  const [items, setItems] = useState<Anomaly[]>([]);
  const [anomalyId, setAnomalyId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [actionText, setActionText] = useState("Investigate and remediate");

  const load = async () => {
    const res = await fetch("/api/qa/anomalies", { credentials: "include" });
    const json = await res.json();
    setItems(json.items || []);
  };

  useEffect(() => { load(); }, []);

  const assign = async () => {
    await fetch(`/api/qa/anomalies/${anomalyId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ assigned_to: assignedTo, action_text: actionText }),
    });
    await load();
  };

  const close = async () => {
    await fetch(`/api/qa/anomalies/${anomalyId}/close`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">QA Anomalies & Corrective Actions</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Anomaly ID" value={anomalyId} onChange={(e) => setAnomalyId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Assign user ID" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Action" value={actionText} onChange={(e) => setActionText(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={assign}>Assign corrective action</button>
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={close}>Close anomaly</button>
        </div>
      </div>
      <div className="rounded border p-4 bg-white">
        <ul className="space-y-1 text-sm">
          {items.map((a) => <li key={a.id}>{a.id} - {a.title} ({a.status}/{a.severity})</li>)}
        </ul>
      </div>
    </div>
  );
}