import { NextResponse } from "next/server";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";
import { paymentProvidersService } from "@/lib/payment-providers/service";
import type { ProviderMode } from "@/lib/payment-providers/types";

const isMode = (value: string): value is ProviderMode => value === "test" || value === "live";

export async function PUT(req: Request, { params }: { params: { provider: string } }) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_payment_providers_update");
    if (auth.error) return auth.error;
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (typeof body?.is_enabled !== "boolean") {
      return NextResponse.json({ error: "is_enabled must be boolean" }, { status: 400 });
    }

    const isEnabled = body.is_enabled as boolean;
    const mode = String(body?.mode || "").toLowerCase();
    const config = typeof body?.config === "object" && body?.config ? body.config : {};

    if (!isMode(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const updated = await paymentProvidersService.updateProvider(params.provider, {
      is_enabled: isEnabled,
      mode,
      config,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    const status =
      message.includes("Invalid provider") ||
      message.includes("Invalid mode") ||
      message.includes("Missing required field") ||
      message.includes("At least one payment provider")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
