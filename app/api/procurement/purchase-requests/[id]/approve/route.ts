import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const decision = String(body?.decision || "").toLowerCase();
  const comment = body?.comment ? String(body.comment) : null;

  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "decision must be approved or rejected" }, { status: 400 });
  }

  const [pr] = await db.$queryRaw<Array<{ company_id: string; status: string }>>(
    Prisma.sql`SELECT company_id, status FROM purchase_requests WHERE id = ${params.id} LIMIT 1`,
  );

  if (!pr || pr.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE purchase_requests
        SET status = ${decision}, updated_at = UTC_TIMESTAMP()
        WHERE id = ${params.id}
      `,
    );

    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO purchase_request_approvals (id, purchase_request_id, approved_by, decision, comment_text, created_at)
        VALUES (${randomUUID()}, ${params.id}, ${auth.user!.id}, ${decision}, ${comment}, UTC_TIMESTAMP())
      `,
    );
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: decision === "approved" ? "pr_approve" : "pr_reject",
    reason: `purchase_request:${params.id}`,
  });

  return NextResponse.json({ success: true });
}