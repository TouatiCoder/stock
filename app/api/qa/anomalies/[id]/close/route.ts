import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const correctiveActionId = body?.corrective_action_id ? String(body.corrective_action_id) : null;

  const [anomaly] = await db.$queryRaw<Array<{ company_id: string }>>(
    Prisma.sql`SELECT company_id FROM qa_anomalies WHERE id = ${params.id} LIMIT 1`,
  );

  if (!anomaly || anomaly.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Anomaly not found" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE qa_anomalies
        SET status = 'closed', closed_by = ${auth.user!.id}, closed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
        WHERE id = ${params.id}
      `,
    );

    if (correctiveActionId) {
      await tx.$executeRaw(
        Prisma.sql`
          UPDATE qa_corrective_actions
          SET status = 'completed', completed_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
          WHERE id = ${correctiveActionId} AND anomaly_id = ${params.id}
        `,
      );
    }
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_anom_close",
    reason: `anomaly:${params.id}`,
  });

  if (correctiveActionId) {
    await writeAuditEvent({
      companyId: auth.user.companyId,
      actorUserId: auth.user.id,
      action: "qa_ca_status",
      reason: `corrective:${correctiveActionId}:completed`,
    });
  }

  return NextResponse.json({ success: true });
}