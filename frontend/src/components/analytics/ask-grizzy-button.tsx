"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AskGrizzyButtonProps extends React.ComponentProps<typeof Button> {
  onOpen: () => void;
}

/**
 * Clean primary button to open Grizzy Analytics Sheet
 */
export function AskGrizzyButton({
  onOpen,
  className,
  ...props
}: AskGrizzyButtonProps) {
  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      onClick={onOpen}
      className={cn(
        "h-8.5 px-3.5 rounded-xl font-medium text-xs shadow-xs cursor-pointer",
        className,
      )}
      {...props}
    >
      Ask Grizzy
    </Button>
  );
}
