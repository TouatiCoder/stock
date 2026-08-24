import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/backlog/audit";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(_req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const rows = await db.$queryRaw<Array<{ id: string; project_id: string; invoice_number: string; amount: any; currency: string; issued_at: Date | null; created_at: Date }>>(
    Prisma.sql`
      SELECT id, project_id, invoice_number, amount, currency, issued_at, created_at
      FROM supplier_invoices
      WHERE company_id = ${auth.user.companyId}
      ORDER BY created_at DESC
    `,
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const projectId = String(body?.project_id || "");
  const goodsReceiptId = body?.goods_receipt_id ? String(body.goods_receipt_id) : null;
  const supplierId = body?.supplier_id ? String(body.supplier_id) : null;
  const invoiceNumber = String(body?.invoice_number || "").trim();
  const amount = Number(body?.amount || 0);
  const currency = String(body?.currency || "MAD");
  const issuedAt = body?.issued_at ? new Date(body.issued_at as string) : null;

  if (!projectId || !invoiceNumber || amount <= 0) {
    return NextResponse.json({ error: "project_id, invoice_number and positive amount are required" }, { status: 400 });
  }

  const invoiceId = randomUUID();
  const expenseId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO supplier_invoices
        (id, company_id, project_id, goods_receipt_id, supplier_id, invoice_number, amount, currency, issued_at, created_by, created_at, updated_at)
        VALUES
        (${invoiceId}, ${auth.user!.companyId}, ${projectId}, ${goodsReceiptId}, ${supplierId}, ${invoiceNumber}, ${amount}, ${currency}, ${issuedAt}, ${auth.user!.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );

    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO project_expenses
        (id, company_id, project_id, supplier_invoice_id, category, description, amount, created_by, created_at, updated_at)
        VALUES
        (${expenseId}, ${auth.user!.companyId}, ${projectId}, ${invoiceId}, 'procurement', ${`Supplier invoice ${invoiceNumber}`}, ${amount}, ${auth.user!.id}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "invoice_create",
    reason: `invoice:${invoiceId}`,
  });

  await writeAuditEvent({
    companyId: auth.user.companyId,
    actorUserId: auth.user.id,
    action: "expense_link",
    reason: `expense:${expenseId}`,
  });

  return NextResponse.json({ invoice_id: invoiceId, expense_id: expenseId }, { status: 201 });
}