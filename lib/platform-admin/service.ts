import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import type {
  PlatformStripeCheckoutSessionsListDto,
  PlatformStripeListQuery,
  PlatformStripeOverviewDto,
  PlatformStripeSubscriptionsListDto,
  PlatformStripeWebhooksListDto,
  PlatformCompaniesListDto,
  PlatformCompaniesQuery,
  PlatformDashboardDto,
  PlatformSubscriptionsOverviewDto,
} from "@/lib/platform-admin/types";

type DashboardRow = {
  total_companies: bigint | number;
  active_companies: bigint | number;
  suspended_companies: bigint | number;
  companies_on_trial: bigint | number;
  monthly_revenue_estimate: Prisma.Decimal | number | null;
  failed_payments_count: bigint | number;
};

type SubscriptionOverviewRow = {
  total_subscriptions: bigint | number;
  active_subscriptions: bigint | number;
  trialing_subscriptions: bigint | number;
  past_due_subscriptions: bigint | number;
  canceled_subscriptions: bigint | number;
  monthly_recurring_revenue: Prisma.Decimal | number | null;
  failed_payments_count: bigint | number;
};

type CompanyRow = {
  id: string;
  name: string;
  status: "active" | "suspended";
  subscription_status: string | null;
  trial_ends_at: Date | null;
  last_payment_status: string | null;
  created_at: Date;
};

type StripeOverviewRow = {
  total_customers: bigint | number;
  total_external_subscriptions: bigint | number;
  dead_letter_count: bigint | number;
  failed_webhooks_last_24h: bigint | number;
  last_webhook_received_at: Date | null;
  last_webhook_processed_at: Date | null;
};

type StripeSubscriptionRow = {
  company_name: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  external_status: string;
  current_period_end: Date | null;
  cancel_at_period_end: number | boolean;
  last_event_created_at: Date | null;
};

type StripeWebhookRow = {
  event_id: string;
  event_type: string;
  processing_status: string;
  attempt_count: number;
  last_error: string | null;
  received_at: Date;
};

