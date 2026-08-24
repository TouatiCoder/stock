import { SUBSCRIPTION_STATUS, type SubscriptionStatus } from "@/lib/subscription/constants";

const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  [SUBSCRIPTION_STATUS.FREE]: [SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.CANCELLED],
  [SUBSCRIPTION_STATUS.TRIALING]: [
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.PAST_DUE,
    SUBSCRIPTION_STATUS.CANCELLED,
    SUBSCRIPTION_STATUS.FREE,
  ],
  [SUBSCRIPTION_STATUS.ACTIVE]: [
    SUBSCRIPTION_STATUS.PAST_DUE,
    SUBSCRIPTION_STATUS.CANCELLED,
    SUBSCRIPTION_STATUS.FREE,
  ],
  [SUBSCRIPTION_STATUS.PAST_DUE]: [
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.CANCELLED,
    SUBSCRIPTION_STATUS.FREE,
  ],
  [SUBSCRIPTION_STATUS.CANCELLED]: [SUBSCRIPTION_STATUS.FREE, SUBSCRIPTION_STATUS.ACTIVE],
};

export function canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransitionAllowed(from: SubscriptionStatus, to: SubscriptionStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid subscription transition: ${from} -> ${to}`);
  }
}

export const subscriptionStateMachine = {
  canTransition,
  assertTransitionAllowed,
};
