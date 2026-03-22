import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  await db.$executeRaw(
    Prisma.sql`
      UPDATE stock_reservations
      SET status = 'released', released_by = ${auth.user.id}, released_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
      WHERE id = ${params.id} AND company_id = ${auth.user.companyId}
    `,
  );

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "stock_resv_rel",
    reason: `reservation:${params.id}`,
  });

  return NextResponse.json({ success: true });
}