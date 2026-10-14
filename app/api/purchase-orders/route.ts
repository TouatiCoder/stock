import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const limit = Number(url.searchParams.get("limit") || "50");

  try {
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const orders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(orders, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  try {
    const body = await req.json();
    const { supplierId, orderDate, expectedDelivery, notes } = body;

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
    }

    const count = await db.purchaseOrder.count({ where: { companyId: auth.user.companyId } });
    const orderNumber = `PO-${String(count + 1).padStart(5, "0")}`;

    const order = await db.purchaseOrder.create({
      data: {
        orderNumber,
        status: "pending",
        supplierId,
        companyId: auth.user.companyId,
        createdById: auth.user.id,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        updatedAt: new Date(),
      },
      include: { supplier: { select: { id: true, name: true } } },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
