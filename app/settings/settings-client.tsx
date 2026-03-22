"use client";

import { useState } from "react";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { AdminSettings } from "@/components/settings/admin-settings";
import { CompanySettings } from "@/components/settings/company-settings";
import { PaymentBillingSettings } from "@/components/settings/payment-billing-settings";
import { usePermissions } from "@/hooks/use-permissions";
import { useCommonTranslations } from "@/components/LocaleProvider";

interface SettingsClientProps {
  userData: unknown;
}

export default function SettingsClient({ userData: _userData }: SettingsClientProps) {
  const { hasPermission, hasRole } = usePermissions();
  const t = useCommonTranslations();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "company" | "users" | "billing">("profile");
  const canOpenAdminSettings = hasPermission("manage_users") || hasRole("admin");

  const tabs = [
    { id: "profile", label: t("profile") },
    { id: "security", label: t("security") },
    ...(hasPermission("view_settings") ? [{ id: "company", label: t("company") }] : []),
    ...(canOpenAdminSettings ? [{ id: "users", label: t("admin") }] : []),
    ...(canOpenAdminSettings ? [{ id: "billing", label: "Paiement & Billing" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "profile" | "security" | "company" | "users" | "billing")}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && <ProfileSettings />}
      {activeTab === "security" && <SecuritySettings />}
      {activeTab === "company" && hasPermission("view_settings") && <CompanySettings />}
      {activeTab === "users" && canOpenAdminSettings && <AdminSettings />}
      {activeTab === "billing" && canOpenAdminSettings && <PaymentBillingSettings />}
    </div>
  );
}
