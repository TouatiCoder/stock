import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { assertStatusTransition, requireRoles } from "@/lib/backlog/security";

const FLOW: Record<string, string[]> = {
  draft: ["in_review"],
  in_review: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const [inspection] = await db.$queryRaw<Array<{ id: string; status: string; company_id: string }>>(
    Prisma.sql`SELECT id, status, company_id FROM inspections WHERE id = ${params.id} LIMIT 1`,
  );
  if (!inspection || inspection.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  try {
    assertStatusTransition(inspection.status, "in_review", FLOW);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid transition" }, { status: 400 });
  }

  await db.$executeRaw(
    Prisma.sql`
      UPDATE inspections
      SET status = 'in_review', submitted_by = ${auth.user.id}, updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.id}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_insp_submit",
    reason: `inspection:${params.id}`,
  });

  return NextResponse.json({ success: true });
}