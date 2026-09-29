'use client'
import React, { useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImageKitProvider } from '@imagekit/next'

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
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

