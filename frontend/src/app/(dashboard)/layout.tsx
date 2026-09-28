import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dashboard/dynamic-breadcrumb";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { UserButton } from "@/components/dashboard/user-button";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* ---------------------------------------------------------------- */}
        {/* Top bar                                                           */}
        {/* ---------------------------------------------------------------- */}
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
          {/* Trigger (hamburger / collapse icon) */}
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 h-4 data-vertical:h-4 data-vertical:self-center"
          />

          {/* Breadcrumb */}
          <DynamicBreadcrumb />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right actions: Mode toggle + User button */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserButton />
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Page content                                                       */}
        {/* ---------------------------------------------------------------- */}
        <main className="flex flex-1 flex-col gap-4 p-4 pt-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
