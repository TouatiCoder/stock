import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

interface RouteContext {
  params: { id: string };
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const order = await db.purchaseOrder.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: {
        supplier: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: { include: { material: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const existing = await db.purchaseOrder.findFirst({
      where: { id: params.id, companyId: user.companyId },
      select: { id: true },
    });

    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const data: Record<string, unknown> = { updatedAt: new Date() };

    if (body.status !== undefined) {
      const allowedStatuses = ["draft", "pending", "approved", "ordered", "partially_delivered", "delivered", "cancelled"];
      if (typeof body.status !== "string" || !allowedStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      data.status = body.status;
    }

    if (body.orderDate !== undefined) {
      const date = parseDate(body.orderDate);
      if (date === null && body.orderDate !== null && body.orderDate !== "") {
        return NextResponse.json({ error: "Invalid order date" }, { status: 400 });
      }
      data.orderDate = date ?? null;
    }

    if (body.expectedDelivery !== undefined) {
      const date = parseDate(body.expectedDelivery);
      if (date === null && body.expectedDelivery !== null && body.expectedDelivery !== "") {
        return NextResponse.json({ error: "Invalid expected delivery date" }, { status: 400 });
      }
      data.expectedDelivery = date ?? null;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes === null ? null : String(body.notes);
    }

    if (body.totalAmount !== undefined) {
      const amount = Number(body.totalAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
      }
      data.totalAmount = amount;
    }

    const updated = await db.purchaseOrder.update({
      where: { id: existing.id },
      data: data as any,
      include: { supplier: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const order = await db.purchaseOrder.findFirst({
      where: { id: params.id, companyId: user.companyId },
      select: { id: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await db.$transaction([
      db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: order.id } }),
      db.purchaseOrder.delete({ where: { id: order.id } }),
    ]);

    return NextResponse.json({ success: true, id: order.id });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
