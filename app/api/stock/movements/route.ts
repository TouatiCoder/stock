import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const materialId = String(body?.material_id || "");
  const movementType = String(body?.movement_type || "").toLowerCase();
  const quantity = Number(body?.quantity || 0);
  const reservationId = body?.reservation_id ? String(body.reservation_id) : null;
  const projectId = body?.project_id ? String(body.project_id) : null;

  if (!materialId || !["in", "out", "adjustment"].includes(movementType) || quantity <= 0) {
    return NextResponse.json({ error: "invalid movement payload" }, { status: 400 });
  }

  if (movementType === "out") {
    if (!reservationId) {
      return NextResponse.json({ error: "reservation_id required for out movement" }, { status: 400 });
    }

    const [reservation] = await db.$queryRaw<Array<{ status: string; quantity: any; material_id: string; company_id: string }>>(
      Prisma.sql`
        SELECT status, quantity, material_id, company_id
        FROM stock_reservations
        WHERE id = ${reservationId}
        LIMIT 1
      `,
    );

    if (!reservation || reservation.company_id !== auth.user.companyId || reservation.status !== "active") {
      return NextResponse.json({ error: "invalid reservation" }, { status: 400 });
    }

    if (reservation.material_id !== materialId || Number(reservation.quantity) < quantity) {
      return NextResponse.json({ error: "reservation does not cover movement" }, { status: 400 });
    }
  }

  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO stock_movements
      (id, project_id, material_id, user_id, movement_type, quantity, description, movement_date)
      VALUES
      (${randomUUID()}, ${projectId}, ${materialId}, ${auth.user.id}, ${movementType}, ${quantity}, ${reservationId ? `reservation:${reservationId}` : null}, UTC_TIMESTAMP())
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "stock_move",
    reason: `material:${materialId}:${movementType}`,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}