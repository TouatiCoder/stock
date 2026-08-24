"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Trash2, User, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/mysql/auth-context"
import { toast } from "sonner"
import { useCommonTranslations, useSettingsTranslations } from "@/components/LocaleProvider"

type Invitation = {
  id: string
  email: string
  role: string
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
  invitedBy?: {
    firstName?: string | null
    lastName?: string | null
  } | null
}

export function AdminSettings() {
  const { user } = useAuth()
  const tCommon = useCommonTranslations()
  const tSettings = useSettingsTranslations()
  const [users, setUsers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInvitationsLoading, setIsInvitationsLoading] = useState(false)
  const [cancelingInvitationId, setCancelingInvitationId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteRole, setInviteRole] = useState("site_manager")
  const invitedUserEmails = new Set(
    invitations.map((inv) => inv.email.trim().toLowerCase())
  )
  const visibleUsers = users.filter((u) =>
    invitedUserEmails.has(String(u.email || "").trim().toLowerCase())
  )
  const isUsersTableLoading = isLoading || isInvitationsLoading

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/company/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users", error)
      toast.error(tSettings("usersLoadError"))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInvitations = async () => {
    if (!user?.companyId) return

    try {
      setIsInvitationsLoading(true)
      const res = await fetch(`/api/invitations?companyId=${encodeURIComponent(user.companyId)}`)
      if (!res.ok) throw new Error(tSettings("inviteError"))
      const data = await res.json()
      setInvitations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch invitations", error)
      toast.error(tSettings("inviteError"))
    } finally {
      setIsInvitationsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchInvitations()
  }, [user?.companyId])


  const handleDeleteUser = async (userId: string) => {
    if (!confirm(tSettings("deleteUserConfirm"))) return

    try {
      const res = await fetch(`/api/company/users/${userId}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || tSettings("deleteUserError"))
      }

      toast.success(tSettings("deleteUserSuccess"))
      setUsers(users.filter(u => u.id !== userId))
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsInviting(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email")
    const firstName = formData.get("firstName")
    const lastName = formData.get("lastName")

    try {
      const res = await fetch("/api/company/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          role: inviteRole,
          firstName,
          lastName
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || tSettings("inviteError"))

      toast.success(tSettings("inviteSuccess").replace("{email}", String(email)))
      setInviteRole("site_manager")
      setInviteOpen(false)
      fetchUsers()
      fetchInvitations()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setCancelingInvitationId(invitationId)
      const res = await fetch(`/api/invitations/${invitationId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tSettings("inviteError"))

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      toast.success(tSettings("invitationCanceled"))
    } catch (error: any) {
      toast.error(error.message || tSettings("invitationCancelError"))
    } finally {
      setCancelingInvitationId(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{tCommon("admin")}</Badge>
      case "site_manager":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{tCommon("siteManager")}</Badge>
      case "structural_engineer":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{tCommon("engineer")}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{tCommon("user")}</Badge>
    }
  }

  const getInvitationStatusBadge = (inv: Invitation) => {
    if (inv.acceptedAt) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{tSettings("invitationStatusAccepted")}</Badge>
    }

    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{tSettings("invitationStatusExpired")}</Badge>
    }

    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{tSettings("invitationStatusPending")}</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{tSettings("usersTitle")}</CardTitle>
            <CardDescription>{tSettings("usersDescription")}</CardDescription>
          </div>

          <Dialog
            open={inviteOpen}
            onOpenChange={(open) => {
              setInviteOpen(open)
              if (!open) setInviteRole("site_manager")
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {tSettings("inviteMember")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tSettings("inviteTitle")}</DialogTitle>
                <DialogDescription>
                  {tSettings("inviteDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{tSettings("firstName")}</Label>
                  <Input id="firstName" name="firstName" placeholder={tSettings("firstNamePlaceholder")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{tSettings("lastName")}</Label>
                  <Input id="lastName" name="lastName" placeholder={tSettings("lastNamePlaceholder")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{tSettings("workEmailLabel")}</Label>
                  <Input id="email" name="email" type="email" placeholder={tSettings("workEmailPlaceholder")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{tSettings("roleLabel")}</Label>
                  <Select name="role" value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="site_manager">{tCommon("siteManager")}</SelectItem>
                      <SelectItem value="structural_engineer">{tCommon("engineer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isInviting} className="w-full">
                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {tSettings("sendInvite")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {isUsersTableLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {tSettings("noUsersFound")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon("user")}</TableHead>
                  <TableHead>{tCommon("role")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {u.firstName ? u.firstName[0].toUpperCase() : <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.isActive ? "text-green-600 border-green-200 bg-green-50" : "text-yellow-600 border-yellow-200 bg-yellow-50"}>
                        {u.isActive ? tCommon("active") : tSettings("inviteSent")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user?.id !== u.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteUser(u.id)}
                          title={tSettings("deleteUserTooltip")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tSettings("invitationsTitle")}</CardTitle>
          <CardDescription>{tSettings("invitationsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isInvitationsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{tSettings("noInvitationsFound")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon("email")}</TableHead>
                  <TableHead>{tCommon("role")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead>{tSettings("invitedAt")}</TableHead>
                  <TableHead>{tSettings("expiresAt")}</TableHead>
                  <TableHead>{tSettings("invitedBy")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{getRoleBadge(inv.role)}</TableCell>
                    <TableCell>{getInvitationStatusBadge(inv)}</TableCell>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {(inv.invitedBy?.firstName || "") + " " + (inv.invitedBy?.lastName || "")}
                    </TableCell>
                    <TableCell className="text-right">
                      {!inv.acceptedAt && new Date(inv.expiresAt).getTime() >= Date.now() && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleCancelInvitation(inv.id)}
                          disabled={cancelingInvitationId === inv.id}
                          title={tSettings("cancelInvitation")}
                        >
                          {cancelingInvitationId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
