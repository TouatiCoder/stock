import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error || !auth.user) return auth.error;

    const body = await req.json();
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ error: "Suspension reason is required" }, { status: 400 });
    }

    await PlatformAdminController.suspendCompany(params.id, reason, auth.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "Company not found") {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    console.error("Platform suspend company error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

