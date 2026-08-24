"use client";

import { useEffect, useState } from "react";

type Notification = { id: string; type_code: string; title: string; body_text: string | null; is_read: number };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    const res = await fetch("/api/notifications", { credentials: "include" });
    const json = await res.json();
    setItems(json.items || []);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
    await load();
  };

  const markAll = async () => {
    await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
    await load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Notification Panel</h1>
      <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={markAll}>Mark all read</button>
      <div className="rounded border p-4 bg-white space-y-2 text-sm">
        {items.map((n) => (
          <div key={n.id} className="border rounded p-2 flex items-center justify-between">
            <div>
              <p className="font-medium">{n.title}</p>
              <p className="text-gray-600">{n.type_code} - {n.body_text || ""}</p>
            </div>
            {n.is_read ? <span>Read</span> : <button className="underline" onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
        ))}
      </div>
    </div>
  );
}