import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { createNotification } from "@/lib/backlog/notifications";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const [session] = await db.$queryRaw<Array<{ id: string; company_id: string; status: string }>>(
    Prisma.sql`SELECT id, company_id, status FROM stock_count_sessions WHERE id = ${params.id} LIMIT 1`,
  );

  if (!session || session.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Count session not found" }, { status: 404 });
  }

  if (session.status !== "draft") {
    return NextResponse.json({ error: "Session already posted" }, { status: 400 });
  }

  const items = await db.$queryRaw<Array<{ material_id: string; variance_qty: any }>>(
    Prisma.sql`SELECT material_id, variance_qty FROM stock_count_items WHERE session_id = ${params.id}`,
  );

  await db.$transaction(async (tx) => {
    for (const item of items) {
      const variance = Number(item.variance_qty || 0);
      if (variance === 0) continue;

      const [inventoryRow] = await tx.$queryRaw<Array<{ id: string; quantity: any; min_threshold: any }>>(
        Prisma.sql`
          SELECT id, quantity, min_threshold
          FROM inventory
          WHERE company_id = ${auth.user!.companyId} AND material_id = ${item.material_id}
          ORDER BY created_at ASC
          LIMIT 1
        `,
      );

      if (!inventoryRow) {
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO inventory (id, quantity, min_threshold, material_id, warehouse_id, company_id, created_at, updated_at)
            VALUES (${randomUUID()}, ${variance > 0 ? variance : 0}, 0, ${item.material_id}, NULL, ${auth.user!.companyId}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
          `,
        );
      } else {
        const nextQty = Number(inventoryRow.quantity || 0) + variance;
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE inventory
            SET quantity = ${nextQty}, updated_at = UTC_TIMESTAMP()
            WHERE id = ${inventoryRow.id}
          `,
        );

        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO stock_adjustments (id, company_id, material_id, adjustment_qty, reason, source_session_id, created_by, created_at)
            VALUES (${randomUUID()}, ${auth.user!.companyId}, ${item.material_id}, ${variance}, 'count_variance', ${params.id}, ${auth.user!.id}, UTC_TIMESTAMP())
          `,
        );

        if (nextQty <= Number(inventoryRow.min_threshold || 0)) {
          await tx.$executeRaw(
            Prisma.sql`
              INSERT INTO low_stock_alerts (id, company_id, material_id, threshold_qty, current_qty, status, triggered_at)
              VALUES (${randomUUID()}, ${auth.user!.companyId}, ${item.material_id}, ${Number(inventoryRow.min_threshold || 0)}, ${nextQty}, 'open', UTC_TIMESTAMP())
            `,
          );

          await createNotification({
            companyId: auth.user!.companyId,
            typeCode: "low_stock",
            title: "Low stock alert",
            bodyText: `Material ${item.material_id} is below threshold`,
          });

          await writeAuditEvent({
            companyId: auth.user!.companyId,
            actorUserId: auth.user!.id,
            action: "stock_alert",
            reason: `material:${item.material_id}`,
          });
        }
      }
    }

    await tx.$executeRaw(
      Prisma.sql`
        UPDATE stock_count_sessions
        SET status = 'posted', posted_by = ${auth.user!.id}, posted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
        WHERE id = ${params.id}
      `,
    );
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "count_post",
    reason: `session:${params.id}`,
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "stock_adjust",
    reason: `session:${params.id}`,
  });

  return NextResponse.json({ success: true });
}