import { db } from "@/lib/db";
import { PLAN_CODES, type PlanCode } from "@/lib/subscription/constants";
import type { BillingInterval } from "@/lib/billing/types";

export type PlanPriceMapping = {
  planCode: PlanCode;
  interval: BillingInterval;
  currency: string;
  stripePriceId: string;
};

const isPlanCode = (value: string): value is PlanCode => {
  return Object.values(PLAN_CODES).includes(value as PlanCode);
};

export async function resolvePlanPriceMappingByPriceId(stripePriceId: string): Promise<PlanPriceMapping | null> {
  const mapping = await db.billingPlanPrice.findUnique({
    where: { stripePriceId },
  });

  if (!mapping || !mapping.isActive || !isPlanCode(mapping.planCode)) {
    return null;
  }

  return {
    planCode: mapping.planCode,
    interval: mapping.billingInterval as BillingInterval,
    currency: mapping.currency,
    stripePriceId: mapping.stripePriceId,
  };
}

export async function resolvePlanPriceMapping(planCode: PlanCode, interval: BillingInterval, currency: string) {
  return db.billingPlanPrice.findFirst({
    where: {
      planCode,
      billingInterval: interval,
      currency: currency.toLowerCase(),
      isActive: true,
    },
    orderBy: { version: "desc" },
  });
}
