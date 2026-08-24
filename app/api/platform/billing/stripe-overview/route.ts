import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_billing_stripe_overview");
    if (auth.error || !auth.user) {
      return auth.error;
    }

    return await PlatformAdminController.stripeOverview();
  } catch (error) {
    console.error("Platform stripe overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
