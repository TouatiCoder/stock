import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";

/** GET /api/v1/platform/companies/[id] - one company with its users, subscription and payments. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const companyId = params.id?.trim();
    if (!companyId) {
      return NextResponse.json({ error: "Company id is required" }, { status: 400 });
    }

    return await PlatformAdminController.companyDetail(companyId);
  } catch (error) {
    console.error("Platform company detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
