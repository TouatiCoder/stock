import { NextResponse } from "next/server";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";
import { paymentProvidersService } from "@/lib/payment-providers/service";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_payment_providers_list");
    if (auth.error) return auth.error;
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const providers = await paymentProvidersService.listProviders();
    return NextResponse.json({ items: providers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
