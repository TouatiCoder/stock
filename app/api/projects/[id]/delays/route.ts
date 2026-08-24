import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { createNotification } from "@/lib/backlog/notifications";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const rows = await db.$queryRaw<Array<{ id: string; reason: string; days_delayed: number; created_at: Date }>>(
    Prisma.sql`
      SELECT id, reason, days_delayed, created_at
      FROM project_delay_logs
      WHERE company_id = ${auth.user.companyId} AND project_id = ${params.id}
      ORDER BY created_at DESC
    `,
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason || "").trim();
  const daysDelayed = Number(body?.days_delayed || 0);

  if (!reason || daysDelayed < 0) {
    return NextResponse.json({ error: "reason and valid days_delayed are required" }, { status: 400 });
  }

  const delayId = randomUUID();
  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO project_delay_logs (id, company_id, project_id, reason, days_delayed, logged_by, created_at)
      VALUES (${delayId}, ${auth.user.companyId}, ${params.id}, ${reason}, ${Math.floor(daysDelayed)}, ${auth.user.id}, UTC_TIMESTAMP())
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "proj_delay",
    reason: `delay:${delayId}`,
  });

  await createNotification({
    companyId: auth.user.companyId,
    typeCode: "project_delayed",
    title: "Project delay logged",
    bodyText: reason,
  });

  return NextResponse.json({ id: delayId }, { status: 201 });
}