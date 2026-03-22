import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logBilling } from "@/lib/billing/logger";
import { PLAN_CODES, SUBSCRIPTION_STATUS, type SubscriptionStatus } from "@/lib/subscription/constants";
import { planService } from "@/lib/subscription/plan.service";
import { subscriptionStateMachine } from "@/lib/subscription/state-machine";

type DbClient = Prisma.TransactionClient | typeof db;

export type TransitionReason =
  | "trial_expired_paid"
  | "trial_expired_unpaid"
  | "past_due_grace_expired"
  | "manual_downgrade"
  | "manual_upgrade"
  | "manual_cancel"
  | "reactivated"
  | "system";

export type TransitionResult = {
  changed: boolean;
  fromStatus: SubscriptionStatus;
  toStatus: SubscriptionStatus;
  subscriptionId: string;
  companyId: string;
};

export class SubscriptionTransitionService {
  async transitionSubscription(
    companyId: string,
    newStatus: SubscriptionStatus,
    reason: TransitionReason = "system",
    options: {
      targetPlanCode?: string;
      eventId?: string;
      correlationId?: string;
    } = {},
    client: DbClient = db,
  ): Promise<TransitionResult> {
    const current = await client.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
      },
    });

    if (!current) {
      throw new Error(`Subscription not found for company: ${companyId}`);
    }

    const oldStatus = current.status as SubscriptionStatus;
    subscriptionStateMachine.assertTransitionAllowed(oldStatus, newStatus);

    if (oldStatus === newStatus) {
      logBilling("info", "Subscription transition noop", {
        correlation_id: options.correlationId,
        event_id: options.eventId,
        company_id: companyId,
        old_status: oldStatus,
        new_status: newStatus,
        transition_reason: reason,
      });
      return {
        changed: false,
        fromStatus: oldStatus,
        toStatus: newStatus,
        subscriptionId: current.id,
        companyId,
      };
    }

    const updateData: Prisma.SubscriptionUpdateInput = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (
      newStatus === SUBSCRIPTION_STATUS.ACTIVE &&
      current.plan.code === PLAN_CODES.FREE &&
      options.targetPlanCode !== PLAN_CODES.PRO &&
      options.targetPlanCode !== PLAN_CODES.ENTERPRISE
    ) {
      throw new Error("Cannot transition to active while company is on free plan");
    }

    if (newStatus === SUBSCRIPTION_STATUS.FREE) {
      const freePlan = await planService.getActiveByCode(PLAN_CODES.FREE, client);
      if (!freePlan) {
        throw new Error("Free plan is not configured");
      }
      updateData.plan = { connect: { id: freePlan.id } };
      updateData.trialEndsAt = null;
      updateData.currentPeriodEnd = null;
    } else if (options.targetPlanCode && options.targetPlanCode !== current.plan.code) {
      const targetPlan = await planService.getActiveByCode(options.targetPlanCode, client);
      if (!targetPlan) {
        throw new Error(`Target plan not found: ${options.targetPlanCode}`);
      }
      updateData.plan = { connect: { id: targetPlan.id } };
    }

    const updated = await client.subscription.update({
      where: { id: current.id },
      data: updateData,
      include: {
        plan: true,
      },
    });

    await client.company.update({
      where: { id: companyId },
      data: {
        plan: updated.plan.code,
      },
    });

    await client.subscriptionStatusAudit.create({
      data: {
        subscriptionId: updated.id,
        companyId,
        oldStatus,
        newStatus,
        reason,
      },
    });

    logBilling("info", "Subscription transitioned", {
      correlation_id: options.correlationId,
      event_id: options.eventId,
      company_id: companyId,
      old_status: oldStatus,
      new_status: newStatus,
      transition_reason: reason,
    });

    return {
      changed: true,
      fromStatus: oldStatus,
      toStatus: newStatus,
      subscriptionId: updated.id,
      companyId,
    };
  }
}

export const subscriptionTransitionService = new SubscriptionTransitionService();
