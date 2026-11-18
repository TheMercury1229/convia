"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrgTransactions } from "@/hooks/use-billing";
import type { CreditTransaction } from "@/lib/api/billing";
import { authClient } from "@/lib/auth-client";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Loader2,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageLogProps {
  className?: string;
}

export function UsageLog({ className }: UsageLogProps) {
  const [page, setPage] = React.useState(1);
  const limit = 15;

  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  // Role check: only owner & admin can view transaction logs
  const currentRole = (activeOrg as any)?.members?.find(
    (m: any) => m.userId === session?.user?.id,
  )?.role;
  const isOwnerOrAdmin = currentRole === "owner" || currentRole === "admin";

  const { data, isLoading, isError, refetch } = useOrgTransactions(page, limit);

  if (!isOwnerOrAdmin) {
    return (
      <Card className={cn("border-border/60 bg-muted/10", className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Usage Log Restricted
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Per-member usage logs and credit attribution are only accessible to
              organisation owners and admins.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const formatReason = (reason: string) => {
    switch (reason) {
      case "ai_generate_form":
        return "AI Form Generation";
      case "grizzy_analytics":
        return "Analytics Chat Turn";
      case "grizzy_builder":
        return "Builder Chat Turn";
      case "plan_renewal":
      case "cycle_reset":
        return "Cycle Renewal";
      case "plan_upgrade":
        return "Plan Upgrade";
      case "plan_downgrade":
        return "Plan Downgrade";
      case "initial_grant":
        return "Initial Credit Grant";
      default:
        return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section Heading outside the card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Credit Usage Log
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of credit transactions and member attribution for this organisation.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={cn("size-3", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-xs">Loading transaction history...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-xs text-destructive">
              Failed to load transaction history. Please try refreshing.
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-2">
              <Receipt className="size-8 text-muted-foreground/40 stroke-1" />
              <p className="text-sm font-medium text-foreground">No transactions recorded yet</p>
              <p className="text-xs max-w-xs">
                Credits used for AI form generation, analytics chats, or plan renewals will appear here.
              </p>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[200px] text-xs font-semibold">Member</TableHead>
                <TableHead className="text-xs font-semibold">Action</TableHead>
                <TableHead className="text-xs font-semibold text-right">Credits</TableHead>
                <TableHead className="text-xs font-semibold text-right">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const isDebit = tx.amount < 0;
                const formattedAmount = isDebit
                  ? tx.amount.toString()
                  : `+${tx.amount}`;

                return (
                  <TableRow key={tx.id} className="hover:bg-muted/20">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border">
                          <AvatarImage src={tx.userImage || ""} alt={tx.userName} />
                          <AvatarFallback className="text-[10px] font-semibold bg-muted">
                            {tx.userName
                              ? tx.userName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                            {tx.userName || "Unknown Member"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {tx.userEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-foreground">
                      {formatReason(tx.reason)}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <span className="font-mono text-xs tabular-nums text-foreground">
                        {formattedAmount}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-right text-xs text-muted-foreground tabular-nums">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Showing page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong> (
              {total} total)
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 px-2 gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!data?.hasNextPage}
                className="h-7 px-2 gap-1 text-xs"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
