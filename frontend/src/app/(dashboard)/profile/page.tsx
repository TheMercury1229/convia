import { PageHeading } from "@/components/dashboard/page-heading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTab } from "@/components/dashboard/profile/profile-tab"
import { SessionsTab } from "@/components/dashboard/profile/sessions-tab"
import { User, Shield } from "lucide-react"

export const metadata = {
  title: "Profile & Account - Convia",
  description: "Manage your personal profile, credentials, and active device sessions.",
}

export default function ProfilePage() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <PageHeading
        title="Account Settings"
        description="Manage your personal details, security credentials, and active sessions."
      />

      {/* Two-Tab Navigation */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full sm:w-fit sm:inline-flex h-10 p-1 rounded-full gap-1">
          <TabsTrigger
            value="profile"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium gap-2 sm:flex-initial data-active:shadow-xs"
          >
            <User className="size-4 shrink-0" />
            <span className="truncate">Profile Settings</span>
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium gap-2 sm:flex-initial data-active:shadow-xs"
          >
            <Shield className="size-4 shrink-0" />
            <span className="truncate">Active Sessions</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Settings */}
        <TabsContent value="profile" className="focus-visible:outline-none">
          <ProfileTab />
        </TabsContent>

        {/* Tab 2: Sessions */}
        <TabsContent value="sessions" className="focus-visible:outline-none">
          <SessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
