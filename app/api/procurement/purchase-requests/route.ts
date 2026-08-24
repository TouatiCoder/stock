import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { notifyAdmins } from "@/lib/backlog/notifications";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const rows = await db.$queryRaw<Array<{ id: string; project_id: string; status: string; notes: string | null; created_at: Date }>>(
    Prisma.sql`
      SELECT id, project_id, status, notes, created_at
      FROM purchase_requests
      WHERE company_id = ${auth.user.companyId}
        ${status ? Prisma.sql`AND status = ${status}` : Prisma.empty}
      ORDER BY created_at DESC
    `,
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const projectId = String(body?.project_id || "");
  const notes = body?.notes ? String(body.notes) : null;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!projectId || items.length === 0) {
    return NextResponse.json({ error: "project_id and items are required" }, { status: 400 });
  }

  const requestId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO purchase_requests (id, company_id, project_id, requested_by, status, notes, created_at, updated_at)
        VALUES (${requestId}, ${auth.user!.companyId}, ${projectId}, ${auth.user!.id}, 'pending', ${notes}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );

    for (const item of items) {
      const description = String(item.description || "").trim();
      const quantity = Number(item.quantity || 0);
      if (!description || quantity <= 0) continue;

      const materialId = item.material_id ? String(item.material_id) : null;
      const unitPrice = item.unit_price == null ? null : Number(item.unit_price);

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO purchase_request_items
          (id, purchase_request_id, material_id, description, quantity, unit_price, created_at, updated_at)
          VALUES
          (${randomUUID()}, ${requestId}, ${materialId}, ${description}, ${quantity}, ${unitPrice}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `,
      );
    }
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "pr_submit",
    reason: `purchase_request:${requestId}`,
  });

  await notifyAdmins(
    auth.user.companyId,
    "approval_pending",
    "Purchase request pending approval",
    `Request ${requestId} awaiting decision`,
  );

  return NextResponse.json({ id: requestId }, { status: 201 });
}