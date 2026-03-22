import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { PLATFORM_SETTING_KEYS } from "@/lib/platform-access/constants";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const toBool = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
};

const parseGracePeriodDays = (): number => {
  const raw = process.env.GRACE_PERIOD_DAYS;
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

const addDays = (date: Date, days: number): Date => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

export type CompanySubscriptionState = {
  status: string;
  currentPeriodEnd: Date | null;
};

export class PlatformAccessService {
  async getRequireActiveSubscriptionSetting(): Promise<{ enabled: boolean; updatedAt: Date | null }> {
    const setting = await db.platformSetting.findUnique({
      where: { key: PLATFORM_SETTING_KEYS.REQUIRE_ACTIVE_SUBSCRIPTION },
      select: { value: true, updatedAt: true },
    });

    return {
      enabled: toBool(setting?.value),
      updatedAt: setting?.updatedAt ?? null,
    };
  }

  async getRequireActiveSubscription(): Promise<boolean> {
    const setting = await this.getRequireActiveSubscriptionSetting();
    return setting.enabled;
  }

  async upsertRequireActiveSubscription(enabled: boolean, actorUserId: string): Promise<{ enabled: boolean; updatedAt: Date }> {
    const nextValue = enabled ? "true" : "false";

    const result = await db.$transaction(async (tx) => {
      const current = await tx.platformSetting.findUnique({
        where: { key: PLATFORM_SETTING_KEYS.REQUIRE_ACTIVE_SUBSCRIPTION },
        select: { value: true },
      });

      const now = new Date();
      const updated = await tx.platformSetting.upsert({
        where: { key: PLATFORM_SETTING_KEYS.REQUIRE_ACTIVE_SUBSCRIPTION },
        update: {
          value: nextValue,
          updatedAt: now,
        },
        create: {
          id: randomUUID(),
          key: PLATFORM_SETTING_KEYS.REQUIRE_ACTIVE_SUBSCRIPTION,
          value: nextValue,
          updatedAt: now,
        },
      });

      if (!current || current.value !== nextValue) {
        await tx.platformSettingAudit.create({
          data: {
            id: randomUUID(),
            settingKey: PLATFORM_SETTING_KEYS.REQUIRE_ACTIVE_SUBSCRIPTION,
            oldValue: current?.value ?? null,
            newValue: nextValue,
            actorUserId,
            createdAt: now,
          },
        });
      }

      return updated;
    });

    return {
      enabled: toBool(result.value),
      updatedAt: result.updatedAt,
    };
  }

  async getLatestCompanySubscription(companyId: string): Promise<CompanySubscriptionState | null> {
    return db.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        currentPeriodEnd: true,
      },
    });
  }

  isPastDueWithinGrace(subscription: CompanySubscriptionState, now = new Date()): boolean {
    if (subscription.status !== "past_due") return false;
    if (!subscription.currentPeriodEnd) return false;

    const graceDays = parseGracePeriodDays();
    const graceLimit = addDays(subscription.currentPeriodEnd, graceDays);
    return graceLimit.getTime() >= now.getTime();
  }
}

export const platformAccessService = new PlatformAccessService();
