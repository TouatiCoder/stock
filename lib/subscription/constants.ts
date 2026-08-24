export const PLAN_CODES = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export const FEATURE_CODES = {
  MAX_PROJECTS: "max_projects",
  MAX_USERS: "max_users",
  ADVANCED_ANALYTICS: "advanced_analytics",
} as const;

export type PlanCode = (typeof PLAN_CODES)[keyof typeof PLAN_CODES];
export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES] | string;

export const SUBSCRIPTION_STATUS = {
  FREE: "free",
  ACTIVE: "active",
  TRIALING: "trialing",
  CANCELLED: "cancelled",
  PAST_DUE: "past_due",
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export interface PlanSeed {
  code: PlanCode;
  name: string;
  features: Array<{
    featureCode: string;
    limitValue: number | null;
    enabled: boolean;
  }>;
}

export const DEFAULT_PLAN_SEEDS: PlanSeed[] = [
  {
    code: PLAN_CODES.FREE,
    name: "Free",
    features: [
      { featureCode: FEATURE_CODES.MAX_PROJECTS, limitValue: 2, enabled: true },
      { featureCode: FEATURE_CODES.MAX_USERS, limitValue: 3, enabled: true },
      { featureCode: FEATURE_CODES.ADVANCED_ANALYTICS, limitValue: null, enabled: false },
    ],
  },
  {
    code: PLAN_CODES.PRO,
    name: "Pro",
    features: [
      { featureCode: FEATURE_CODES.MAX_PROJECTS, limitValue: 10, enabled: true },
      { featureCode: FEATURE_CODES.MAX_USERS, limitValue: 10, enabled: true },
      { featureCode: FEATURE_CODES.ADVANCED_ANALYTICS, limitValue: null, enabled: true },
    ],
  },
  {
    code: PLAN_CODES.ENTERPRISE,
    name: "Enterprise",
    features: [
      { featureCode: FEATURE_CODES.MAX_PROJECTS, limitValue: null, enabled: true },
      { featureCode: FEATURE_CODES.MAX_USERS, limitValue: null, enabled: true },
      { featureCode: FEATURE_CODES.ADVANCED_ANALYTICS, limitValue: null, enabled: true },
    ],
  },
];
