import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const credentials = await db.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: { id: true, deviceType: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ credentials, hasBiometric: credentials.length > 0 });
  } catch (error) {
    console.error("WebAuthn credentials GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await db.$transaction([
      db.webAuthnCredential.deleteMany({ where: { userId: user.id } }),
      db.webAuthnChallenge.deleteMany({ where: { userId: user.id } }),
      db.user.update({ where: { id: user.id }, data: { authMethod: "password_only" } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WebAuthn credentials DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
