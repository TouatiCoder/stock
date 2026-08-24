import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { assertStatusTransition, requireRoles } from "@/lib/backlog/security";

const STATUS_FLOW: Record<string, string[]> = {
  planning: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const nextStatus = String(body?.status || "").toLowerCase();
  if (!nextStatus) return NextResponse.json({ error: "status required" }, { status: 400 });

  const [project] = await db.$queryRaw<Array<{ status: string; company_id: string }>>(
    Prisma.sql`SELECT status, company_id FROM projects WHERE id = ${params.id} LIMIT 1`,
  );

  if (!project || project.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    assertStatusTransition(project.status, nextStatus, STATUS_FLOW);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid transition" }, { status: 400 });
  }

  await db.$executeRaw(
    Prisma.sql`
      UPDATE projects
      SET status = ${nextStatus}, updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "proj_status",
    reason: `${project.status}->${nextStatus}:project:${params.id}`,
  });

  return NextResponse.json({ success: true });
}