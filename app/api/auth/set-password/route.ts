import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { enforceMaxUsers, featureDeniedResponse, featureGateService, FEATURE_CODES } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { resetToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (!user.active) {
      const maxUsers = await enforceMaxUsers(user.companyId, 1);
      if (!maxUsers.gate.allowed) {
        return featureDeniedResponse(
          maxUsers.gate,
          "Active user limit reached for your current subscription plan",
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        active: true,
        updatedAt: now,
      },
    });

    if (!user.active) {
      await featureGateService.incrementUsage(user.companyId, FEATURE_CODES.MAX_USERS, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
