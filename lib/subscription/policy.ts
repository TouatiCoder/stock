import { SUBSCRIPTION_STATUS } from "./constants";

type SubscriptionState = {
  status: string;
  trialEndsAt: Date | null;
  planCode?: string;
};

type FeatureState = {
  enabled: boolean;
  limitValue: number | null;
};

export type GateReason =
  | "OK"
  | "SUBSCRIPTION_NOT_FOUND"
  | "SUBSCRIPTION_INACTIVE"
  | "TRIAL_EXPIRED"
  | "FEATURE_DISABLED"
  | "LIMIT_EXCEEDED";

export type GateEvaluationInput = {
  subscription: SubscriptionState | null;
  feature: FeatureState | null;
  usage: number;
  requestedAmount: number;
  now?: Date;
};

export type GateEvaluation = {
  allowed: boolean;
  reason: GateReason;
  limit: number | null;
  usage: number;
  remaining: number | null;
  planCode?: string;
  subscriptionStatus?: string;
};

export function evaluateFeatureAccess(input: GateEvaluationInput): GateEvaluation {
  const now = input.now ?? new Date();

  if (!input.subscription) {
    return {
      allowed: false,
      reason: "SUBSCRIPTION_NOT_FOUND",
      limit: null,
      usage: input.usage,
      remaining: null,
    };
  }

  const { subscription } = input;
  if ([SUBSCRIPTION_STATUS.CANCELLED, SUBSCRIPTION_STATUS.PAST_DUE].includes(subscription.status as any)) {
    return {
      allowed: false,
      reason: "SUBSCRIPTION_INACTIVE",
      limit: null,
      usage: input.usage,
      remaining: null,
      planCode: subscription.planCode,
      subscriptionStatus: subscription.status,
    };
  }

  if (
    subscription.status === SUBSCRIPTION_STATUS.TRIALING &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt.getTime() < now.getTime()
  ) {
    return {
      allowed: false,
      reason: "TRIAL_EXPIRED",
      limit: null,
      usage: input.usage,
      remaining: null,
      planCode: subscription.planCode,
      subscriptionStatus: subscription.status,
    };
  }

  if (!input.feature || !input.feature.enabled) {
    return {
      allowed: false,
      reason: "FEATURE_DISABLED",
      limit: input.feature?.limitValue ?? null,
      usage: input.usage,
      remaining: null,
      planCode: subscription.planCode,
      subscriptionStatus: subscription.status,
    };
  }

  if (input.feature.limitValue != null && input.usage + input.requestedAmount > input.feature.limitValue) {
    return {
      allowed: false,
      reason: "LIMIT_EXCEEDED",
      limit: input.feature.limitValue,
      usage: input.usage,
      remaining: Math.max(0, input.feature.limitValue - input.usage),
      planCode: subscription.planCode,
      subscriptionStatus: subscription.status,
    };
  }

  return {
    allowed: true,
    reason: "OK",
    limit: input.feature.limitValue,
    usage: input.usage,
    remaining:
      input.feature.limitValue == null
        ? null
        : Math.max(0, input.feature.limitValue - input.usage - input.requestedAmount),
    planCode: subscription.planCode,
    subscriptionStatus: subscription.status,
  };
}
