import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId } = await params;

    if (user.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true },
    });

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.companyId !== user.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft-delete: deactivate user
    await db.user.update({
      where: { id: userId },
      data: { active: false, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
