import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { requireActiveSubscriptionForApi } from "@/lib/platform-access/middleware";

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const warehouses = await db.warehouse.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        location: true,
        capacity: true,
        isMain: true,
      },
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await requireActiveSubscriptionForApi({
      companyId: user.companyId,
      isPlatformAdmin: user.isPlatformAdmin,
    });
    if (access.error) return access.error;

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const location = typeof body?.location === "string" ? body.location.trim() : null;
    const capacity = body?.capacity === null || body?.capacity === undefined || body?.capacity === ""
      ? null
      : Number(body.capacity);

    if (!name) {
      return NextResponse.json({ error: "Warehouse name is required" }, { status: 400 });
    }

    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
      return NextResponse.json({ error: "Capacity must be a non-negative number" }, { status: 400 });
    }

    const warehouse = await db.warehouse.create({
      data: {
        name,
        location,
        capacity,
        companyId: user.companyId,
        isMain: false,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
