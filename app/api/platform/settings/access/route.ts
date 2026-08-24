import { NextResponse } from "next/server";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";
import { canManagePlatformAccessSettings } from "@/lib/platform-access/roles";
import { platformAccessService } from "@/lib/platform-access/service";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_access_settings_read");
    if (auth.error) return auth.error;
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canManagePlatformAccessSettings({ isPlatformAdmin: auth.user.isPlatformAdmin })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const setting = await platformAccessService.getRequireActiveSubscriptionSetting();
    return NextResponse.json({
      require_active_subscription: setting.enabled,
      updated_at: setting.updatedAt ? setting.updatedAt.toISOString() : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_access_settings_update");
    if (auth.error) return auth.error;
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canManagePlatformAccessSettings({ isPlatformAdmin: auth.user.isPlatformAdmin })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (typeof body?.require_active_subscription !== "boolean") {
      return NextResponse.json({ error: "require_active_subscription must be boolean" }, { status: 400 });
    }

    if (body?.confirm !== true) {
      return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
    }

    const updated = await platformAccessService.upsertRequireActiveSubscription(
      body.require_active_subscription,
      auth.user.id,
    );

    return NextResponse.json({
      require_active_subscription: updated.enabled,
      updated_at: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
