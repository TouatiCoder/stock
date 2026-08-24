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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const decision = String(body?.decision || "").toLowerCase();
  const rejectionReason = body?.rejection_reason ? String(body.rejection_reason) : null;

  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "decision must be approved or rejected" }, { status: 400 });
  }

  const [inspection] = await db.$queryRaw<Array<{ status: string; company_id: string }>>(
    Prisma.sql`SELECT status, company_id FROM inspections WHERE id = ${params.id} LIMIT 1`,
  );

  if (!inspection || inspection.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  try {
    assertStatusTransition(inspection.status, decision, FLOW);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid transition" }, { status: 400 });
  }

  await db.$executeRaw(
    Prisma.sql`
      UPDATE inspections
      SET status = ${decision}, approved_by = ${auth.user.id}, approved_at = UTC_TIMESTAMP(), rejection_reason = ${decision === "rejected" ? rejectionReason : null}, updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.id}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: decision === "approved" ? "qa_insp_approve" : "qa_insp_reject",
    reason: `inspection:${params.id}`,
  });

  return NextResponse.json({ success: true });
}