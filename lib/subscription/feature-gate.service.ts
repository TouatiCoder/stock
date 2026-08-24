import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { type FeatureCode } from "@/lib/subscription/constants";
import { evaluateFeatureAccess } from "@/lib/subscription/policy";
import { subscriptionService } from "@/lib/subscription/subscription.service";
import type { FeatureGateCheckInput, FeatureGateDecision } from "@/lib/subscription/types";

type DbClient = Prisma.TransactionClient | typeof db;

const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export class FeatureGateService {
  async checkFeature(
    companyId: string,
    featureCode: FeatureCode,
    options: FeatureGateCheckInput = {},
    client: DbClient = db,
  ): Promise<FeatureGateDecision> {
    const requestedAmount = Math.max(1, options.requestedAmount ?? 1);

    const subscription = await subscriptionService.getCurrentSubscription(companyId, client);
    const feature = subscription?.plan.features.find((item) => item.featureCode === featureCode) ?? null;

    const usageFromInput = typeof options.currentUsage === "number" ? Math.max(0, options.currentUsage) : null;
    const usageRecord = usageFromInput == null
      ? await this.getNormalizedUsage(companyId, featureCode, subscription?.currentPeriodEnd ?? null, client)
      : null;

    const usage = usageFromInput ?? usageRecord?.usageCount ?? 0;
    const evaluation = evaluateFeatureAccess({
      subscription: subscription
        ? {
            status: subscription.status,
            trialEndsAt: subscription.trialEndsAt,
            planCode: subscription.plan.code,
          }
        : null,
      feature: feature
        ? {
            enabled: feature.enabled,
            limitValue: feature.limitValue,
          }
        : null,
      usage,
      requestedAmount,
    });

    if (evaluation.allowed && options.incrementOnAllow && usageFromInput == null) {
      await this.incrementUsage(
        companyId,
        featureCode,
        requestedAmount,
        subscription?.currentPeriodEnd ?? null,
        client,
      );
    }

    return {
      allowed: evaluation.allowed,
      reason: evaluation.reason,
      featureCode,
      limit: evaluation.limit,
      usage: evaluation.usage,
      remaining: evaluation.remaining,
      planCode: evaluation.planCode,
      subscriptionStatus: evaluation.subscriptionStatus,
    };
  }

  private async getNormalizedUsage(
    companyId: string,
    featureCode: string,
    subscriptionPeriodEnd: Date | null,
    client: DbClient,
  ) {
    const usage = await client.featureUsage.findUnique({
      where: {
        companyId_featureCode: {
          companyId,
          featureCode,
        },
      },
    });

    if (!usage) {
      return client.featureUsage.create({
        data: {
          companyId,
          featureCode,
          usageCount: 0,
          resetAt: subscriptionPeriodEnd ?? plusDays(30),
          updatedAt: new Date(),
        },
      });
    }

    if (usage.resetAt && usage.resetAt <= new Date()) {
      return client.featureUsage.update({
        where: { id: usage.id },
        data: {
          usageCount: 0,
          resetAt: subscriptionPeriodEnd ?? plusDays(30),
        },
      });
    }

    return usage;
  }

  async incrementUsage(
    companyId: string,
    featureCode: FeatureCode,
    amount = 1,
    resetAt: Date | null = null,
    client: DbClient = db,
  ) {
    const existing = await this.getNormalizedUsage(companyId, featureCode, resetAt, client);

    return client.featureUsage.update({
      where: { id: existing.id },
      data: {
        usageCount: {
          increment: Math.max(0, amount),
        },
        resetAt: resetAt ?? existing.resetAt,
      },
    });
  }
}

export const featureGateService = new FeatureGateService();

export const checkFeature = (
  companyId: string,
  featureCode: FeatureCode,
  options: FeatureGateCheckInput = {},
) => featureGateService.checkFeature(companyId, featureCode, options);
