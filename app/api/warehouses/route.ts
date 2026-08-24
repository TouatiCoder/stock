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
    const { name, location, capacity, companyId } = body;

    if (!name || !companyId) {
      return NextResponse.json({ error: "Name and Company ID are required" }, { status: 400 });
    }
    
    // Ensure user belongs to the company
    if (user.companyId !== companyId) {
        return NextResponse.json({ error: "Unauthorized for this company" }, { status: 403 });
    }

    const warehouse = await db.warehouse.create({
      data: {
        name,
        location,
        capacity: capacity ? Number(capacity) : null,
        companyId,
        isMain: false,
        isActive: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
