"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Building2, User, Shield, Loader2, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName?: string;
  organizationSlug?: string;
  inviterEmail?: string;
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");

  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Require authentication: if unauthenticated, redirect to sign-in immediately
  useEffect(() => {
    if (!invitationId) return;
    if (isSessionLoading) return;

    if (!session?.user) {
      const callbackUrl = encodeURIComponent(`/accept-invitation?id=${invitationId}`);
      router.replace(`/sign-in?callbackUrl=${callbackUrl}`);
    }
  }, [invitationId, session, isSessionLoading, router]);

  // Fetch invitation only after user is confirmed authenticated
  useEffect(() => {
    if (!invitationId) {
      setIsLoadingInvite(false);
      setFetchError("Invalid or missing invitation link.");
      return;
    }

    if (isSessionLoading || !session?.user) {
      return;
    }

    const fetchInvitation = async () => {
      try {
        setIsLoadingInvite(true);
        setFetchError(null);

        const res = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });

        if (res.error) {
          setFetchError(res.error.message || "Invitation not found or expired.");
        } else if (res.data) {
          setInvitation(res.data as unknown as InvitationData);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load invitation.";
        setFetchError(errorMsg);
      } finally {
        setIsLoadingInvite(false);
      }
    };

    fetchInvitation();
  }, [invitationId, session, isSessionLoading]);

  const handleAccept = async () => {
    if (!invitationId) return;

    setIsProcessing(true);
    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to accept invitation");
        setIsProcessing(false);
        return;
      }

      toast.success("Invitation accepted! Welcome to the workspace.");

      // Set as active organisation
      if (invitation?.organizationId) {
        await authClient.organization.setActive({
          organizationId: invitation.organizationId,
        });
      }

      router.push("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to accept invitation";
      toast.error(message);
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationId) return;

    setIsProcessing(true);
    try {
      const res = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to decline invitation");
        setIsProcessing(false);
        return;
      }

      toast.info("Invitation declined.");
      router.push("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to decline invitation";
      toast.error(message);
      setIsProcessing(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await authClient.signOut();
      const callbackUrl = encodeURIComponent(`/accept-invitation?id=${invitationId}`);
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  if (!invitationId) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">Missing Invitation ID</h2>
        <p className="text-sm text-muted-foreground">
          This invitation link appears to be invalid or incomplete.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/home">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // 1. Session is checking or user is being redirected to sign-in
  if (isSessionLoading || !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isSessionLoading ? "Checking authentication..." : "Redirecting to sign in..."}
        </p>
      </div>
    );
  }

  // 2. Fetching invitation details
  if (isLoadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading invitation details...</p>
      </div>
    );
  }

  // 3. User is signed in with an account that is not the intended recipient
  if (fetchError?.toLowerCase().includes("recipient")) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">Different Account Needed</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            This invitation was sent to a different email address. You are currently signed in as{" "}
            <strong className="text-foreground">{session.user.email}</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleSwitchAccount} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Switch Account
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/home">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 4. Other fetch errors (expired, deleted, or invalid)
  if (fetchError) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold">Unable to Load Invitation</h2>
        <p className="text-sm text-muted-foreground">{fetchError}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/home">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // 5. Authenticated user viewing valid invitation
  return (
    <div className="space-y-6 py-2">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Workspace Invitation</h2>
        <p className="text-sm text-muted-foreground">
          You have been invited to collaborate in a workspace on Convia.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Workspace</p>
            <p className="font-semibold text-foreground text-base">
              {invitation?.organizationName || "Convia Team"}
            </p>
          </div>
          {invitation?.role && (
            <Badge variant="secondary" className="capitalize px-2.5 py-0.5 font-medium">
              <Shield className="w-3 h-3 mr-1 text-primary" />
              {invitation.role}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {invitation?.inviterEmail && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5" /> Invited by
              </span>
              <span className="text-foreground font-medium text-xs">
                {invitation.inviterEmail}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Signed in as</span>
            <span className="text-foreground font-medium text-xs">
              {session.user.email}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleAccept}
          disabled={isProcessing}
          className="w-full font-semibold"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Invitation
            </>
          )}
        </Button>

        <Button
          onClick={handleDecline}
          disabled={isProcessing}
          variant="outline"
          className="w-full text-muted-foreground hover:text-destructive"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
