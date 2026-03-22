"use client";

import { useState } from "react";

export default function InvoiceEntryPage() {
  const [projectId, setProjectId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("0");
  const [message, setMessage] = useState("");

  const create = async () => {
    const res = await fetch("/api/procurement/supplier-invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project_id: projectId, invoice_number: invoiceNumber, amount: Number(amount) }),
    });
    const json = await res.json();
    setMessage(res.ok ? `Invoice ${json.invoice_id} created` : json.error || "Failed");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Supplier Invoice Entry</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={create}>Create invoice</button>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  );
}