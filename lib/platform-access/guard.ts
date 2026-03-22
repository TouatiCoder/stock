import { PLATFORM_ACCESS_BILLING_PATH } from "@/lib/platform-access/constants";
import { canBypassSubscriptionAccessGate } from "@/lib/platform-access/roles";
import { platformAccessService } from "@/lib/platform-access/service";

const ALLOWED_STATUSES = new Set(["active", "trialing"]);

export type RequireActiveSubscriptionDecision = {
  allowed: boolean;
  reason:
    | "setting_disabled"
    | "super_admin_bypass"
    | "no_company"
    | "no_subscription"
    | "status_allowed"
    | "past_due_grace"
    | "subscription_required";
  billingPath: string;
};

export async function evaluateRequireActiveSubscription(input: {
  companyId?: string | null;
  isPlatformAdmin?: boolean | null;
  now?: Date;
}): Promise<RequireActiveSubscriptionDecision> {
  const billingPath = PLATFORM_ACCESS_BILLING_PATH;
  const enforcePayment = await platformAccessService.getRequireActiveSubscription();

  if (!enforcePayment) {
    return { allowed: true, reason: "setting_disabled", billingPath };
  }

  if (canBypassSubscriptionAccessGate({ isPlatformAdmin: input.isPlatformAdmin })) {
    return { allowed: true, reason: "super_admin_bypass", billingPath };
  }

  if (!input.companyId) {
    return { allowed: false, reason: "no_company", billingPath };
  }

  const subscription = await platformAccessService.getLatestCompanySubscription(input.companyId);
  if (!subscription) {
    return { allowed: false, reason: "no_subscription", billingPath };
  }

  if (ALLOWED_STATUSES.has(subscription.status)) {
    return { allowed: true, reason: "status_allowed", billingPath };
  }

  if (platformAccessService.isPastDueWithinGrace(subscription, input.now ?? new Date())) {
    return { allowed: true, reason: "past_due_grace", billingPath };
  }

  return { allowed: false, reason: "subscription_required", billingPath };
}
