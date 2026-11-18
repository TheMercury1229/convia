"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Module-level deduplication lock so concurrent callers of useOrganization()
// share a single sync cycle rather than firing duplicate requests.
let initPromise: Promise<void> | null = null;

async function syncOrganization(
  refetchActiveOrg?: () => Promise<void>,
  refetchOrgs?: () => Promise<void>,
  invalidate?: () => Promise<void>,
) {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Fetch user's organisations
      const orgListRes = await authClient.organization.list();
      const orgs = orgListRes.data;

      if (orgs && orgs.length > 0) {
        // 2. Set active organisation to the default/first org
        await authClient.organization.setActive({ organizationId: orgs[0].id });

        // 3. Send request to getFullOrganization
        await authClient.organization.getFullOrganization();

        // 4. Update Better-Auth atoms
        await Promise.allSettled([
          refetchActiveOrg?.(),
          refetchOrgs?.(),
        ]);

        // 5. Invalidate TanStack query cache so forms and data load immediately
        if (invalidate) {
          await invalidate();
        }
      }
    } catch (err) {
      console.error("[useOrganization] Failed to sync organisation:", err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Manages the active organisation, org switching, and automatic initialisation.
 *
 * Ensures that upon signup or signin (or direct navigation to /home), requests
 * are dispatched to fetch organisations, set the active organisation, and fetch
 * the full organisation data so dashboard queries load without requiring a page refresh.
 */
export function useOrganization() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const {
    data: activeOrg,
    isPending: activeOrgLoading,
    refetch: refetchActiveOrg,
  } = authClient.useActiveOrganization();
  const {
    data: orgs,
    isPending: orgsLoading,
    refetch: refetchOrgs,
  } = authClient.useListOrganizations();

  const [isSwitching, setIsSwitching] = useState(false);
  const prevOrgIdRef = useRef<string | undefined>(undefined);

  // 1. React Query cache invalidation whenever active organisation changes
  useEffect(() => {
    const currentOrgId = activeOrg?.id;
    if (currentOrgId && prevOrgIdRef.current !== currentOrgId) {
      queryClient.invalidateQueries();
    }
    prevOrgIdRef.current = currentOrgId;
  }, [activeOrg?.id, queryClient]);

  // 2. Auto-initialisation when user is authenticated but no active org is loaded
  useEffect(() => {
    if (sessionLoading || !session?.user || activeOrg?.id) {
      return;
    }

    syncOrganization(
      () => refetchActiveOrg?.() ?? Promise.resolve(),
      () => refetchOrgs?.() ?? Promise.resolve(),
      () => queryClient.invalidateQueries(),
    );
  }, [
    session?.user?.id,
    sessionLoading,
    activeOrg?.id,
    refetchActiveOrg,
    refetchOrgs,
    queryClient,
  ]);

  // 3. Explicit organisation switching
  const switchOrganization = useCallback(
    async (orgId: string) => {
      if (activeOrg?.id === orgId || isSwitching) return;
      setIsSwitching(true);
      try {
        await authClient.organization.setActive({ organizationId: orgId });
        await authClient.organization.getFullOrganization();
        await Promise.allSettled([
          refetchActiveOrg?.(),
          refetchOrgs?.(),
          queryClient.invalidateQueries(),
        ]);
        toast.success("Switched organisation");
        router.refresh();
      } catch (err) {
        console.error("[useOrganization] switchOrganization failed:", err);
        toast.error("Failed to switch organisation. Please try again.");
      } finally {
        setIsSwitching(false);
      }
    },
    [activeOrg?.id, isSwitching, queryClient, refetchActiveOrg, refetchOrgs, router],
  );

  return {
    orgs: orgs ?? [],
    activeOrg,
    isLoading: (sessionLoading || activeOrgLoading || orgsLoading) && !activeOrg?.id,
    isSwitching,
    switchOrganization,
    refetchOrgs,
  };
}
