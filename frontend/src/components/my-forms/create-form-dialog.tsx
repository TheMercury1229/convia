"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateForm } from "@/hooks/use-forms";
import { useRouter } from "next/navigation";

interface CreateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFormDialog({ open, onOpenChange }: CreateFormDialogProps) {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateForm();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const form = await mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      router.push(`/form/${form.id}`);
    } catch {
      // toast is shown by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new form</DialogTitle>
          <DialogDescription>
            Give your form a title and an optional description to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="form-title">Title *</Label>
            <Input
              id="form-title"
              placeholder="e.g. Customer Feedback Survey"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-description">Description</Label>
            <Textarea
              id="form-description"
              placeholder="What is this form about? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? "Creating…" : "Create Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
