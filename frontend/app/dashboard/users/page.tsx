import { Card } from "@/components/ui/card"
import { UsersList } from "@/components/users/users-list"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500">Manage team members and permissions</p>
        </div>
        <InviteUserDialog />
      </div>

      <Card>
        <UsersList />
      </Card>
    </div>
  )
}
