import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { AuthService } from "@/lib/mysql/auth-service";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await AuthService.getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        ...user,
        role: user.role || "user",
        isPlatformAdmin: Boolean((user as any).isPlatformAdmin),
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};
    if (typeof body.firstName === "string") data.firstName = body.firstName;
    if (typeof body.lastName === "string") data.lastName = body.lastName;
    if (typeof body.phone === "string") data.phone = body.phone;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    data.updatedAt = new Date();
    const user = await db.user.update({
      where: { id: payload.userId },
      data,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role || "user",
        companyId: user.companyId,
        isPlatformAdmin: Boolean((user as any).isPlatformAdmin),
        phone: user.phone || undefined,
      },
    });
  } catch (error) {
    console.error("Auth Me Update Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
