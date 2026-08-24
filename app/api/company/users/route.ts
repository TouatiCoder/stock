import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await db.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        active: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((u) => ({ ...u, isActive: u.active }))
    );
  } catch (error) {
    console.error("Fetch company users error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
