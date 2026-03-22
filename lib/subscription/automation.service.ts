import { db } from "@/lib/db";
import { PLAN_CODES, SUBSCRIPTION_STATUS } from "@/lib/subscription/constants";
import { subscriptionTransitionService } from "@/lib/subscription/transition.service";

export type SubscriptionAutomationSummary = {
  inspectedTrialing: number;
  inspectedPastDue: number;
  transitioned: number;
  noops: number;
  errors: Array<{ companyId: string; message: string }>;
};

const parseGracePeriodDays = () => {
  const raw = process.env.GRACE_PERIOD_DAYS;
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const isPaidAtTrialExpiry = (subscription: {
  plan: { code: string };
  currentPeriodEnd: Date | null;
}) => {
  if (subscription.plan.code === PLAN_CODES.FREE) return false;
  if (!subscription.currentPeriodEnd) return false;
  return subscription.currentPeriodEnd.getTime() >= Date.now();
};

export class SubscriptionAutomationService {
  async runDailyStateAutomation(now = new Date()): Promise<SubscriptionAutomationSummary> {
    const graceDays = parseGracePeriodDays();

    const [expiredTrials, pastDueSubscriptions] = await Promise.all([
      db.subscription.findMany({
        where: {
          status: SUBSCRIPTION_STATUS.TRIALING,
          trialEndsAt: {
            lt: now,
          },
        },
        include: {
          plan: true,
        },
      }),
      db.subscription.findMany({
        where: {
          status: SUBSCRIPTION_STATUS.PAST_DUE,
        },
        include: {
          plan: true,
        },
      }),
    ]);

    let transitioned = 0;
    let noops = 0;
    const errors: Array<{ companyId: string; message: string }> = [];

    for (const subscription of expiredTrials) {
      try {
        const newStatus = isPaidAtTrialExpiry(subscription)
          ? SUBSCRIPTION_STATUS.ACTIVE
          : SUBSCRIPTION_STATUS.FREE;

        const result = await db.$transaction((tx) =>
          subscriptionTransitionService.transitionSubscription(
            subscription.companyId,
            newStatus,
            newStatus === SUBSCRIPTION_STATUS.ACTIVE ? "trial_expired_paid" : "trial_expired_unpaid",
            {},
            tx,
          ),
        );

        if (result.changed) transitioned += 1;
        else noops += 1;
      } catch (error) {
        errors.push({
          companyId: subscription.companyId,
          message: error instanceof Error ? error.message : "Unknown transition error",
        });
      }
    }

    for (const subscription of pastDueSubscriptions) {
      try {
        if (!subscription.currentPeriodEnd) {
          const result = await db.$transaction((tx) =>
            subscriptionTransitionService.transitionSubscription(
              subscription.companyId,
              SUBSCRIPTION_STATUS.FREE,
              "past_due_grace_expired",
              {},
              tx,
            ),
          );

          if (result.changed) transitioned += 1;
          else noops += 1;
          continue;
        }

        const graceLimit = addDays(subscription.currentPeriodEnd, graceDays);
        if (graceLimit.getTime() > now.getTime()) {
          continue;
        }

        const result = await db.$transaction((tx) =>
          subscriptionTransitionService.transitionSubscription(
            subscription.companyId,
            SUBSCRIPTION_STATUS.FREE,
            "past_due_grace_expired",
            {},
            tx,
          ),
        );

        if (result.changed) transitioned += 1;
        else noops += 1;
      } catch (error) {
        errors.push({
          companyId: subscription.companyId,
          message: error instanceof Error ? error.message : "Unknown transition error",
        });
      }
    }

    return {
      inspectedTrialing: expiredTrials.length,
      inspectedPastDue: pastDueSubscriptions.length,
      transitioned,
      noops,
      errors,
    };
  }
}

export const subscriptionAutomationService = new SubscriptionAutomationService();
