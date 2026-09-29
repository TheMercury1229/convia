"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Laptop,
  Smartphone,
  Globe,
  Loader2,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SessionItem {
  id: string
  token: string
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt?: string | Date
  expiresAt?: string | Date
}

function parseUserAgent(ua?: string | null) {
  if (!ua) {
    return { browser: "Web Browser", os: "Unknown Device", isMobile: false }
  }

  const isMobile = /mobile|iphone|android/i.test(ua)

  // Browser detection
  let browser = "Web Browser"
  if (/edg/i.test(ua)) browser = "Microsoft Edge"
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome"
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox"
  else if (/safari/i.test(ua)) browser = "Apple Safari"
  else if (/opera|opr/i.test(ua)) browser = "Opera"

  // OS detection
  let os = "Unknown OS"
  if (/windows/i.test(ua)) os = "Windows"
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua)) os = "Linux"
  else if (/android/i.test(ua)) os = "Android"
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS"

  return { browser, os, isMobile }
}

export function SessionsTab() {
  const { data: currentSessionData } = authClient.useSession()
  const currentToken = currentSessionData?.session?.token
  const currentSessionId = currentSessionData?.session?.id

  const [sessions, setSessions] = React.useState<SessionItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [revokingToken, setRevokingToken] = React.useState<string | null>(null)
  const [isRevokingOthers, setIsRevokingOthers] = React.useState(false)

  const fetchSessions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await authClient.listSessions()
      if (res.data && Array.isArray(res.data)) {
        setSessions(res.data as SessionItem[])
      } else {
        setSessions([])
      }
    } catch (err: unknown) {
      console.error("Error fetching sessions:", err)
      toast.error("Failed to load active sessions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevokeSingle = async (session: SessionItem) => {
    const token = session.token || session.id
    setRevokingToken(token)
    try {
      const { error } = await authClient.revokeSession({ token })
      if (error) {
        throw new Error(error.message || "Failed to revoke session")
      }

      toast.success("Session revoked successfully")
      setSessions((prev) => prev.filter((s) => s.token !== token && s.id !== token))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to revoke session"
      toast.error(message)
    } finally {
      setRevokingToken(null)
    }
  }

  const handleRevokeOthers = async () => {
    setIsRevokingOthers(true)
    try {
      const { error } = await authClient.revokeOtherSessions()
      if (error) {
        throw new Error(error.message || "Failed to revoke other sessions")
      }

      toast.success("All other sessions have been logged out")
      setSessions((prev) =>
        prev.filter((s) => s.token === currentToken || s.id === currentSessionId)
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to revoke other sessions"
      toast.error(message)
    } finally {
      setIsRevokingOthers(false)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the browsers and devices currently signed into your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchSessions}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {sessions.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={isRevokingOthers || isLoading}
              className="text-xs sm:text-sm"
            >
              {isRevokingOthers ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Revoking...
                </>
              ) : (
                <>
                  <LogOut className="size-3.5 mr-1.5" />
                  Sign out other devices
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          <Globe className="size-8 text-muted-foreground/50 mb-2" />
          <p>No active sessions found.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-card overflow-hidden">
          {sessions.map((item) => {
            const { browser, os, isMobile } = parseUserAgent(item.userAgent)
            const isCurrent =
              item.token === currentToken ||
              item.id === currentSessionId ||
              sessions.length === 1

            let relativeTime = "Recently"
            if (item.createdAt) {
              try {
                relativeTime = formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })
              } catch {
                relativeTime = "Recently"
              }
            }

            return (
              <div
                key={item.id || item.token}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 sm:gap-4 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/70 text-foreground/80 mt-0.5 sm:mt-0">
                    {isMobile ? (
                      <Smartphone className="size-4" />
                    ) : (
                      <Laptop className="size-4" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-sm sm:text-base font-medium text-foreground">
                        {browser} on {os}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="secondary"
                          className="h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[11px] sm:text-xs px-2 py-0 font-normal shrink-0"
                        >
                          <ShieldCheck className="size-3.5 mr-1" />
                          Current session
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {item.ipAddress || "Unknown IP"} • Active {relativeTime}
                    </p>
                  </div>
                </div>

                {!isCurrent && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingToken === (item.token || item.id)}
                    onClick={() => handleRevokeSingle(item)}
                    className="text-muted-foreground hover:text-destructive text-xs sm:text-sm h-8 self-end sm:self-auto shrink-0"
                  >
                    {revokingToken === (item.token || item.id) ? (
                      <Loader2 className="size-3 animate-spin mr-1.5" />
                    ) : (
                      <LogOut className="size-3.5 mr-1.5" />
                    )}
                    Revoke
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
