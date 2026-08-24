import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";
import type { CompanyStatusFilter } from "@/lib/platform-admin/types";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status") || "all";
    const allowedStatuses: CompanyStatusFilter[] = ["all", "active", "suspended", "trialing"];
    const status = allowedStatuses.includes(rawStatus as CompanyStatusFilter)
      ? (rawStatus as CompanyStatusFilter)
      : "all";
    const query = {
      page: Number(searchParams.get("page") || "1"),
      page_size: Number(searchParams.get("page_size") || "20"),
      search: searchParams.get("search") || undefined,
      status,
    };

    return await PlatformAdminController.companies(query);
  } catch (error) {
    console.error("Platform companies list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
