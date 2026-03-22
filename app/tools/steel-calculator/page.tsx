import { checkAuth } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import SteelCalculatorClient from "./page.client";

export default async function SteelCalculatorPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  if (user.role !== "structural_engineer") {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded border bg-white p-6">
          <h1 className="text-xl font-semibold text-red-600">403 Forbidden</h1>
          <p className="mt-2 text-sm text-gray-600">
            Only structural engineers can access the steel calculator.
          </p>
        </div>
      </div>
    );
  }

  return <SteelCalculatorClient />;
}
