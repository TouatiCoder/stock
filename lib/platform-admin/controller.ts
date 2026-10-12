import { NextResponse } from "next/server";
import { PlatformAdminService } from "@/lib/platform-admin/service";
import type { PlatformCompaniesQuery } from "@/lib/platform-admin/types";
import type { PlatformStripeListQuery } from "@/lib/platform-admin/types";

const service = new PlatformAdminService();

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
