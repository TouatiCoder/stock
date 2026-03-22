import { checkAuth } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import ConcreteCalculatorClient from "./page.client";

export default async function ConcreteCalculatorPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  if (!["structural_engineer", "site_manager"].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded border bg-white p-6">
          <h1 className="text-xl font-semibold text-red-600">403 Forbidden</h1>
          <p className="mt-2 text-sm text-gray-600">
            You are not allowed to access the concrete calculator.
          </p>
        </div>
      </div>
    );
  }

  return <ConcreteCalculatorClient />;
}
