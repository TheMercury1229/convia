"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Globe,
  Lock,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  Inbox,
  Link2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useTogglePublish, useDuplicateForm, useDeleteForm } from "@/hooks/use-forms";
import type { Form } from "@/lib/api/forms";
import { toast } from "sonner";

interface FormCardProps {
  form: Form;
  responseCount?: number;
}

export function FormCard({ form, responseCount = 0 }: FormCardProps) {
  const router = useRouter();
  const { mutate: togglePublish, isPending: toggling } = useTogglePublish();
  const { mutate: duplicate, isPending: duplicating } = useDuplicateForm();
  const { mutate: deleteForm, isPending: deleting } = useDeleteForm();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const isLoading = toggling || duplicating || deleting;

  // Determine status: Closed (expired deadline) vs Published vs Draft
  const isClosed = Boolean(form.deadline && new Date() > new Date(form.deadline));
  const isPublished = Boolean(form.isPublished && !isClosed);

  const copyShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/form/${form.slug || form.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Form link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCardClick = () => {
    router.push(`/builder/${form.id}?mode=edit`);
  };

  const updatedDate = form.updatedAt ? new Date(form.updatedAt) : new Date();

  return (
    <TooltipProvider delayDuration={150}>
      <div
        onClick={handleCardClick}
        className="group relative rounded-2xl border border-border/70 bg-card p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 min-h-[185px] cursor-pointer select-none"
      >
        {/* ------------------------------------------------------------------ */}
        {/* Top Row: Status Pill (Left) + Quick Actions (Right)                */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between gap-2">
          {/* Integrated Status Indicator (Seamless, No Pill Container) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`size-1.5 rounded-full shrink-0 ${
                isClosed
                  ? "bg-destructive"
                  : isPublished
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/50"
              }`}
            />
            <span className="text-xs font-medium text-foreground/80">
              {isClosed ? "Closed" : isPublished ? "Published" : "Draft"}
            </span>
          </div>

          {/* Quick Actions (Directly on the card: Copy, Preview, and Dropdown) */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {/* Copy Link Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyShareLink}
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  {copied ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <Link2 className="size-3.5" />
                  )}
                  <span className="sr-only">Copy form link</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {copied ? "Copied!" : "Copy link"}
              </TooltipContent>
            </Tooltip>

            {/* Preview / Live Form Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  <Link
                    href={`/form/${form.slug || form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="sr-only">Open live form</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Preview live form</TooltipContent>
            </Tooltip>

            {/* Dropdown Options Menu for Secondary Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => togglePublish(form.id)}
                  className="cursor-pointer gap-2"
                >
                  {form.isPublished ? (
                    <>
                      <Lock className="size-4 text-muted-foreground" />
                      <span>Unpublish Form</span>
                    </>
                  ) : (
                    <>
                      <Globe className="size-4 text-muted-foreground" />
                      <span>Publish Form</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => duplicate(form.id)}
                  className="cursor-pointer gap-2"
                >
                  <Copy className="size-4 text-muted-foreground" />
                  <span>Duplicate Form</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-4" />
                  <span>Delete Form</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Middle Section: Title + Description                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {form.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2rem]">
            {form.description?.trim() ? (
              form.description
            ) : (
              <span className="italic opacity-50">No description provided</span>
            )}
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Bottom Metadata & Stats Bar                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-muted-foreground">
          {/* Responses Link Pill */}
          <Link
            href={`/responses/${form.slug || form.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors font-medium text-xs text-muted-foreground group-hover:border-primary/20"
            title="View responses"
          >
            <Inbox className="size-3.5" />
            <span>
              {responseCount} {responseCount === 1 ? "response" : "responses"}
            </span>
          </Link>

          {/* Updated Relative Date with Full Date Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-default">
                <Clock className="size-3 text-muted-foreground/70" />
                <span>{formatDistanceToNow(updatedDate, { addSuffix: true })}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Updated on {format(updatedDate, "PPP 'at' p")}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Delete confirmation dialog                                         */}
        {/* ------------------------------------------------------------------ */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &ldquo;{form.title}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this form and all associated responses.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
                onClick={() => deleteForm(form.id)}
              >
                {deleting ? "Deleting…" : "Delete form"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
