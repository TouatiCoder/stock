import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";

/** GET /api/v1/platform/growth?months=12 - monthly signups and collected revenue. */
export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const months = Number(url.searchParams.get("months") || 12);

    return await PlatformAdminController.growth(Number.isFinite(months) ? months : 12);
  } catch (error) {
    console.error("Platform growth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
