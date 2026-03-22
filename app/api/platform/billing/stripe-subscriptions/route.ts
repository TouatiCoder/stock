import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_billing_stripe_subscriptions");
    if (auth.error || !auth.user) {
      return auth.error;
    }

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || "1");
    const page_size = Number(url.searchParams.get("page_size") || "20");
    const search = url.searchParams.get("search") || undefined;

    return await PlatformAdminController.stripeSubscriptions({
      page,
      page_size,
      search,
    });
  } catch (error) {
    console.error("Platform stripe subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
