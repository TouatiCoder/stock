import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  try {
    const rows = await db.$queryRaw<
      Array<{ id: string; type_code: string; title: string; body_text: string | null; is_read: number; created_at: Date }>
    >(
      Prisma.sql`
        SELECT id, type_code, title, body_text, is_read, created_at
        FROM notifications
        WHERE company_id = ${auth.user.companyId}
          AND (user_id IS NULL OR user_id = ${auth.user.id})
          ${unreadOnly ? Prisma.sql`AND is_read = 0` : Prisma.empty}
        ORDER BY created_at DESC
        LIMIT 100
      `,
    );

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        typeCode: r.type_code,
        title: r.title,
        bodyText: r.body_text,
        isRead: r.is_read === 1,
        createdAt: r.created_at,
      })),
    );
  } catch (error) {
    if (isNotificationsTableMissing(error)) {
      return NextResponse.json([]);
    }
    throw error;
  }
}
