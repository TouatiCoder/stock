import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_PLAN_SEEDS } from "@/lib/subscription/constants";

type DbClient = Prisma.TransactionClient | typeof db;

export class PlanService {
  async ensureDefaultPlans(client: DbClient = db) {
    for (const seed of DEFAULT_PLAN_SEEDS) {
      const plan = await client.plan.upsert({
        where: { code: seed.code },
        update: {
          name: seed.name,
          isActive: true,
        },
        create: {
          code: seed.code,
          name: seed.name,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      for (const feature of seed.features) {
        await client.planFeature.upsert({
          where: {
            planId_featureCode: {
              planId: plan.id,
              featureCode: feature.featureCode,
            },
          },
          update: {
            limitValue: feature.limitValue,
            enabled: feature.enabled,
          },
          create: {
            planId: plan.id,
            featureCode: feature.featureCode,
            limitValue: feature.limitValue,
            enabled: feature.enabled,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  async getByCode(code: string, client: DbClient = db) {
    return client.plan.findUnique({
      where: { code },
      include: { features: true },
    });
  }

  async getActiveByCode(code: string, client: DbClient = db) {
    return client.plan.findFirst({
      where: {
        code,
        isActive: true,
      },
      include: { features: true },
    });
  }
}

export const planService = new PlanService();
