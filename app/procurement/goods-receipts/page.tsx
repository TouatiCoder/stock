"use client";

import { useState } from "react";

export default function GoodsReceiptsPage() {
  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("Concrete bags");
  const [quantity, setQuantity] = useState("10");
  const [message, setMessage] = useState("");

  const create = async () => {
    const res = await fetch("/api/procurement/goods-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        purchase_request_id: purchaseRequestId,
        project_id: projectId,
        items: [{ description, quantity: Number(quantity) }],
      }),
    });
    const json = await res.json();
    setMessage(res.ok ? `Created receipt ${json.id}` : json.error || "Failed");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Goods Receipt Form</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Approved purchase request ID" value={purchaseRequestId} onChange={(e) => setPurchaseRequestId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <input className="border p-2 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="border p-2 w-full" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={create}>Post receipt</button>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  );
}