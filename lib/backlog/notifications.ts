import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

function isNotificationsTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const prismaError = error as { code?: string; meta?: { code?: string; message?: string } };
  return (
    prismaError.code === "P2010" &&
    prismaError.meta?.code === "1146" &&
    (prismaError.meta?.message ?? "").toLowerCase().includes("notifications")
  );
}

export async function createNotification(input: {
  companyId: string;
  userId?: string | null;
  typeCode: string;
  title: string;
  bodyText?: string | null;
}) {
  try {
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO notifications (id, company_id, user_id, type_code, title, body_text, is_read, created_at)
        VALUES (${randomUUID()}, ${input.companyId}, ${input.userId ?? null}, ${input.typeCode}, ${input.title}, ${input.bodyText ?? null}, 0, UTC_TIMESTAMP())
      `,
    );
  } catch (error) {
    if (!isNotificationsTableMissing(error)) {
      throw error;
    }
  }
}

export async function listCompanyAdminUserIds(companyId: string): Promise<string[]> {
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM users
    WHERE company_id = ${companyId}
      AND role = 'admin'
      AND active = 1
  `);
  return rows.map((r) => r.id);
}

export async function notifyAdmins(companyId: string, typeCode: string, title: string, bodyText?: string) {
  const adminIds = await listCompanyAdminUserIds(companyId);
  if (adminIds.length === 0) {
    await createNotification({ companyId, typeCode, title, bodyText });
    return;
  }

  await Promise.all(
    adminIds.map((userId) =>
      createNotification({
        companyId,
        userId,
        typeCode,
        title,
        bodyText,
      }),
    ),
  );
}
