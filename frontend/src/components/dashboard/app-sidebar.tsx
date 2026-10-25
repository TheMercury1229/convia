"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  LayoutTemplate,
  Inbox,
  BarChart3,
  User,
  Settings2,
  CreditCard,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { OrgSwitcher } from "./org-switcher";
import { CreditBadge } from "@/components/billing/credit-badge";
import { authClient } from "@/lib/auth-client";

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const mainNavItems = [
  { title: "Home", href: "/home", icon: Home },
  { title: "My Forms", href: "/my-forms", icon: FileText },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
  { title: "Responses", href: "/responses", icon: Inbox },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Profile", href: "/profile", icon: User },
];

const ownerNavItems = [
  { title: "Org Settings", href: "/org-settings", icon: Settings2 },
  { title: "Billing & Plans", href: "/billing", icon: CreditCard },
];

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();

  const { data: session } = authClient.useSession();
  const { data: activeMember } = authClient.useActiveOrganization();

  // Show org-settings for owners and editors
  const currentRole = (activeMember as any)?.members?.find(
    (m: any) => m.userId === session?.user?.id
  )?.role;
  const canManageOrg = currentRole === "owner" || currentRole === "editor";

  return (
    <Sidebar collapsible="icon">
      {/* ------------------------------------------------------------------ */}
      {/* Header — Logo (collapsible shrink support)                         */}
      {/* ------------------------------------------------------------------ */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border/50 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Link
          href="/home"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md group-data-[collapsible=icon]:justify-center"
        >
          <Image
            src="/logo.svg"
            alt="Convia"
            width={160}
            height={48}
            className="h-8 w-auto transition-all dark:hidden group-data-[collapsible=icon]:!hidden"
            priority
          />
          <Image
            src="/logo-white.svg"
            alt="Convia"
            width={160}
            height={48}
            className="h-8 w-auto transition-all hidden dark:block group-data-[collapsible=icon]:!hidden"
            priority
          />
          <Image
            src="/favicon.svg"
            alt="Convia"
            width={28}
            height={28}
            className="hidden size-7 transition-all group-data-[collapsible=icon]:!block"
            priority
          />
        </Link>
      </SidebarHeader>

      {/* ------------------------------------------------------------------ */}
      {/* Main Nav                                                            */}
      {/* ------------------------------------------------------------------ */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management section (owners & editors) */}
        {canManageOrg && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Organisation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ownerNavItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ------------------------------------------------------------------ */}
      {/* Footer — Org switcher + sleek credit indicator                     */}
      {/* ------------------------------------------------------------------ */}
      <SidebarFooter className="p-2 gap-1.5">
        <OrgSwitcher />
        <CreditBadge variant="sidebar" />
      </SidebarFooter>
    </Sidebar>
  );
}
