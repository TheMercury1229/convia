"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"
import { PageHeading } from "@/components/dashboard/page-heading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrgMetadataTab, OrgMembersTab, CreateOrgDialog } from "@/components/dashboard/org"
import { Button } from "@/components/ui/button"
import { Building2, Users, Loader2, PlusCircle, ShieldAlert } from "lucide-react"

export default function OrgSettingsPage() {
  const { data: activeOrg, isPending } = authClient.useActiveOrganization()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  if (isPending) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <PageHeading
          title="Organisation Settings"
          description="Manage your organisation profile, team members, and permissions."
        />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!activeOrg) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <PageHeading
          title="Organisation Settings"
          description="Manage your organisation profile, team members, and permissions."
        />

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 sm:p-12 text-center space-y-4">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <Building2 className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              No Active Organisation Selected
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Please choose an organisation from the sidebar switcher or create a new one to
              manage its settings.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto gap-2 text-sm h-10 px-4"
          >
            <PlusCircle className="size-4" />
            Create Organisation
          </Button>

          <CreateOrgDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Reusable Extracted Page Heading Component */}
      <PageHeading
        title="Organisation Settings"
        description="Manage your organisation profile, members, and access roles."
      />

      {/* Two-Tab Navigation */}
      <Tabs defaultValue="metadata" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full sm:w-fit sm:inline-flex h-10 p-1 rounded-full gap-1">
          <TabsTrigger
            value="metadata"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium gap-2 sm:flex-initial data-active:shadow-xs"
          >
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">Organisation Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium gap-2 sm:flex-initial data-active:shadow-xs"
          >
            <Users className="size-4 shrink-0" />
            <span className="truncate">Members & Access</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Organization Metadata */}
        <TabsContent value="metadata" className="focus-visible:outline-none">
          <OrgMetadataTab activeOrg={activeOrg as any} />
        </TabsContent>

        {/* Tab 2: Members & Invitations */}
        <TabsContent value="members" className="focus-visible:outline-none">
          <OrgMembersTab activeOrg={activeOrg as any} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
