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

  const rows = await db.$queryRaw<Array<{ id: string; title: string; status: string; project_id: string; template_id: string; created_at: Date }>>(
    Prisma.sql`
      SELECT id, title, status, project_id, template_id, created_at
      FROM inspections
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
  const projectId = String(body?.project_id || "");
  const templateId = String(body?.template_id || "");
  const title = String(body?.title || "Inspection").trim();

  if (!projectId || !templateId) {
    return NextResponse.json({ error: "project_id and template_id are required" }, { status: 400 });
  }

  const inspectionId = randomUUID();
  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO inspections (id, company_id, project_id, template_id, title, status, created_by, created_at, updated_at)
      VALUES (${inspectionId}, ${auth.user.companyId}, ${projectId}, ${templateId}, ${title}, 'draft', ${auth.user.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `,
  );

  const templateItems = await db.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id FROM inspection_template_items WHERE template_id = ${templateId}`,
  );

  for (const item of templateItems) {
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO inspection_results (id, inspection_id, template_item_id, result_status, notes, recorded_by, created_at, updated_at)
        VALUES (${randomUUID()}, ${inspectionId}, ${item.id}, 'pending', NULL, ${auth.user.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );
  }

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_insp_create",
    reason: `inspection:${inspectionId}`,
  });

  return NextResponse.json({ id: inspectionId }, { status: 201 });
}