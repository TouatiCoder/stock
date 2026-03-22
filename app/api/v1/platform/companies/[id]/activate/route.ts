import { NextResponse } from "next/server";
import { PlatformAdminController } from "@/lib/platform-admin/controller";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error || !auth.user) return auth.error;

    await PlatformAdminController.activateCompany(params.id, auth.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "Company not found") {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    console.error("Platform activate company error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

