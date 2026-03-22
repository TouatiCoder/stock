"use client";

import { useState } from "react";

export default function StockReservationsPage() {
  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reservationId, setReservationId] = useState("");
  const [message, setMessage] = useState("");

  const createReservation = async () => {
    const res = await fetch("/api/stock/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project_id: projectId, material_id: materialId, quantity: Number(quantity) }),
    });
    const json = await res.json();
    setMessage(res.ok ? `Reservation ${json.id} created` : json.error || "Failed");
  };

  const releaseReservation = async () => {
    const res = await fetch(`/api/stock/reservations/${reservationId}/release`, { method: "POST", credentials: "include" });
    const json = await res.json();
    setMessage(res.ok ? "Reservation released" : json.error || "Failed");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reservation Form</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Material ID" value={materialId} onChange={(e) => setMaterialId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={createReservation}>Create reservation</button>
      </div>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Reservation ID" value={reservationId} onChange={(e) => setReservationId(e.target.value)} />
        <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={releaseReservation}>Release reservation</button>
      </div>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}