type StripeCheckoutSessionRow = {
  company_name: string;
  target_plan_code: string;
  interval_value: string;
  status: string;
  created_at: Date;
  expires_at: Date | null;
};

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export class PlatformAdminService {
  async getDashboard(): Promise<PlatformDashboardDto> {
    const rows = await db.$queryRaw<DashboardRow[]>(Prisma.sql`
      SELECT
        COUNT(*) AS total_companies,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) AS active_companies,
        SUM(CASE WHEN c.is_active = 0 THEN 1 ELSE 0 END) AS suspended_companies,
        SUM(
          CASE
            WHEN ps.status = 'trialing'
              AND (ps.trial_ends_at IS NULL OR ps.trial_ends_at >= UTC_TIMESTAMP())
            THEN 1
            ELSE 0
          END
        ) AS companies_on_trial,
        COALESCE(
          SUM(
            CASE
              WHEN ps.status IN ('active', 'past_due') THEN ps.monthly_amount
              ELSE 0
            END
          ),
          0
        ) AS monthly_revenue_estimate,
        (
          SELECT COUNT(*)
          FROM platform_payments pp
          WHERE pp.status = 'failed'
        ) AS failed_payments_count
      FROM companies c
      LEFT JOIN platform_subscriptions ps ON ps.company_id = c.id
    `);

    const row = rows[0];
    return {
      total_companies: toNumber(row?.total_companies),
      active_companies: toNumber(row?.active_companies),
      suspended_companies: toNumber(row?.suspended_companies),
      companies_on_trial: toNumber(row?.companies_on_trial),
      monthly_revenue_estimate: toNumber(row?.monthly_revenue_estimate),
      failed_payments_count: toNumber(row?.failed_payments_count),
    };
  }

  async getCompanies(query: PlatformCompaniesQuery): Promise<PlatformCompaniesListDto> {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.page_size || 20)));
    const offset = (page - 1) * pageSize;
    const search = query.search?.trim();
    const status = query.status || "all";

    const whereConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];

    if (search) {
      const likeSearch = `%${search}%`;
      whereConditions.push(Prisma.sql`(c.name LIKE ${likeSearch} OR c.id LIKE ${likeSearch})`);
    }

    if (status === "active") {
      whereConditions.push(Prisma.sql`c.is_active = 1`);
    } else if (status === "suspended") {
      whereConditions.push(Prisma.sql`c.is_active = 0`);
    } else if (status === "trialing") {
      whereConditions.push(
        Prisma.sql`ps.status = 'trialing' AND (ps.trial_ends_at IS NULL OR ps.trial_ends_at >= UTC_TIMESTAMP())`,
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;

    const [rows, countRows] = await Promise.all([
      db.$queryRaw<CompanyRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.name,
          CASE WHEN c.is_active = 1 THEN 'active' ELSE 'suspended' END AS status,
          COALESCE(ps.status, 'none') AS subscription_status,
          ps.trial_ends_at,
          COALESCE(
            (
              SELECT pp.status
              FROM platform_payments pp
              WHERE pp.company_id = c.id
              ORDER BY COALESCE(pp.paid_at, pp.created_at) DESC
              LIMIT 1
            ),
            'none'
          ) AS last_payment_status,
          c.created_at
        FROM companies c
        LEFT JOIN platform_subscriptions ps ON ps.company_id = c.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      db.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM companies c
        LEFT JOIN platform_subscriptions ps ON ps.company_id = c.id
        ${whereClause}
      `),
    ]);

    const total = toNumber(countRows[0]?.total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        subscription_status: (row.subscription_status || "none") as
          | "trialing"
          | "active"
          | "past_due"
          | "canceled"
          | "none",
        trial_ends_at: row.trial_ends_at ? row.trial_ends_at.toISOString() : null,
        last_payment_status: (row.last_payment_status || "none") as "paid" | "failed" | "pending" | "none",
        created_at: row.created_at.toISOString(),
      })),
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    };
  }

  async suspendCompany(companyId: string, reason: string, actorUserId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const exists = await tx.company.findUnique({ where: { id: companyId }, select: { id: true } });
      if (!exists) {
        throw new Error("Company not found");
      }

      await tx.company.update({
        where: { id: companyId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        } as any,
      });

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO platform_company_status_events (id, company_id, action, reason, actor_user_id, created_at)
        VALUES (${randomUUID()}, ${companyId}, 'suspended', ${reason}, ${actorUserId}, UTC_TIMESTAMP())
      `);
    });
  }

  async activateCompany(companyId: string, actorUserId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const exists = await tx.company.findUnique({ where: { id: companyId }, select: { id: true } });
      if (!exists) {
        throw new Error("Company not found");
      }

      await tx.company.update({
        where: { id: companyId },
        data: {
          isActive: true,
          updatedAt: new Date(),
        } as any,
      });

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO platform_company_status_events (id, company_id, action, reason, actor_user_id, created_at)
        VALUES (${randomUUID()}, ${companyId}, 'activated', NULL, ${actorUserId}, UTC_TIMESTAMP())
      `);
    });
  }

  async getSubscriptionsOverview(): Promise<PlatformSubscriptionsOverviewDto> {
    const rows = await db.$queryRaw<SubscriptionOverviewRow[]>(Prisma.sql`
      SELECT
        COUNT(*) AS total_subscriptions,
        SUM(CASE WHEN ps.status = 'active' THEN 1 ELSE 0 END) AS active_subscriptions,
        SUM(CASE WHEN ps.status = 'trialing' THEN 1 ELSE 0 END) AS trialing_subscriptions,
        SUM(CASE WHEN ps.status = 'past_due' THEN 1 ELSE 0 END) AS past_due_subscriptions,
        SUM(CASE WHEN ps.status = 'canceled' THEN 1 ELSE 0 END) AS canceled_subscriptions,
        COALESCE(SUM(CASE WHEN ps.status = 'active' THEN ps.monthly_amount ELSE 0 END), 0) AS monthly_recurring_revenue,
        (
          SELECT COUNT(*)
          FROM platform_payments pp
          WHERE pp.status = 'failed'
        ) AS failed_payments_count
      FROM platform_subscriptions ps
    `);

    const row = rows[0];
    return {
      total_subscriptions: toNumber(row?.total_subscriptions),
      active_subscriptions: toNumber(row?.active_subscriptions),
      trialing_subscriptions: toNumber(row?.trialing_subscriptions),
      past_due_subscriptions: toNumber(row?.past_due_subscriptions),
      canceled_subscriptions: toNumber(row?.canceled_subscriptions),
      monthly_recurring_revenue: toNumber(row?.monthly_recurring_revenue),
      failed_payments_count: toNumber(row?.failed_payments_count),
    };
  }

  async getStripeOverview(): Promise<PlatformStripeOverviewDto> {
    const rows = await db.$queryRaw<StripeOverviewRow[]>(Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM billing_accounts) AS total_customers,
        (SELECT COUNT(*) FROM billing_subscriptions_external) AS total_external_subscriptions,
        (SELECT COUNT(*) FROM stripe_webhook_events WHERE processing_status = 'dead_letter') AS dead_letter_count,
        (
          SELECT COUNT(*)
          FROM stripe_webhook_events
          WHERE processing_status IN ('failed', 'dead_letter')
            AND updated_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)
        ) AS failed_webhooks_last_24h,
        (SELECT MAX(received_at) FROM stripe_webhook_events) AS last_webhook_received_at,
        (SELECT MAX(processed_at) FROM stripe_webhook_events) AS last_webhook_processed_at
    `);

    const row = rows[0];
    return {
      total_customers: toNumber(row?.total_customers),
      total_external_subscriptions: toNumber(row?.total_external_subscriptions),
      dead_letter_count: toNumber(row?.dead_letter_count),
      failed_webhooks_last_24h: toNumber(row?.failed_webhooks_last_24h),
      last_webhook_received_at: row?.last_webhook_received_at ? row.last_webhook_received_at.toISOString() : null,
      last_webhook_processed_at: row?.last_webhook_processed_at ? row.last_webhook_processed_at.toISOString() : null,
    };
  }

  async getStripeSubscriptions(query: PlatformStripeListQuery): Promise<PlatformStripeSubscriptionsListDto> {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.page_size || 20)));
    const offset = (page - 1) * pageSize;
    const search = query.search?.trim();

    const whereConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];
    if (search) {
      const like = `%${search}%`;
      whereConditions.push(
        Prisma.sql`(
          c.name LIKE ${like}
          OR e.stripe_customer_id LIKE ${like}
          OR e.stripe_subscription_id LIKE ${like}
          OR COALESCE(e.stripe_price_id, '') LIKE ${like}
        )`,
      );
    }
    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;

    const [rows, countRows] = await Promise.all([
      db.$queryRaw<StripeSubscriptionRow[]>(Prisma.sql`
        SELECT
          c.name AS company_name,
          e.stripe_customer_id,
          e.stripe_subscription_id,
          e.stripe_price_id,
          e.status AS external_status,
          e.current_period_end,
          e.cancel_at_period_end,
          e.last_event_created_at
        FROM billing_subscriptions_external e
        JOIN companies c ON c.id = e.company_id
        ${whereClause}
        ORDER BY e.updated_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      db.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM billing_subscriptions_external e
        JOIN companies c ON c.id = e.company_id
        ${whereClause}
      `),
    ]);

    const total = toNumber(countRows[0]?.total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: rows.map((row) => ({
        company_name: row.company_name,
        stripe_customer_id: row.stripe_customer_id,
        stripe_subscription_id: row.stripe_subscription_id,
        stripe_price_id: row.stripe_price_id,
        external_status: row.external_status,
        current_period_end: row.current_period_end ? row.current_period_end.toISOString() : null,
        cancel_at_period_end: Boolean(row.cancel_at_period_end),
        last_event_created_at: row.last_event_created_at ? row.last_event_created_at.toISOString() : null,
      })),
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    };
  }

  async getStripeWebhooks(query: PlatformStripeListQuery): Promise<PlatformStripeWebhooksListDto> {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.page_size || 20)));
    const offset = (page - 1) * pageSize;
    const search = query.search?.trim();
    const status = (query.status || "all").trim().toLowerCase();

    const whereConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];
    if (search) {
      const like = `%${search}%`;
      whereConditions.push(Prisma.sql`(w.event_id LIKE ${like} OR w.event_type LIKE ${like})`);
    }
    if (status !== "all") {
      whereConditions.push(Prisma.sql`w.processing_status = ${status}`);
    }
    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;

    const [rows, countRows] = await Promise.all([
      db.$queryRaw<StripeWebhookRow[]>(Prisma.sql`
        SELECT
          w.event_id,
          w.event_type,
          w.processing_status,
          w.attempt_count,
          w.last_error,
          w.received_at
        FROM stripe_webhook_events w
        ${whereClause}
        ORDER BY w.received_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      db.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM stripe_webhook_events w
        ${whereClause}
      `),
    ]);

    const total = toNumber(countRows[0]?.total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: rows.map((row) => ({
        event_id: row.event_id,
        event_type: row.event_type,
        processing_status: row.processing_status,
        attempt_count: row.attempt_count,
        last_error: row.last_error,
        received_at: row.received_at.toISOString(),
      })),
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    };
  }

  async getCheckoutSessions(query: PlatformStripeListQuery): Promise<PlatformStripeCheckoutSessionsListDto> {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.page_size || 20)));
    const offset = (page - 1) * pageSize;
    const search = query.search?.trim();
    const status = (query.status || "all").trim().toLowerCase();

    const whereConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];
    if (search) {
      const like = `%${search}%`;
      whereConditions.push(
        Prisma.sql`(c.name LIKE ${like} OR s.target_plan_code LIKE ${like} OR s.target_interval LIKE ${like})`,
      );
    }
    if (status !== "all") {
      whereConditions.push(Prisma.sql`s.status = ${status}`);
    }
    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;

    const [rows, countRows] = await Promise.all([
      db.$queryRaw<StripeCheckoutSessionRow[]>(Prisma.sql`
        SELECT
          c.name AS company_name,
          s.target_plan_code,
          s.target_interval AS interval_value,
          s.status,
          s.created_at,
          s.expires_at
        FROM billing_checkout_sessions s
        JOIN companies c ON c.id = s.company_id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      db.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM billing_checkout_sessions s
        JOIN companies c ON c.id = s.company_id
        ${whereClause}
      `),
    ]);

    const total = toNumber(countRows[0]?.total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: rows.map((row) => ({
        company_name: row.company_name,
        target_plan_code: row.target_plan_code,
        interval: row.interval_value,
        status: row.status,
        created_at: row.created_at.toISOString(),
        expires_at: row.expires_at ? row.expires_at.toISOString() : null,
      })),
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    };
  }
}
