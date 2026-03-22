import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  const rows = await db.$queryRaw<Array<{ id: string; name: string; status: string; project_id: string | null; created_at: Date }>>(
    Prisma.sql`
      SELECT id, name, status, project_id, created_at
      FROM inspection_templates
      WHERE company_id = ${auth.user.companyId}
        ${projectId ? Prisma.sql`AND project_id = ${projectId}` : Prisma.empty}
      ORDER BY created_at DESC
    `,
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const projectId = body?.project_id ? String(body.project_id) : null;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!name || items.length === 0) {
    return NextResponse.json({ error: "name and items are required" }, { status: 400 });
  }

  const templateId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO inspection_templates (id, company_id, project_id, name, status, created_by, created_at, updated_at)
        VALUES (${templateId}, ${auth.user!.companyId}, ${projectId}, ${name}, 'active', ${auth.user!.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );

    for (let idx = 0; idx < items.length; idx += 1) {
      const item = items[idx] || {};
      const label = String(item.label || "").trim();
      if (!label) continue;
      const checkType = String(item.check_type || "boolean");

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO inspection_template_items (id, template_id, label, check_type, sort_order, created_at, updated_at)
          VALUES (${randomUUID()}, ${templateId}, ${label}, ${checkType}, ${idx}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `,
      );
    }
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_tpl_create",
    reason: `template:${templateId}`,
  });

  return NextResponse.json({ id: templateId }, { status: 201 });
}