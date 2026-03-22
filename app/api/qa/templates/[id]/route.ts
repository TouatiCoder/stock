import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const [template] = await db.$queryRaw<Array<{ id: string; name: string; status: string; project_id: string | null }>>(
    Prisma.sql`
      SELECT id, name, status, project_id
      FROM inspection_templates
      WHERE id = ${params.id} AND company_id = ${auth.user.companyId}
      LIMIT 1
    `,
  );

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const items = await db.$queryRaw<Array<{ id: string; label: string; check_type: string; sort_order: number }>>(
    Prisma.sql`
      SELECT id, label, check_type, sort_order
      FROM inspection_template_items
      WHERE template_id = ${params.id}
      ORDER BY sort_order ASC
    `,
  );

  return NextResponse.json({ ...template, items });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const status = String(body?.status || "active");

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  await db.$executeRaw(
    Prisma.sql`
      UPDATE inspection_templates
      SET name = ${name}, status = ${status}, updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_tpl_update",
    reason: `template:${params.id}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  await db.$executeRaw(
    Prisma.sql`
      DELETE FROM inspection_templates
      WHERE id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_tpl_delete",
    reason: `template:${params.id}`,
  });

  return NextResponse.json({ success: true });
}