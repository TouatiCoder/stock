import { NextResponse } from "next/server";
import { evaluateRequireActiveSubscription } from "@/lib/platform-access/guard";

export async function requireActiveSubscriptionForApi(input: {
  companyId?: string | null;
  isPlatformAdmin?: boolean | null;
}) {
  const decision = await evaluateRequireActiveSubscription(input);

  if (decision.allowed) {
    return {
      error: null as NextResponse<unknown> | null,
      decision,
    };
  }

  return {
    error: NextResponse.json(
      {
        error: "Payment required",
        reason: decision.reason,
        billing_path: decision.billingPath,
      },
      {
        status: 402,
        headers: {
          Location: decision.billingPath,
        },
      },
    ),
    decision,
  };
}