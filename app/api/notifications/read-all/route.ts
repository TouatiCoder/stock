import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

function isNotificationsTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const prismaError = error as { code?: string; meta?: { code?: string; message?: string } };
  return (
    prismaError.code === "P2010" &&
    prismaError.meta?.code === "1146" &&
    (prismaError.meta?.message ?? "").toLowerCase().includes("notifications")
  );
}

export async function POST() {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  try {
    await db.$executeRaw(
      Prisma.sql`
        UPDATE notifications
        SET is_read = 1, read_at = UTC_TIMESTAMP()
        WHERE company_id = ${auth.user.companyId}
          AND (user_id IS NULL OR user_id = ${auth.user.id})
          AND is_read = 0
      `,
    );
  } catch (error) {
    if (!isNotificationsTableMissing(error)) {
      throw error;
    }
  }

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "notif_read_all",
    reason: "notifications",
  });

  return NextResponse.json({ success: true });
}
