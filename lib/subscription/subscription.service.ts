import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  PLAN_CODES,
  SUBSCRIPTION_STATUS,
  type PlanCode,
  type SubscriptionStatus,
} from "@/lib/subscription/constants";
import { planService } from "@/lib/subscription/plan.service";
import { subscriptionTransitionService } from "@/lib/subscription/transition.service";
import type { InitializeSubscriptionOptions } from "@/lib/subscription/types";

type DbClient = Prisma.TransactionClient | typeof db;

const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export class SubscriptionService {
  async initializeCompanySubscription(
    companyId: string,
    options: InitializeSubscriptionOptions = {},
    client: DbClient = db,
  ) {
    const trialEnabled = options.trialEnabled ?? false;
    const trialDays = options.trialDays ?? 7;

    await planService.ensureDefaultPlans(client);

    const freePlan = await planService.getActiveByCode(PLAN_CODES.FREE, client);
    if (!freePlan) {
      throw new Error("Free plan is not configured");
    }

    const now = new Date();
    const trialEndsAt = trialEnabled ? plusDays(trialDays) : null;

    const subscription = await client.subscription.create({
      data: {
        companyId,
        planId: freePlan.id,
        status: trialEnabled ? SUBSCRIPTION_STATUS.TRIALING : SUBSCRIPTION_STATUS.FREE,
        trialEndsAt,
        currentPeriodEnd: trialEnabled ? trialEndsAt : plusDays(30),
        createdAt: now,
        updatedAt: now,
      },
      include: {
        plan: {
          include: { features: true },
        },
      },
    });

    await client.company.update({
      where: { id: companyId },
      data: { plan: freePlan.code },
    });

    return subscription;
  }

  async getCurrentSubscription(companyId: string, client: DbClient = db) {
    return client.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          include: {
            features: true,
          },
        },
      },
    });
  }

  async changePlan(
    companyId: string,
    nextPlanCode: PlanCode,
    status: SubscriptionStatus = nextPlanCode === PLAN_CODES.FREE
      ? SUBSCRIPTION_STATUS.FREE
      : SUBSCRIPTION_STATUS.ACTIVE,
    client: DbClient = db,
    periodDays = 30,
  ) {
    await planService.ensureDefaultPlans(client);

    const nextPlan = await planService.getActiveByCode(nextPlanCode, client);
    if (!nextPlan) {
      throw new Error(`Plan not found: ${nextPlanCode}`);
    }

    const subscription = await client.subscription.create({
      data: {
        companyId,
        planId: nextPlan.id,
        status,
        trialEndsAt: null,
        currentPeriodEnd: plusDays(periodDays),
        updatedAt: new Date(),
      },
      include: {
        plan: {
          include: {
            features: true,
          },
        },
      },
    });

    await client.company.update({
      where: { id: companyId },
      data: { plan: nextPlan.code },
    });

    return subscription;
  }

  async markCancelled(companyId: string, client: DbClient = db) {
    return subscriptionTransitionService.transitionSubscription(
      companyId,
      SUBSCRIPTION_STATUS.CANCELLED,
      "manual_cancel",
      {},
      client,
    );
  }
}

export const subscriptionService = new SubscriptionService();
