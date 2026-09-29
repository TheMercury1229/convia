"use client";

import * as React from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/store/builder-store";
import type { Question } from "@/types/builder";

export function OptionsEditor({ question }: { question: Question }) {
  const { addOption, updateOption, deleteOption } = useBuilderStore();

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, idx) => (
        <div key={opt.id} className="flex items-center gap-1.5">
          <GripVertical className="size-3.5 text-muted-foreground/40 shrink-0" />
          <Input
            value={opt.label}
            onChange={(e) => updateOption(question.id, opt.id, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            className="h-8 flex-1 text-sm"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => deleteOption(question.id, opt.id)}
            disabled={question.options.length <= 1}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-1.5 h-8 text-sm text-muted-foreground"
        onClick={() => addOption(question.id)}
      >
        <Plus className="size-3.5" />
        Add option
      </Button>
    </div>
  );
}
