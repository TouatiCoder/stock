import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const rows = await db.$queryRaw<Array<{ id: string; title: string; due_date: Date | null; status: string; notes: string | null; created_at: Date }>>(
    Prisma.sql`
      SELECT id, title, due_date, status, notes, created_at
      FROM project_milestones
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
  const title = String(body?.title || "").trim();
  const dueDate = body?.due_date ? new Date(body.due_date as string) : null;
  const notes = body?.notes ? String(body.notes) : null;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const milestoneId = randomUUID();

  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO project_milestones
      (id, company_id, project_id, title, due_date, status, notes, created_by, created_at, updated_at)
      VALUES
      (${milestoneId}, ${auth.user.companyId}, ${params.id}, ${title}, ${dueDate}, 'pending', ${notes}, ${auth.user.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "ms_create",
    reason: `milestone:${milestoneId}`,
  });

  return NextResponse.json({ id: milestoneId }, { status: 201 });
}