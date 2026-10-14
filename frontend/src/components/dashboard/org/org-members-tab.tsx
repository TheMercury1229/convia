"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { InviteMembersDialog } from "./invite-members-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Search,
  UserPlus,
  Users,
  Mail,
  Trash2,
  Loader2,
  Clock,
  XCircle,
  RotateCw,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface MemberUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface OrgMember {
  id: string
  userId: string
  role: string
  createdAt: Date | string
  user?: MemberUser
}

interface OrgInvitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date | string
  createdAt: Date | string
  inviterId?: string
}

interface OrgMembersTabProps {
  activeOrg: {
    id: string
    name: string
    members?: OrgMember[]
    invitations?: OrgInvitation[]
  }
}

export function OrgMembersTab({ activeOrg }: OrgMembersTabProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { refetch: refetchActiveOrg } = authClient.useActiveOrganization()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)

  // Loading states
  const [updatingMemberId, setUpdatingMemberId] = React.useState<string | null>(null)
  const [cancelingInviteId, setCancelingInviteId] = React.useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = React.useState<string | null>(null)

  // Local invitations state initialized from activeOrg
  const [invitationsList, setInvitationsList] = React.useState<OrgInvitation[]>(
    activeOrg.invitations || []
  )

  React.useEffect(() => {
    setInvitationsList(activeOrg.invitations || [])
  }, [activeOrg.invitations])

  // Remove member dialog state
  const [memberToRemove, setMemberToRemove] = React.useState<OrgMember | null>(null)
  const [isRemovingMember, setIsRemovingMember] = React.useState(false)

  const members = activeOrg.members || []

  // Only consider active invitations (exclude canceled, rejected, or accepted)
  const activeInvitations = React.useMemo(() => {
    return invitationsList.filter(
      (inv) =>
        inv.status !== "canceled" &&
        inv.status !== "rejected" &&
        inv.status !== "accepted"
    )
  }, [invitationsList])

  // Current user's role
  const currentMember = members.find((m) => m.userId === session?.user?.id)
  const currentRole = currentMember?.role || "viewer"
  const isOwner = currentRole === "owner"
  const isEditor = currentRole === "editor" || currentRole === "admin"
  const canInvite = isOwner || isEditor // Only admin and owner can invite, NOT viewer
  const canManage = isOwner || isEditor

  // Filter members
  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      const name = (m.user?.name || "").toLowerCase()
      const email = (m.user?.email || "").toLowerCase()
      const query = searchQuery.trim().toLowerCase()

      const matchesSearch = !query || name.includes(query) || email.includes(query)
      const matchesRole = roleFilter === "all" || m.role.toLowerCase() === roleFilter.toLowerCase()

      return matchesSearch && matchesRole
    })
  }, [members, searchQuery, roleFilter])

  // Filter invitations
  const filteredInvitations = React.useMemo(() => {
    return activeInvitations.filter((inv) => {
      const email = inv.email.toLowerCase()
      const query = searchQuery.trim().toLowerCase()

      const matchesSearch = !query || email.includes(query)
      const matchesRole = roleFilter === "all" || inv.role?.toLowerCase() === roleFilter.toLowerCase()

      return matchesSearch && matchesRole
    })
  }, [activeInvitations, searchQuery, roleFilter])

  // Change member role
  const handleRoleChange = async (member: OrgMember, newRole: string) => {
    if (member.role === newRole) return

    if (!isOwner) {
      toast.error("Only organisation owners can change member roles")
      return
    }

    setUpdatingMemberId(member.id)
    try {
      const res = await authClient.organization.updateMemberRole({
        memberId: member.id,
        role: newRole,
        organizationId: activeOrg.id,
      })

      if (res?.error) {
        throw new Error(res.error.message || "Failed to update member role")
      }

      toast.success(`Role updated to ${newRole}`)
      await refetchActiveOrg?.()
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update role"
      toast.error(message)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  // Remove member
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return

    setIsRemovingMember(true)
    try {
      const res = await authClient.organization.removeMember({
        memberIdOrEmail: memberToRemove.id,
        organizationId: activeOrg.id,
      })

      if (res?.error) {
        throw new Error(res.error.message || "Failed to remove member")
      }

      toast.success(
        `${memberToRemove.user?.name || memberToRemove.user?.email || "Member"} removed`
      )
      setMemberToRemove(null)
      await refetchActiveOrg?.()
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member"
      toast.error(message)
    } finally {
      setIsRemovingMember(false)
    }
  }

  // Cancel / Revoke invitation
  const handleCancelInvitation = async (invitationId: string) => {
    setCancelingInviteId(invitationId)
    try {
      const res = await authClient.organization.cancelInvitation({
        invitationId,
      })

      if (res?.error) {
        throw new Error(res.error.message || "Failed to cancel invitation")
      }

      // Immediately remove from UI list so it is no longer listed
      setInvitationsList((prev) => prev.filter((inv) => inv.id !== invitationId))
      toast.success("Invitation revoked successfully")
      await refetchActiveOrg?.()
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel invitation"
      toast.error(message)
    } finally {
      setCancelingInviteId(null)
    }
  }

  // Resend invitation (for expired or pending invites)
  const handleResendInvitation = async (invitation: OrgInvitation) => {
    setResendingInviteId(invitation.id)
    try {
      // 1. Cancel the previous expired invitation
      await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      })

      // 2. Re-invite member to generate fresh token and email
      const res = await authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role as any,
        organizationId: activeOrg.id,
        resend: true,
      })

      if (res?.error) {
        throw new Error(res.error.message || "Failed to resend invitation")
      }

      toast.success(`Invitation resent to ${invitation.email}`)

      // 3. Update local state with the refreshed invitation
      if (res?.data) {
        const newInvitation = res.data as OrgInvitation
        setInvitationsList((prev) => [
          ...prev.filter((inv) => inv.id !== invitation.id),
          newInvitation,
        ])
      } else {
        setInvitationsList((prev) =>
          prev.map((inv) =>
            inv.id === invitation.id
              ? {
                  ...inv,
                  expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
                  status: "pending",
                }
              : inv
          )
        )
      }

      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend invitation"
      toast.error(message)
    } finally {
      setResendingInviteId(null)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "default"
      case "editor":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Tabs defaultValue="members" className="space-y-5">
      {/* Top Bar: Tabs on left, Invite button on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabsList className="grid grid-cols-2 w-full sm:w-fit sm:inline-flex h-10 p-1 rounded-full gap-1">
          <TabsTrigger
            value="members"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium gap-2 sm:flex-initial data-active:shadow-xs"
          >
            <Users className="size-4 shrink-0" />
            <span>Members</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
              {members.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium gap-2 sm:flex-initial data-active:shadow-xs"
          >
            <Mail className="size-4 shrink-0" />
            <span>Invitations</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
              {activeInvitations.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {canInvite && (
          <Button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="w-full sm:w-auto gap-2 h-10 px-4 text-sm font-medium shrink-0"
          >
            <UserPlus className="size-4" />
            Invite members
          </Button>
        )}
      </div>

      {/* Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-10 text-sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="editor">Editors</SelectItem>
            <SelectItem value="viewer">Viewers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TAB 1: MEMBERS */}
      <TabsContent value="members" className="space-y-3 focus-visible:outline-none">
        {filteredMembers.length > 0 ? (
          <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
            {filteredMembers.map((member) => {
              const isCurrentUser = member.userId === session?.user?.id
              const memberName = member.user?.name || "Unnamed User"
              const memberEmail = member.user?.email || "No email"
              const initials =
                memberName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"

              const joinDate = member.createdAt
                ? format(new Date(member.createdAt), "MMM d, yyyy")
                : ""

              const isUpdatingThisMember = updatingMemberId === member.id

              const cannotChangeRole =
                !isOwner ||
                isUpdatingThisMember ||
                (isCurrentUser && isOwner && members.filter((m) => m.role === "owner").length === 1)

              const canRemoveThisMember =
                canManage &&
                !isCurrentUser &&
                (isOwner || member.role !== "owner")

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 sm:gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10 rounded-full border border-border/60 shrink-0">
                      <AvatarImage src={member.user?.image || undefined} alt={memberName} />
                      <AvatarFallback className="text-xs font-semibold bg-muted">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {memberName}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 shrink-0">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {memberEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-border/30 sm:border-0">
                    {joinDate && (
                      <span className="text-xs text-muted-foreground hidden md:inline shrink-0">
                        Joined {joinDate}
                      </span>
                    )}

                    <div className="flex-1 sm:flex-initial sm:w-[125px]">
                      {isOwner ? (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleRoleChange(member, newRole)}
                          disabled={cannotChangeRole}
                        >
                          <SelectTrigger className="h-9 text-xs w-full">
                            {isUpdatingThisMember ? (
                              <Loader2 className="size-3 animate-spin mx-auto text-muted-foreground" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer" className="text-xs">
                              Viewer
                            </SelectItem>
                            <SelectItem value="editor" className="text-xs">
                              Editor
                            </SelectItem>
                            <SelectItem value="owner" className="text-xs">
                              Owner
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center justify-center h-9 px-3 rounded-xl border border-border/60 bg-muted/30 text-xs font-medium capitalize text-muted-foreground select-none">
                          {member.role}
                        </div>
                      )}
                    </div>

                    {canRemoveThisMember ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        title="Remove member"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <div className="size-9 hidden sm:block shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed border-border/80 bg-muted/10 p-6 space-y-2">
            <Users className="size-8 mx-auto text-muted-foreground/60" />
            <div className="text-sm font-medium text-foreground">No members found</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || roleFilter !== "all"
                ? "Try adjusting your search query or role filter."
                : "No members found in this organisation."}
            </p>
          </div>
        )}
      </TabsContent>

      {/* TAB 2: INVITATIONS */}
      <TabsContent value="invitations" className="space-y-3 focus-visible:outline-none">
        {filteredInvitations.length > 0 ? (
          <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
            {filteredInvitations.map((invitation) => {
              const isCanceling = cancelingInviteId === invitation.id
              const expiresFormatted = invitation.expiresAt
                ? formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })
                : ""

              const isExpired =
                invitation.expiresAt && new Date(invitation.expiresAt) < new Date()

              return (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 sm:gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/60 mt-0.5 sm:mt-0">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-medium text-sm text-foreground truncate max-w-[180px] xs:max-w-[240px] sm:max-w-none">
                          {invitation.email}
                        </span>
                        <Badge
                          variant={getRoleBadgeVariant(invitation.role)}
                          className="text-[10px] py-0 px-2 h-4 capitalize shrink-0"
                        >
                          {invitation.role}
                        </Badge>
                        {isExpired ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4 shrink-0">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0">
                            Pending
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        <span className="truncate">
                          {isExpired ? "Expired" : `Expires ${expiresFormatted}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="w-full sm:w-auto pt-2 sm:pt-0 border-t border-border/30 sm:border-0 flex items-center justify-end gap-2 shrink-0">
                      {isExpired && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation)}
                          disabled={resendingInviteId === invitation.id || cancelingInviteId === invitation.id}
                          className="w-full sm:w-auto text-xs h-8 text-primary hover:bg-primary/10 hover:text-primary border-primary/40 font-medium"
                        >
                          {resendingInviteId === invitation.id ? (
                            <Loader2 className="size-3 animate-spin mr-1.5" />
                          ) : (
                            <RotateCw className="size-3.5 mr-1.5" />
                          )}
                          Resend
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={cancelingInviteId === invitation.id || resendingInviteId === invitation.id}
                        className="w-full sm:w-auto text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-border/80"
                      >
                        {cancelingInviteId === invitation.id ? (
                          <Loader2 className="size-3 animate-spin mr-1.5" />
                        ) : (
                          <XCircle className="size-3.5 mr-1.5" />
                        )}
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed border-border/80 bg-muted/10 p-6 space-y-2">
            <Mail className="size-8 mx-auto text-muted-foreground/60" />
            <div className="text-sm font-medium text-foreground">
              No pending invitations
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || roleFilter !== "all"
                ? "No invitations match your current filters."
                : "All sent invitations have been accepted or no invitations are pending."}
            </p>
          </div>
        )}
      </TabsContent>

      {/* Invite Members Modal Dialog */}
      <InviteMembersDialog
        open={isInviteOpen && canInvite}
        onOpenChange={setIsInviteOpen}
        organizationId={activeOrg.id}
        isOwner={isOwner}
        onSuccess={() => router.refresh()}
      />

      {/* Remove Member Confirmation Alert Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {memberToRemove?.user?.name || memberToRemove?.user?.email || "this member"}
              </strong>{" "}
              from this organisation? They will immediately lose access to all organisation forms,
              templates, and analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isRemovingMember} className="w-full sm:w-auto text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemovingMember}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              {isRemovingMember ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
