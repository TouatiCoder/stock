import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FEATURE_CODES, type FeatureCode } from "@/lib/subscription/constants";
import { checkFeature } from "@/lib/subscription/feature-gate.service";
import type { FeatureGateCheckInput, FeatureGateDecision } from "@/lib/subscription/types";

type DbClient = Prisma.TransactionClient | typeof db;

type EnforceFeatureParams = {
  companyId: string;
  featureCode: FeatureCode;
  options?: FeatureGateCheckInput;
  message?: string;
};

const reasonMessage: Record<string, string> = {
  SUBSCRIPTION_NOT_FOUND: "Subscription is missing for this company",
  SUBSCRIPTION_INACTIVE: "Subscription is inactive",
  TRIAL_EXPIRED: "Trial has expired",
  FEATURE_DISABLED: "Feature is not available on your current plan",
  LIMIT_EXCEEDED: "Feature limit exceeded",
};

export async function getActiveUsersCount(companyId: string, client: DbClient = db) {
  return client.user.count({
    where: {
      companyId,
      active: true,
    },
  });
}

export function featureDeniedResponse(gate: FeatureGateDecision, message?: string) {
  return NextResponse.json(
    {
      error: message || reasonMessage[gate.reason] || "Feature access denied",
      gate,
    },
    { status: 403 },
  );
}

export async function enforceFeatureAccess(params: EnforceFeatureParams) {
  const gate = await checkFeature(params.companyId, params.featureCode, params.options);
  if (!gate.allowed) {
    return { allowed: false, gate, response: featureDeniedResponse(gate, params.message) };
  }
  return { allowed: true, gate, response: null as NextResponse<unknown> | null };
}

export async function enforceMaxUsers(companyId: string, additionalUsers = 1, client: DbClient = db) {
  const activeUsersCount = await getActiveUsersCount(companyId, client);
  const gate = await checkFeature(companyId, FEATURE_CODES.MAX_USERS, {
    currentUsage: activeUsersCount,
    requestedAmount: additionalUsers,
  });
  return {
    gate,
    activeUsersCount,
  };
}
