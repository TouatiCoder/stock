import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  try {
    const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
    if (auth.error || !auth.user) return auth.error;

    const rows = await db.$queryRaw<Array<{
      id: string
      project_id: string | null
      material_id: string
      movement_type: string
      source_type: string | null
      source_warehouse_id: string | null
      destination_type: string | null
      destination_warehouse_id: string | null
      quantity: any
      movement_date: Date
    }>>(
      Prisma.sql`
        SELECT
          sm.id,
          sm.project_id,
          sm.material_id,
          sm.movement_type,
          sm.source_type,
          sm.source_warehouse_id,
          sm.destination_type,
          sm.destination_warehouse_id,
          sm.quantity,
          sm.movement_date
        FROM stock_movements sm
        JOIN materials m ON m.id = sm.material_id
        WHERE m.company_id = ${auth.user.companyId}
        ORDER BY sm.movement_date DESC
        LIMIT 1000
      `,
    );

    const header = "id,project_id,material_id,movement_type,source_type,source_warehouse_id,destination_type,destination_warehouse_id,quantity,movement_date";
    const lines = rows.map((r) =>
      [
        r.id,
        r.project_id || "",
        r.material_id,
        r.movement_type,
        r.source_type || "",
        r.source_warehouse_id || "",
        r.destination_type || "",
        r.destination_warehouse_id || "",
        Number(r.quantity || 0),
        new Date(r.movement_date).toISOString(),
      ].join(","),
    );
    const csv = [header, ...lines].join("\n");

    await writeAuditEvent({
      companyId: auth.user.companyId,
      actorUserId: auth.user.id,
      action: "export_stock",
      reason: "stock-movements.csv",
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=stock-movements.csv",
      },
    });
  } catch (error: any) {
    const isMissingTable = error?.code === "P2010" && String(error?.meta?.message || "").includes("stock_movements");
    if (!isMissingTable) {
      console.error("stock-movements export error:", error);
      return NextResponse.json({ error: "Failed to export stock movements" }, { status: 500 });
    }

    const header = "id,project_id,material_id,movement_type,source_type,source_warehouse_id,destination_type,destination_warehouse_id,quantity,movement_date";
    return new NextResponse(header, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=stock-movements.csv",
      },
    });
  }
}
