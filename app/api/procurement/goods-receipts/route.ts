import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(_req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const rows = await db.$queryRaw<Array<{ id: string; project_id: string; purchase_request_id: string; status: string; created_at: Date }>>(
    Prisma.sql`
      SELECT id, project_id, purchase_request_id, status, created_at
      FROM goods_receipts
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
  const purchaseRequestId = String(body?.purchase_request_id || "");
  const projectId = String(body?.project_id || "");
  const supplierId = body?.supplier_id ? String(body.supplier_id) : null;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!purchaseRequestId || !projectId || items.length === 0) {
    return NextResponse.json({ error: "purchase_request_id, project_id and items are required" }, { status: 400 });
  }

  const [pr] = await db.$queryRaw<Array<{ status: string; company_id: string }>>(
    Prisma.sql`SELECT status, company_id FROM purchase_requests WHERE id = ${purchaseRequestId} LIMIT 1`,
  );

  if (!pr || pr.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
  }

  if (pr.status !== "approved") {
    return NextResponse.json({ error: "Only approved requests can generate receipt" }, { status: 400 });
  }

  const receiptId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO goods_receipts
        (id, company_id, project_id, purchase_request_id, received_by, supplier_id, status, created_at, updated_at)
        VALUES
        (${receiptId}, ${auth.user!.companyId}, ${projectId}, ${purchaseRequestId}, ${auth.user!.id}, ${supplierId}, 'posted', UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );

    for (const item of items) {
      const description = String(item.description || "").trim();
      const quantity = Number(item.quantity || 0);
      if (!description || quantity <= 0) continue;
      const materialId = item.material_id ? String(item.material_id) : null;

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO goods_receipt_items
          (id, goods_receipt_id, material_id, description, quantity, created_at, updated_at)
          VALUES
          (${randomUUID()}, ${receiptId}, ${materialId}, ${description}, ${quantity}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `,
      );
    }
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "gr_posted",
    reason: `goods_receipt:${receiptId}`,
  });

  return NextResponse.json({ id: receiptId }, { status: 201 });
}