'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImageKitProvider } from '@imagekit/next'
import { authClient } from '@/lib/auth-client'

/**
 * Listens for active organization changes and immediately invalidates
 * the query cache so that the UI re-fetches new organization data with zero lag.
 */
function OrgQuerySync() {
  const queryClient = useQueryClient()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const prevOrgIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const currentOrgId = activeOrg?.id
    if (
      prevOrgIdRef.current !== undefined &&
      currentOrgId &&
      prevOrgIdRef.current !== currentOrgId
    ) {
      // Active org switched: invalidate all queries so UI immediately refetches
      queryClient.invalidateQueries()
    }
    prevOrgIdRef.current = currentOrgId
  }, [activeOrg?.id, queryClient])

  return null
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30s fresh
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <OrgQuerySync />
      <ThemeProvider>
        <TooltipProvider>
          <ImageKitProvider
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ''}
          >
            {children}
            <Toaster richColors />
          </ImageKitProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

