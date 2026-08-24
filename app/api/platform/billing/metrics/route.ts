import { NextResponse } from "next/server";
import { billingMetricsService } from "@/lib/billing/metrics.service";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_billing_metrics");
    if (auth.error || !auth.user) {
      return auth.error;
    }

    const metrics = await billingMetricsService.getPlatformMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Platform billing metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
