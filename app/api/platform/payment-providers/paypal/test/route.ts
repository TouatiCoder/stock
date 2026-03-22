import { NextResponse } from "next/server";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";
import { payPalClientService } from "@/lib/payment-providers/paypal";

export async function GET(req: Request) {
  try {
    const auth = await requirePlatformAdminWithRateLimit(req, "platform_payment_providers_paypal_test");
    if (auth.error) return auth.error;
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await payPalClientService.testConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "PayPal test failed" },
      { status: 500 },
    );
  }
}
