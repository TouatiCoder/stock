import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { t } from "@/lib/server-i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isPlatformAdmin) redirect("/dashboard");

  const [badge, title, dashboardLabel, subscriptionsLabel, stripeOpsLabel, paymentsLabel, manualPaymentsLabel, accessLabel, logoutLabel] =
    await Promise.all([
      t("platform", "layout.badge"),
      t("platform", "layout.title"),
      t("platform", "layout.nav.dashboard"),
      t("platform", "layout.nav.subscriptions"),
      t("platform", "layout.nav.stripeOps"),
      t("platform", "layout.nav.payments"),
      t("platform", "layout.nav.manualPayments"),
      t("platform", "layout.nav.access"),
      t("platform", "layout.nav.logout"),
    ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0">
            <p className="text-xs uppercase tracking-wide text-gray-500">{badge}</p>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/platform" className="text-gray-700 hover:text-gray-900">
              {dashboardLabel}
            </Link>
            <Link href="/platform/subscriptions" className="text-gray-700 hover:text-gray-900">
              {subscriptionsLabel}
            </Link>
            <Link href="/platform/billing/stripe" className="text-gray-700 hover:text-gray-900">
              {stripeOpsLabel}
            </Link>
            <Link href="/platform/settings/payments" className="text-gray-700 hover:text-gray-900">
              {paymentsLabel}
            </Link>
            <Link href="/platform/billing/manual-payments" className="text-gray-700 hover:text-gray-900">
              {manualPaymentsLabel}
            </Link>
            <Link href="/platform/settings/access" className="text-gray-700 hover:text-gray-900">
              {accessLabel}
            </Link>
            <LanguageSwitcher />
            <form action={logoutAction}>
              <button type="submit" className="text-gray-700 hover:text-gray-900">
                {logoutLabel}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
