import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20;

    const where: any = { companyId };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          phone: true,
          active: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
      })),
      total,
      limit,
      hasMore: users.length < total,
    });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
