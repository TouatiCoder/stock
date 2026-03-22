"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WarehouseActions({ warehouseId }: { warehouseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Supprimer cet entrepot ?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/warehouses/${warehouseId}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Suppression impossible");
      }
      if (payload?.alreadyDeleted) {
        // Keep UX clean when clicking delete on stale rows.
        console.warn("Warehouse already deleted:", warehouseId);
      }
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Suppression impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/warehouses/${warehouseId}/edit`}>
        <Button variant="outline" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </Button>
      </Link>
      <Button variant="outline" size="sm" onClick={handleDelete} disabled={loading}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </Button>
    </div>
  );
}
