"use client";

import * as React from "react";
import { Copy, Check, Download, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBuilderStore } from "@/store/builder-store";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const form = useBuilderStore((s) => s.form);
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Compute form slug (fallback to slugified title or random demo slug)
  const slug = React.useMemo(() => {
    if (form.slug) return form.slug;
    const base = form.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base ? `${base}-8f3e` : "form-8f3e";
  }, [form.slug, form.title]);

  const sharePath = `form/${slug}`;
  const shareUrl = origin ? `${origin}/${sharePath}` : `https://convia.app/${sharePath}`;

  // QR Code image URL (standard high-res QR API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    shareUrl
  )}&margin=10`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${slug}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("QR code downloaded");
    } catch {
      // Fallback: open image in new tab if direct download is blocked by CORS
      window.open(qrCodeUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 gap-4">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            Share Form
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Anyone with this link or QR code can view and fill out your form.
          </DialogDescription>
        </DialogHeader>

        {/* ── TOP: QR Code Card ──────────────────────────────── */}
        <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/20 p-2.5">
          <div className="group relative rounded-lg bg-white p-2 shadow-xs border border-border/40 overflow-hidden cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt={`QR code for ${shareUrl}`}
              width={160}
              height={160}
              className="size-40 object-contain rounded"
            />

            {/* Hover overlay with download button on top of QR code */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadQr}
                className="h-8 gap-1.5 text-xs font-medium shadow-md bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Share Link ─────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="share-link-input" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Share link
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="share-link-input"
              value={shareUrl}
              readOnly
              className="h-9 font-mono text-xs select-all bg-muted/30"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              type="button"
              variant={copied ? "default" : "secondary"}
              size="sm"
              onClick={handleCopy}
              className="h-9 shrink-0 gap-1.5 px-3"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  <span className="text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              asChild
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              title="Open link in new tab"
            >
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                <span className="sr-only">Open in new tab</span>
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
