import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { requireActiveSubscriptionForApi } from "@/lib/platform-access/middleware";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const warehouse = await db.warehouse.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
    const { name, location, capacity, isActive } = body as {
      name?: string;
      location?: string | null;
      capacity?: number | string | null;
      isActive?: boolean;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await db.warehouse.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const updated = await db.warehouse.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        location: location ?? null,
        capacity:
          capacity == null || String(capacity) === "" ? null : Number(capacity),
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating warehouse:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
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

    const existing = await db.warehouse.findUnique({
      where: { id: params.id },
      select: { id: true, companyId: true },
    });

    // Idempotent delete: if it's already gone, return success.
    if (!existing) {
      return NextResponse.json({ success: true, alreadyDeleted: true });
    }

    if (existing.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized for this warehouse" }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      await tx.inventory.updateMany({
        where: { warehouseId: params.id },
        data: {
          warehouseId: null,
          updatedAt: new Date(),
        },
      });

      await tx.warehouse.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete this warehouse because it is used in other records." },
        { status: 409 },
      );
    }

    console.error("Error deleting warehouse:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
