import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function PUT(req: Request, { params }: { params: { id: string; milestoneId: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "").trim();
  const status = String(body?.status || "pending");
  const notes = body?.notes ? String(body.notes) : null;
  const dueDate = body?.due_date ? new Date(body.due_date as string) : null;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  await db.$executeRaw(
    Prisma.sql`
      UPDATE project_milestones
      SET title = ${title}, status = ${status}, notes = ${notes}, due_date = ${dueDate}, updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.milestoneId} AND project_id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "ms_update",
    reason: `milestone:${params.milestoneId}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; milestoneId: string } }) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  await db.$executeRaw(
    Prisma.sql`
      DELETE FROM project_milestones
      WHERE id = ${params.milestoneId} AND project_id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "ms_delete",
    reason: `milestone:${params.milestoneId}`,
  });

  return NextResponse.json({ success: true });
}