import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { paymentProvidersService } from "@/lib/payment-providers/service";

export async function GET() {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const providers = await paymentProvidersService.listProviders();
  const enabled: Record<string, boolean> = {};
  for (const provider of providers) {
    enabled[provider.provider_code] = provider.is_enabled;
  }

  return NextResponse.json({
    stripe: enabled.stripe ?? false,
    paypal: enabled.paypal ?? false,
    cash: enabled.cash ?? false,
  });
}
