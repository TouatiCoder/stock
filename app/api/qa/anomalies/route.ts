import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { createNotification } from "@/lib/backlog/notifications";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const rows = await db.$queryRaw<Array<{ id: string; title: string; status: string; severity: string; project_id: string; assigned_to: string | null; created_at: Date }>>(
    Prisma.sql`
      SELECT id, title, status, severity, project_id, assigned_to, created_at
      FROM qa_anomalies
      WHERE company_id = ${auth.user.companyId}
        ${status ? Prisma.sql`AND status = ${status}` : Prisma.empty}
      ORDER BY created_at DESC
    `,
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const inspectionResultId = String(body?.inspection_result_id || "");
  const title = String(body?.title || "").trim();
  const severity = String(body?.severity || "medium");

  if (!inspectionResultId || !title) {
    return NextResponse.json({ error: "inspection_result_id and title are required" }, { status: 400 });
  }

  const [row] = await db.$queryRaw<Array<{ inspection_id: string; project_id: string; company_id: string }>>(
    Prisma.sql`
      SELECT ir.inspection_id, i.project_id, i.company_id
      FROM inspection_results ir
      JOIN inspections i ON i.id = ir.inspection_id
      WHERE ir.id = ${inspectionResultId}
      LIMIT 1
    `,
  );

  if (!row || row.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Inspection result not found" }, { status: 404 });
  }

  const anomalyId = randomUUID();
  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO qa_anomalies
      (id, company_id, project_id, inspection_id, inspection_result_id, title, status, severity, created_by, created_at, updated_at)
      VALUES
      (${anomalyId}, ${auth.user.companyId}, ${row.project_id}, ${row.inspection_id}, ${inspectionResultId}, ${title}, 'open', ${severity}, ${auth.user.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_anom_create",
    reason: `anomaly:${anomalyId}`,
  });

  await createNotification({
    companyId: auth.user.companyId,
    typeCode: "anomaly_created",
    title: "New QA anomaly created",
    bodyText: title,
  });

  return NextResponse.json({ id: anomalyId }, { status: 201 });
}