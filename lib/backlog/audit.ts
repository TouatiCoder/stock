import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

export async function writeAuditEvent(input: {
  companyId: string;
  actorUserId: string;
  action: string;
  reason?: string | null;
}) {
  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO platform_company_status_events (id, company_id, action, reason, actor_user_id, created_at)
      VALUES (${randomUUID()}, ${input.companyId}, ${input.action.slice(0, 50)}, ${input.reason ?? null}, ${input.actorUserId}, UTC_TIMESTAMP())
    `,
  );
}