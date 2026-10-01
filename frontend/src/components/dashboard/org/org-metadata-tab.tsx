"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { OrgAvatar } from "./org-avatar"
import { DicebearGlassPicker } from "./dicebear-glass-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface OrgMetadataTabProps {
  activeOrg: {
    id: string
    name: string
    slug: string
    logo?: string | null
    members?: Array<{
      id: string
      userId: string
      role: string
    }>
  }
}

export function OrgMetadataTab({ activeOrg }: OrgMetadataTabProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const { refetch: refetchActiveOrg } = authClient.useActiveOrganization()
  const { refetch: refetchOrgs } = authClient.useListOrganizations()

  const [name, setName] = React.useState(activeOrg.name || "")
  const [logo, setLogo] = React.useState<string | null>(activeOrg.logo || null)
  const [isPickerOpen, setIsPickerOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const currentMember = activeOrg.members?.find(
    (m) => m.userId === session?.user?.id
  )
  const userRole = currentMember?.role || "viewer"
  const canEdit = userRole === "owner" || userRole === "editor"

  React.useEffect(() => {
    setName(activeOrg.name || "")
    setLogo(activeOrg.logo || null)
  }, [activeOrg.name, activeOrg.logo])

  const handleSelectLogo = (newLogoUrl: string | null) => {
    setLogo(newLogoUrl)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canEdit) {
      toast.error("You do not have permission to edit this organisation")
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Organisation name cannot be empty")
      return
    }

    setIsSaving(true)
    try {
      const res = await authClient.organization.update({
        data: {
          name: trimmedName,
          slug: activeOrg.slug,
          logo: logo || null,
        },
        organizationId: activeOrg.id,
      })

      if (res?.error) {
        throw new Error(res.error.message || "Failed to update organisation")
      }

      toast.success("Organisation updated")
      // Immediately refetch Better Auth state and invalidate React Query queries so changes reflect everywhere
      await Promise.allSettled([
        refetchActiveOrg?.(),
        refetchOrgs?.(),
        queryClient.invalidateQueries(),
      ])
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update organisation"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    name.trim() !== (activeOrg.name || "").trim() ||
    logo !== (activeOrg.logo || null)

  return (
    <div className="max-w-2xl space-y-8">
      {/* Avatar Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Organisation Logo</Label>
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <OrgAvatar
            name={name || activeOrg.name}
            logo={logo}
            className="size-16 rounded-xl border border-border shadow-xs text-base shrink-0"
            fallbackClassName="rounded-xl text-lg font-semibold"
          />

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
                disabled={isSaving}
                className="text-sm h-9"
              >
                Change avatar
              </Button>
              {logo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogo(null)}
                  disabled={isSaving}
                  className="text-sm text-muted-foreground hover:text-destructive h-9"
                >
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Name Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-sm font-medium">
            Organisation Name
          </Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            disabled={!canEdit || isSaving}
            className="h-10 text-sm"
            required
          />
        </div>

        {canEdit && (
          <div className="pt-2">
            <Button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="w-full sm:w-auto h-10 px-5 text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Avatar Picker Dialog */}
      <DicebearGlassPicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        currentLogo={logo}
        onSelectLogo={handleSelectLogo}
      />
    </div>
  )
}
