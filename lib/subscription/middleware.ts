import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { type FeatureCode } from "@/lib/subscription/constants";
import { enforceFeatureAccess } from "@/lib/subscription/enforcement";
import type { FeatureGateCheckInput } from "@/lib/subscription/types";

export async function requireFeature(featureCode: FeatureCode, options: FeatureGateCheckInput = {}) {
  const user = await checkAuth();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      gate: null,
    };
  }

  const enforcement = await enforceFeatureAccess({
    companyId: user.companyId,
    featureCode,
    options,
    message: `Feature ${featureCode} is not enabled on your current plan`,
  });
  if (!enforcement.allowed) {
    return {
      error: enforcement.response,
      user,
      gate: enforcement.gate,
    };
  }

  return {
    error: null as NextResponse<unknown> | null,
    user,
    gate: enforcement.gate,
  };
}
