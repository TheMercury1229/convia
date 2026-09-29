"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Globe,
  Lock,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useTogglePublish, useDuplicateForm, useDeleteForm } from "@/hooks/use-forms";
import type { Form } from "@/lib/api/forms";
import { format } from "date-fns";

interface FormCardProps {
  form: Form;
}

export function FormCard({ form }: FormCardProps) {
  const { mutate: togglePublish, isPending: toggling } = useTogglePublish();
  const { mutate: duplicate, isPending: duplicating } = useDuplicateForm();
  const { mutate: deleteForm, isPending: deleting } = useDeleteForm();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isLoading = toggling || duplicating || deleting;

  return (
    <>
      <div className="group bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 transition-all duration-200 relative overflow-hidden">
        {/* Accent strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl transition-all duration-300 ${
            form.isPublished
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-muted to-muted/50"
          }`}
        />

        {/* Header row */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <Link href={`/form/${form.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">
              {form.title}
            </h3>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Form options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/form/${form.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePublish(form.id)}>
                {form.isPublished ? (
                  <><Lock className="h-4 w-4 mr-2" />Unpublish</>
                ) : (
                  <><Globe className="h-4 w-4 mr-2" />Publish</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicate(form.id)}>
                <Copy className="h-4 w-4 mr-2" />Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {form.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {form.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <Badge
            variant={form.isPublished ? "default" : "secondary"}
            className={`text-[10px] px-2 py-0.5 ${
              form.isPublished
                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                : ""
            }`}
          >
            {form.isPublished ? (
              <><Globe className="h-2.5 w-2.5 mr-1" />Published</>
            ) : (
              <><Lock className="h-2.5 w-2.5 mr-1" />Draft</>
            )}
          </Badge>

          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {format(new Date(form.updatedAt), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Delete confirmation dialog                                           */}
      {/* ------------------------------------------------------------------ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{form.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form and all its responses. This
              action cannot be undone.
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
    </>
  );
}
