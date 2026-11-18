'use client'

import React, { useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImageKitProvider } from '@imagekit/next'
import { useOrganization } from '@/hooks/use-organization'

/**
 * Listens for active organization changes and auto-activation at root,
 * immediately invalidating the query cache so that the UI re-fetches with zero lag.
 */
function OrgQuerySync() {
  useOrganization()
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

