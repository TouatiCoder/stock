import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const rows = await db.$queryRaw<Array<{ request_id: string; request_status: string; invoice_count: any; expense_total: any }>>(
    Prisma.sql`
      SELECT
        pr.id AS request_id,
        pr.status AS request_status,
        COALESCE((SELECT COUNT(*) FROM supplier_invoices si WHERE si.project_id = pr.project_id), 0) AS invoice_count,
        COALESCE((SELECT SUM(pe.amount) FROM project_expenses pe WHERE pe.project_id = pr.project_id), 0) AS expense_total
      FROM purchase_requests pr
      WHERE pr.company_id = ${auth.user.companyId}
      ORDER BY pr.created_at DESC
      LIMIT 1000
    `,
  );

  const header = "request_id,request_status,invoice_count,expense_total";
  const lines = rows.map((r) => [r.request_id, r.request_status, Number(r.invoice_count || 0), Number(r.expense_total || 0)].join(","));
  const csv = [header, ...lines].join("\n");

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "export_proc",
    reason: "procurement-summary.csv",
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=procurement-summary.csv",
    },
  });
}