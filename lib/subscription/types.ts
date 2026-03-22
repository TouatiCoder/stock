import { FeatureCode } from "@/lib/subscription/constants";

export interface FeatureGateCheckInput {
  currentUsage?: number;
  requestedAmount?: number;
  incrementOnAllow?: boolean;
}

export interface FeatureGateDecision {
  allowed: boolean;
  reason:
    | "OK"
    | "SUBSCRIPTION_NOT_FOUND"
    | "SUBSCRIPTION_INACTIVE"
    | "TRIAL_EXPIRED"
    | "FEATURE_DISABLED"
    | "LIMIT_EXCEEDED";
  featureCode: FeatureCode;
  limit: number | null;
  usage: number;
  remaining: number | null;
  planCode?: string;
  subscriptionStatus?: string;
}

export interface InitializeSubscriptionOptions {
  trialEnabled?: boolean;
  trialDays?: number;
}
