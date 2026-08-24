import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    const user = await db.user.findFirst({
      where: {
        id: payload.userId,
        active: true,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
