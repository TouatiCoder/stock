import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-utils";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Platform Admin</p>
            <h1 className="text-lg font-semibold text-gray-900">Super Admin Console</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/platform" className="text-gray-700 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/platform/subscriptions" className="text-gray-700 hover:text-gray-900">
              Subscriptions
            </Link>
            <Link href="/platform/billing/stripe" className="text-gray-700 hover:text-gray-900">
              Stripe Ops
            </Link>
            <Link href="/platform/settings/payments" className="text-gray-700 hover:text-gray-900">
              Payments
            </Link>
            <Link href="/platform/settings/access" className="text-gray-700 hover:text-gray-900">
              Access
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-gray-700 hover:text-gray-900">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
