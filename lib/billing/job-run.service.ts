import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export class BillingJobRunService {
  async recordRun(params: {
    jobName: string;
    startedAt: Date;
    status: "success" | "failed";
    summary?: unknown;
    errorMessage?: string;
    companyId?: string;
  }) {
    return db.billingJobRun.create({
      data: {
        id: randomUUID(),
        jobName: params.jobName,
        status: params.status,
        companyId: params.companyId ?? null,
        startedAt: params.startedAt,
        finishedAt: new Date(),
        summaryJson: (params.summary ?? null) as Prisma.InputJsonValue,
        errorMessage: params.errorMessage ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async getLastSuccessfulRun(jobName: string) {
    return db.billingJobRun.findFirst({
      where: {
        jobName,
        status: "success",
      },
      orderBy: {
        finishedAt: "desc",
      },
    });
  }
}

export const billingJobRunService = new BillingJobRunService();
