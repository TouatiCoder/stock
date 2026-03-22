"use client";

import { useEffect, useState } from "react";

type Alert = { id: string; material_id: string; current_qty: number; threshold_qty: number; status: string };

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const load = async () => {
    const res = await fetch("/api/stock/alerts", { credentials: "include" });
    const json = await res.json();
    setAlerts(json.items || []);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Low Stock Alerts</h1>
      <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={load}>Refresh</button>
      <div className="rounded border p-4 bg-white text-sm space-y-1">
        {alerts.map((a) => (
          <div key={a.id}>{a.material_id}: {a.current_qty}/{a.threshold_qty} ({a.status})</div>
        ))}
      </div>
    </div>
  );
}