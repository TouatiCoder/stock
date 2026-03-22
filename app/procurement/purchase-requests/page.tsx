"use client";

import { useEffect, useState } from "react";

type PR = { id: string; status: string; project_id: string };

export default function PurchaseRequestsPage() {
  const [items, setItems] = useState<PR[]>([]);
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("Concrete bags");
  const [quantity, setQuantity] = useState("10");

  const load = async () => {
    const res = await fetch("/api/procurement/purchase-requests", { credentials: "include" });
    const json = await res.json();
    setItems(json.items || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch("/api/procurement/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project_id: projectId, items: [{ description, quantity: Number(quantity) }] }),
    });
    await load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Purchase Requests</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <input className="border p-2 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="border p-2 w-full" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={create}>Submit request</button>
      </div>
      <div className="rounded border p-4 bg-white text-sm">
        {items.map((x) => <div key={x.id}>{x.id} - {x.project_id} - {x.status}</div>)}
      </div>
    </div>
  );
}