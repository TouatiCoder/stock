import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { createNotification } from "@/lib/backlog/notifications";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const assignedTo = body?.assigned_to ? String(body.assigned_to) : null;
  const actionText = String(body?.action_text || "").trim();
  const dueAt = body?.due_at ? new Date(body.due_at as string) : null;
  const status = String(body?.status || "open");

  if (!actionText) {
    return NextResponse.json({ error: "action_text is required" }, { status: 400 });
  }

  const [anomaly] = await db.$queryRaw<Array<{ company_id: string; project_id: string; status: string }>>(
    Prisma.sql`SELECT company_id, project_id, status FROM qa_anomalies WHERE id = ${params.id} LIMIT 1`,
  );

  if (!anomaly || anomaly.company_id !== auth.user.companyId) {
    return NextResponse.json({ error: "Anomaly not found" }, { status: 404 });
  }

  const correctiveId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE qa_anomalies
        SET assigned_to = ${assignedTo}, updated_at = UTC_TIMESTAMP()
        WHERE id = ${params.id}
      `,
    );

    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO qa_corrective_actions
        (id, anomaly_id, company_id, project_id, action_text, status, assigned_to, due_at, created_by, created_at, updated_at)
        VALUES
        (${correctiveId}, ${params.id}, ${auth.user!.companyId}, ${anomaly.project_id}, ${actionText}, ${status}, ${assignedTo}, ${dueAt}, ${auth.user!.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_anom_assign",
    reason: `anomaly:${params.id}`,
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "qa_ca_status",
    reason: `corrective:${correctiveId}:${status}`,
  });

  if (assignedTo) {
    await createNotification({
      companyId: auth.user.companyId,
      userId: assignedTo,
      typeCode: "corrective_assigned",
      title: "Corrective action assigned",
      bodyText: actionText,
    });
  }

  return NextResponse.json({ id: correctiveId }, { status: 201 });
}