import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;
    return await PlatformAdminController.subscriptions();
  } catch (error) {
    console.error("Platform subscriptions overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

