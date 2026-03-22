import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const projectId = String(body?.project_id || "");
  const materialId = String(body?.material_id || "");
  const quantity = Number(body?.quantity || 0);

  if (!projectId || !materialId || quantity <= 0) {
    return NextResponse.json({ error: "project_id, material_id and positive quantity are required" }, { status: 400 });
  }

  const reservationId = randomUUID();
  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO stock_reservations
      (id, company_id, project_id, material_id, quantity, status, created_by, created_at, updated_at)
      VALUES
      (${reservationId}, ${auth.user.companyId}, ${projectId}, ${materialId}, ${quantity}, 'active', ${auth.user.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "stock_resv_create",
    reason: `reservation:${reservationId}`,
  });

  return NextResponse.json({ id: reservationId }, { status: 201 });
}