"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Check, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { authClient } from "@/lib/auth-client";

export function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: orgs, isPending: orgsLoading, refetch: refetchOrgs } =
    authClient.useListOrganizations();
  const { data: activeOrg, refetch: refetchActiveOrg } =
    authClient.useActiveOrganization();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Auto-activate the first organisation if user has organisations but none is set active
  useEffect(() => {
    if (!activeOrg?.id && orgs && orgs.length > 0) {
      authClient.organization
        .setActive({ organizationId: orgs[0].id })
        .then(async () => {
          await Promise.allSettled([
            refetchActiveOrg?.(),
            refetchOrgs?.(),
            queryClient.resetQueries(),
          ]);
          router.refresh();
        })
        .catch(() => {});
    }
  }, [activeOrg, orgs, router, queryClient, refetchActiveOrg, refetchOrgs]);

  const handleSwitch = async (orgId: string) => {
    if (activeOrg?.id === orgId || isSwitching) return;
    setIsSwitching(true);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      toast.success("Switched organisation");
      // Refetch Better Auth state and reset React Query queries so cache clears and active queries refetch immediately
      await Promise.allSettled([
        refetchActiveOrg?.(),
        refetchOrgs?.(),
        queryClient.resetQueries(),
      ]);
      router.refresh();
    } catch {
      toast.error("Failed to switch organisation. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

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
                    onClick={() => handleSwitch(org.id)}
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
