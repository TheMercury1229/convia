"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, Check, PlusCircle, Loader2, Zap, ArrowUpRight } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { OrgAvatar } from "./org/org-avatar";
import { CreateOrgDialog } from "./org/create-org-dialog";
import { useOrganization } from "@/hooks/use-organization";
import { useOrgBilling } from "@/hooks/use-billing";

export function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const { data: billing } = useOrgBilling();

  const {
    orgs,
    activeOrg,
    isLoading: orgsLoading,
    isSwitching,
    switchOrganization,
  } = useOrganization();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const displayName =
    activeOrg?.name ?? (orgsLoading ? "Loading..." : "Select Organisation");
  const displaySlug = activeOrg?.slug;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {/* Org Avatar with initials */}
                <OrgAvatar
                  name={activeOrg?.name}
                  logo={activeOrg?.logo}
                />

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  {displaySlug && (
                    <span className="text-muted-foreground truncate text-xs">
                      /{displaySlug}
                    </span>
                  )}
                </div>
                {isSwitching ? (
                  <Loader2 className="ml-auto size-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organisations
              </DropdownMenuLabel>

              {orgs && orgs.length > 0 ? (
                orgs.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    className="gap-2 p-2 cursor-pointer"
                    onClick={() => switchOrganization(org.id)}
                  >
                    <OrgAvatar
                      name={org.name}
                      logo={org.logo}
                      className="size-6 rounded-md"
                      fallbackClassName="rounded-md bg-muted text-[10px] text-foreground"
                    />
                    <span className="flex-1 truncate">{org.name}</span>
                    {activeOrg?.id === org.id && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No organisations found
                </div>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setOpenCreateDialog(true);
                }}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <PlusCircle className="size-4" />
                </div>
                <span className="text-muted-foreground font-medium">
                  New organisation
                </span>
              </DropdownMenuItem>

              {billing && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Zap className="size-3.5 text-primary fill-primary/20" />
                        Credits
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {billing.creditsRemaining}{" "}
                        <span className="text-muted-foreground font-normal">
                          / {billing.creditsTotal}
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (billing.creditsRemaining / billing.creditsTotal) *
                              100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="capitalize text-muted-foreground font-medium">
                        {billing.plan} Plan
                      </span>
                      <Link
                        href="/billing"
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                      >
                        Manage
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Standalone Create Organisation Dialog */}
      <CreateOrgDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
      />
    </>
  );
}
