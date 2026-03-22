import { NextResponse } from "next/server";
import { getDb } from "@/lib/mysql/connection"; // Updated import to use MySQL connection
import { verifyToken } from "@/lib/utils/edge-jwt";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    // 1. معرفة شركة المدير الحالي
    const currentUserResult = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [payload.userId]
    );

    if (currentUserResult.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const currentUser = currentUserResult.rows[0];

    // 2. جلب جميع المستخدمين في نفس الشركة
    const usersResult = await db.query(
      'SELECT id, email, first_name as firstName, last_name as lastName, role, active as isActive, created_at as createdAt FROM users WHERE company_id = ? ORDER BY created_at DESC',
      [currentUser.company_id]
    );

    return NextResponse.json(usersResult.rows);

  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}