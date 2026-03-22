import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { isValidAuthMethod } from "@/lib/auth/webauthn";

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { authMethod: true, _count: { select: { webauthnCredentials: true } } },
    });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      authMethod: dbUser.authMethod,
      hasBiometric: dbUser._count.webauthnCredentials > 0,
    });
  } catch (error) {
    console.error("Security method GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const authMethod = body?.authMethod;

    if (!isValidAuthMethod(authMethod)) {
      return NextResponse.json({ error: "Invalid auth method" }, { status: 400 });
    }

    const credsCount = await db.webAuthnCredential.count({ where: { userId: user.id } });
    if ((authMethod === "biometric_only" || authMethod === "biometric_password") && credsCount === 0) {
      return NextResponse.json({ error: "Register a biometric credential first" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { authMethod },
      select: { authMethod: true },
    });

    return NextResponse.json({ success: true, authMethod: updated.authMethod, hasBiometric: credsCount > 0 });
  } catch (error) {
    console.error("Security method PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
