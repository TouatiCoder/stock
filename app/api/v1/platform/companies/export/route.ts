import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";
import type { CompanyStatusFilter } from "@/lib/platform-admin/types";

const STATUSES: CompanyStatusFilter[] = ["all", "active", "suspended", "trialing"];

/**
 * GET /api/v1/platform/companies/export - the companies table as a CSV file,
 * honouring the same search/status filters (every match, not just one page).
 */
export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const statusParam = (url.searchParams.get("status") || "all") as CompanyStatusFilter;
    const status = STATUSES.includes(statusParam) ? statusParam : "all";

    // Headers are translated by the caller so the file matches the UI language.
    const headers = {
      name: url.searchParams.get("h_name") || "Name",
      id: url.searchParams.get("h_id") || "ID",
      status: url.searchParams.get("h_status") || "Status",
      subscription: url.searchParams.get("h_subscription") || "Subscription",
      trialEndsAt: url.searchParams.get("h_trial") || "Trial ends",
      lastPayment: url.searchParams.get("h_payment") || "Last payment",
      createdAt: url.searchParams.get("h_created") || "Created at",
    };

    return await PlatformAdminController.companiesCsv(
      { search: url.searchParams.get("search") || undefined, status },
      headers,
    );
  } catch (error) {
    console.error("Platform companies export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
