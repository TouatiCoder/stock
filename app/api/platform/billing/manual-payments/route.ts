import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";

export async function GET(req: Request) {
  const auth = await requirePlatformAdminWithRateLimit(req, "platform_manual_payments_list");
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const rows = await db.planPayment.findMany({
    where: {
      method: { in: ["cash", "paypal"] },
      ...(status ? { status } : {}),
    },
    include: {
      company: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      confirmedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ items: rows });
}
