"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Generates a clean URL slug from an organisation name.
 */
function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base || "org"}-${suffix}`;
}

export function CreateOrgDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrgDialogProps) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = orgName.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const slug = slugifyOrgName(name);

      const res = await authClient.organization.create({
        name,
        slug,
      });

      if (res?.error) {
        toast.error(res.error.message ?? "Failed to create organisation");
        return;
      }

      // Automatically set the new organisation as active
      if (res?.data?.id) {
        await authClient.organization.setActive({
          organizationId: res.data.id,
        });
      }

      toast.success("Organisation created!");
      setOrgName("");
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSubmitting) {
      if (!nextOpen) setOrgName("");
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organisation</DialogTitle>
          <DialogDescription>
            Enter a name for your new organisation to collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organisation name</Label>
            <Input
              id="org-name"
              placeholder="Acme Corp"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              required
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !orgName.trim()}
              className="w-full sm:w-auto"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create Organisation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
