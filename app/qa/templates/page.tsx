"use client";

import { useEffect, useState } from "react";

type Template = { id: string; name: string; status: string };

export default function QaTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [itemsText, setItemsText] = useState("Safety helmets\nScaffolding integrity");

  const load = async () => {
    const res = await fetch("/api/qa/templates", { credentials: "include" });
    const json = await res.json();
    setTemplates(json.items || []);
  };

  useEffect(() => { load(); }, []);

  const createTemplate = async () => {
    const items = itemsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ label, check_type: "boolean" }));

    await fetch("/api/qa/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, items }),
    });

    setName("");
    await load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">QA Templates</h1>
      <div className="rounded border p-4 space-y-2 bg-white">
        <input className="border p-2 w-full" placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="border p-2 w-full h-24" value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={createTemplate}>Create template</button>
      </div>
      <div className="rounded border p-4 bg-white">
        <h2 className="font-medium mb-2">Existing templates</h2>
        <ul className="space-y-1 text-sm">
          {templates.map((t) => <li key={t.id}>{t.name} ({t.status})</li>)}
        </ul>
      </div>
    </div>
  );
}