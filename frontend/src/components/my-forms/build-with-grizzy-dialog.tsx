"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateFormWithAi } from "@/lib/api/ai";
import { CreditGateModal } from "@/components/billing/credit-gate";

const PROMPT_SUGGESTIONS = [
  {
    title: "Customer Feedback",
    prompt:
      "A customer satisfaction survey with rating scale, favorite features, usage frequency, and open feedback.",
  },
  {
    title: "Job Application",
    prompt:
      "A job application form collecting full name, email, phone, experience level, resume upload, and portfolio link.",
  },
  {
    title: "Event RSVP",
    prompt:
      "An RSVP form with attendee name, email, attendance format (in-person or virtual), and dietary preferences.",
  },
  {
    title: "Client Intake",
    prompt:
      "A client onboarding questionnaire with company name, project goals, estimated budget, and timeline.",
  },
];

export interface BuildWithGrizzyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (prompt: string) => void;
  onJobStarted?: (jobId: string) => void;
}

export function BuildWithGrizzyDialog({
  open,
  onOpenChange,
  onSubmit,
  onJobStarted,
}: BuildWithGrizzyDialogProps) {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCreditGate, setShowCreditGate] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setPrompt("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isSubmitting) return;

    if (onSubmit) {
      onSubmit(trimmed);
      onOpenChange(false);
      return;
    }

    try {
      setIsSubmitting(true);
      const { jobId } = await generateFormWithAi(trimmed);
      onOpenChange(false);

      if (onJobStarted) {
        onJobStarted(jobId);
      } else {
        router.push(`/builder/ai?jobId=${jobId}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start form generation";

      if (
        message.toLowerCase().includes("credit") ||
        message.includes("402")
      ) {
        onOpenChange(false);
        setShowCreditGate(true);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Build with Grizzy</DialogTitle>
          <DialogDescription>
            Describe the form you want to create and Grizzy will generate the fields and structure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="grizzy-prompt">Form Description</Label>
            <Textarea
              id="grizzy-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A customer feedback survey with satisfaction ratings, product questions, and open-ended feedback."
              className="resize-none h-32 min-h-32 max-h-32 w-full"
              autoFocus
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Quick examples:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PROMPT_SUGGESTIONS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setPrompt(item.prompt)}
                  disabled={isSubmitting}
                  className="rounded-full border border-border bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!prompt.trim() || isSubmitting}>
              {isSubmitting ? "Starting…" : "Build Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CreditGateModal
      open={showCreditGate}
      onOpenChange={setShowCreditGate}
      requiredCredits={10}
      actionName="AI Form Generation"
    />
    </>
  );
}

export interface BuildWithGrizzyButtonProps
  extends React.ComponentProps<typeof Button> {
  onTrigger?: () => void;
}

export function BuildWithGrizzyButton({
  className,
  onTrigger,
  variant = "outline",
  ...props
}: BuildWithGrizzyButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onTrigger}
      className={className}
      {...props}
    >
      Build with Grizzy
    </Button>
  );
}
