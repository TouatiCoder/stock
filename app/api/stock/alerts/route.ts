import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { createNotification } from "@/lib/backlog/notifications";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const lowRows = await db.$queryRaw<Array<{ material_id: string; quantity: any; min_threshold: any }>>(
    Prisma.sql`
      SELECT material_id, quantity, min_threshold
      FROM inventory
      WHERE company_id = ${auth.user.companyId}
        AND quantity <= COALESCE(min_threshold, 0)
    `,
  );

  for (const row of lowRows) {
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO low_stock_alerts (id, company_id, material_id, threshold_qty, current_qty, status, triggered_at)
        SELECT ${randomUUID()}, ${auth.user.companyId}, ${row.material_id}, ${Number(row.min_threshold || 0)}, ${Number(row.quantity || 0)}, 'open', UTC_TIMESTAMP()
        WHERE NOT EXISTS (
          SELECT 1 FROM low_stock_alerts
          WHERE company_id = ${auth.user.companyId}
            AND material_id = ${row.material_id}
            AND status = 'open'
        )
      `,
    );

    await createNotification({
      companyId: auth.user.companyId,
      typeCode: "low_stock",
      title: "Low stock alert",
      bodyText: `Material ${row.material_id} requires replenishment`,
    });
  }

  if (lowRows.length > 0) {
    await writeAuditEvent({
      companyId: auth.user.companyId,
      actorUserId: auth.user.id,
      action: "stock_alert_scan",
      reason: `generated:${lowRows.length}`,
    });
  }

  const alerts = await db.$queryRaw<Array<{ id: string; material_id: string; threshold_qty: any; current_qty: any; status: string; triggered_at: Date }>>(
    Prisma.sql`
      SELECT id, material_id, threshold_qty, current_qty, status, triggered_at
      FROM low_stock_alerts
      WHERE company_id = ${auth.user.companyId}
      ORDER BY triggered_at DESC
    `,
  );

  return NextResponse.json({ items: alerts }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}
