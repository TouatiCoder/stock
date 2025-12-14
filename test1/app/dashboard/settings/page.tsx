import { getCurrentUser } from "@/lib/utils/auth"
import { Card } from "@/components/ui/card"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { CompanySettings } from "@/components/settings/company-settings"
import { SecuritySettings } from "@/components/settings/security-settings"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and application settings</p>
      </div>

      {user?.role === "admin" && (
        <Card>
          <CompanySettings />
        </Card>
      )}

      <Card>
        <ProfileSettings user={user} />
      </Card>

      <Card>
        <SecuritySettings />
      </Card>
    </div>
  )
}
