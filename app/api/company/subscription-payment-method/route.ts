import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { db } from "@/lib/db";

const ALLOWED_METHODS = new Set(["stripe", "paypal", "bank_transfer"]);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, companyId: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const company = await db.company.findUnique({
      where: { id: user.companyId },
      select: { subscriptionPaymentMethod: true },
    });

    return NextResponse.json({
      payment_method: company?.subscriptionPaymentMethod || "stripe",
    });
  } catch (error) {
    console.error("Get subscription payment method error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, companyId: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const paymentMethod = typeof body?.payment_method === "string" ? body.payment_method : "";

    if (!ALLOWED_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const updated = await db.company.update({
      where: { id: user.companyId },
      data: {
        subscriptionPaymentMethod: paymentMethod,
      },
      select: { subscriptionPaymentMethod: true },
    });

    return NextResponse.json({
      payment_method: updated.subscriptionPaymentMethod || "stripe",
    });
  } catch (error) {
    console.error("Update subscription payment method error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

