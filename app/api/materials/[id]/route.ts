import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const material = await db.material.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      select: { id: true },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.inventory.deleteMany({
        where: { materialId: params.id },
      });

      await tx.material.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete this material because it is used in other records." },
        { status: 409 },
      );
    }

    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
