import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const [inspection] = await db.$queryRaw<Array<{ id: string; status: string; company_id: string }>>(
    Prisma.sql`SELECT id, status, company_id FROM inspections WHERE id = ${params.id} LIMIT 1`,
  );
  if (!inspection || inspection.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  const rows = await db.$queryRaw<Array<{ id: string; template_item_id: string; result_status: string; notes: string | null }>>(
    Prisma.sql`SELECT id, template_item_id, result_status, notes FROM inspection_results WHERE inspection_id = ${params.id}`,
  );

  return NextResponse.json({ items: rows, status: inspection.status });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const results = Array.isArray(body?.results) ? body.results : [];

  if (results.length === 0) return NextResponse.json({ error: "results required" }, { status: 400 });

  const [inspection] = await db.$queryRaw<Array<{ id: string; status: string; company_id: string }>>(
    Prisma.sql`SELECT id, status, company_id FROM inspections WHERE id = ${params.id} LIMIT 1`,
  );

  if (!inspection || inspection.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  if (!["draft", "in_review"].includes(inspection.status)) {
    return NextResponse.json({ error: "Inspection cannot be edited in current status" }, { status: 400 });
  }

  for (const entry of results) {
    const resultId = String(entry.id || "");
    const status = String(entry.result_status || "pending");
    const notes = entry.notes ? String(entry.notes) : null;

    await db.$executeRaw(
      Prisma.sql`
        UPDATE inspection_results
        SET result_status = ${status}, notes = ${notes}, recorded_by = ${auth.user.id}, updated_at = UTC_TIMESTAMP()
        WHERE id = ${resultId} AND inspection_id = ${params.id}
      `,
    );
  }

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_result",
    reason: `inspection:${params.id}`,
  });

  return NextResponse.json({ success: true });
}
