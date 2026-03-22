import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const progressPct = Number(body?.progress_pct);

  if (!Number.isFinite(progressPct) || progressPct < 0 || progressPct > 100) {
    return NextResponse.json({ error: "progress_pct must be between 0 and 100" }, { status: 400 });
  }

  await db.$executeRaw(
    Prisma.sql`
      UPDATE projects
      SET progress_pct = ${Math.round(progressPct)}, updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "proj_progress",
    reason: `project:${params.id}:${Math.round(progressPct)}`,
  });

  return NextResponse.json({ success: true });
}