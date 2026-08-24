import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdminWithRateLimit(req, "platform_manual_payments_reject");
  if (auth.error || !auth.user) return auth.error;

  const payment = await db.planPayment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Payment request is not pending" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 255) : null;

  await db.planPayment.update({
    where: { id: payment.id },
    data: {
      status: "rejected",
      confirmedById: auth.user.id,
      rejectedReason: reason,
    },
  });

  return NextResponse.json({ success: true });
}
