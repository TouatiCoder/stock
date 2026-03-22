"use client";

import { useEffect, useState } from "react";

type Milestone = { id: string; title: string; status: string };

export default function ProjectExecutionPage({ params }: { params: { id: string } }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState("0");
  const [status, setStatus] = useState("active");
  const [delayReason, setDelayReason] = useState("");
  const [delayDays, setDelayDays] = useState("0");

  const load = async () => {
    const res = await fetch(`/api/projects/${params.id}/milestones`, { credentials: "include" });
    const json = await res.json();
    setMilestones(json.items || []);
  };

  useEffect(() => { load(); }, [params.id]);

  const addMilestone = async () => {
    await fetch(`/api/projects/${params.id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    setTitle("");
    await load();
  };

  const updateProgress = async () => {
    await fetch(`/api/projects/${params.id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ progress_pct: Number(progress) }),
    });
  };

  const updateStatus = async () => {
    await fetch(`/api/projects/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
  };

  const logDelay = async () => {
    await fetch(`/api/projects/${params.id}/delays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason: delayReason, days_delayed: Number(delayDays) }),
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Project Execution</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-4 bg-white space-y-2">
          <h2 className="font-medium">Milestones editor</h2>
          <input className="border p-2 w-full" placeholder="Milestone title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={addMilestone}>Add milestone</button>
          <ul className="text-sm space-y-1">{milestones.map((m) => <li key={m.id}>{m.title} ({m.status})</li>)}</ul>
        </div>
        <div className="rounded border p-4 bg-white space-y-2">
          <h2 className="font-medium">Progress & Status</h2>
          <input className="border p-2 w-full" placeholder="Progress %" value={progress} onChange={(e) => setProgress(e.target.value)} />
          <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={updateProgress}>Update progress</button>
          <select className="border p-2 w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="planning">planning</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={updateStatus}>Update status</button>
        </div>
      </div>
      <div className="rounded border p-4 bg-white space-y-2">
        <h2 className="font-medium">Delay log form</h2>
        <input className="border p-2 w-full" placeholder="Reason" value={delayReason} onChange={(e) => setDelayReason(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Days delayed" value={delayDays} onChange={(e) => setDelayDays(e.target.value)} />
        <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={logDelay}>Log delay</button>
      </div>
    </div>
  );
}