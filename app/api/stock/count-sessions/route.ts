import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const rows = await db.$queryRaw<Array<{ id: string; status: string; created_at: Date; posted_at: Date | null }>>(
    Prisma.sql`
      SELECT id, status, created_at, posted_at
      FROM stock_count_sessions
      WHERE company_id = ${auth.user.companyId}
      ORDER BY created_at DESC
    `,
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const warehouseId = body?.warehouse_id ? String(body.warehouse_id) : null;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (items.length === 0) return NextResponse.json({ error: "items are required" }, { status: 400 });

  const sessionId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO stock_count_sessions
        (id, company_id, warehouse_id, status, created_by, created_at, updated_at)
        VALUES
        (${sessionId}, ${auth.user!.companyId}, ${warehouseId}, 'draft', ${auth.user!.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );

    for (const entry of items) {
      const materialId = String(entry.material_id || "");
      const countedQty = Number(entry.counted_qty || 0);
      const systemQty = Number(entry.system_qty || 0);
      const varianceQty = countedQty - systemQty;
      if (!materialId) continue;

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO stock_count_items
          (id, session_id, material_id, system_qty, counted_qty, variance_qty, created_at, updated_at)
          VALUES
          (${randomUUID()}, ${sessionId}, ${materialId}, ${systemQty}, ${countedQty}, ${varianceQty}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `,
      );
    }
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "count_create",
    reason: `session:${sessionId}`,
  });

  return NextResponse.json({ id: sessionId }, { status: 201 });
}
