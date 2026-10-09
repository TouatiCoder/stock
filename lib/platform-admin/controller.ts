import { NextResponse } from "next/server";
import { PlatformAdminService } from "@/lib/platform-admin/service";
import type { PlatformCompaniesQuery } from "@/lib/platform-admin/types";
import type { PlatformStripeListQuery } from "@/lib/platform-admin/types";
import { csvFileName, toCsvFile } from "@/lib/platform-admin/csv";

const service = new PlatformAdminService();

export interface CompaniesCsvHeaders {
  name: string;
  id: string;
  status: string;
  subscription: string;
  trialEndsAt: string;
  lastPayment: string;
  createdAt: string;
}

export class PlatformAdminController {
  static async dashboard() {
    const data = await service.getDashboard();
    return NextResponse.json(data);
  }

  static async companies(query: PlatformCompaniesQuery) {
    const data = await service.getCompanies(query);
    return NextResponse.json(data);
  }

  static async suspendCompany(companyId: string, reason: string, actorUserId: string) {
    await service.suspendCompany(companyId, reason, actorUserId);
    return NextResponse.json({ success: true });
  }

  static async activateCompany(companyId: string, actorUserId: string) {
    await service.activateCompany(companyId, actorUserId);
    return NextResponse.json({ success: true });
  }

  static async companyDetail(companyId: string) {
    const data = await service.getCompanyDetail(companyId);
    if (!data) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  static async growth(months: number) {
    const data = await service.getGrowthSeries(months);
    return NextResponse.json(data);
  }

  static async companiesCsv(query: PlatformCompaniesQuery, headers: CompaniesCsvHeaders) {
    const items = await service.getCompaniesForExport(query);
    const csv = toCsvFile(items, [
      { header: headers.name, value: (row) => row.name },
      { header: headers.id, value: (row) => row.id },
      { header: headers.status, value: (row) => row.status },
      { header: headers.subscription, value: (row) => row.subscription_status },
      { header: headers.trialEndsAt, value: (row) => row.trial_ends_at?.slice(0, 10) ?? "" },
      { header: headers.lastPayment, value: (row) => row.last_payment_status },
      { header: headers.createdAt, value: (row) => row.created_at.slice(0, 10) },
    ]);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${csvFileName("companies")}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  static async subscriptions() {
    const data = await service.getSubscriptionsOverview();
    return NextResponse.json(data);
  }

  static async stripeOverview() {
    const data = await service.getStripeOverview();
    return NextResponse.json(data);
  }

  static async stripeSubscriptions(query: PlatformStripeListQuery) {
    const data = await service.getStripeSubscriptions(query);
    return NextResponse.json(data);
  }

  static async stripeWebhooks(query: PlatformStripeListQuery) {
    const data = await service.getStripeWebhooks(query);
    return NextResponse.json(data);
  }

  static async stripeCheckoutSessions(query: PlatformStripeListQuery) {
    const data = await service.getCheckoutSessions(query);
    return NextResponse.json(data);
  }
}
