"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GrizzyMarkdownProps {
  content: string;
  className?: string;
}

type MarkdownBlock =
  | { type: "code"; language?: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string };

function parseBlocks(markdown: string): MarkdownBlock[] {
  const rawLines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith("```")) {
        codeLines.push(rawLines[i]);
        i++;
      }
      if (i < rawLines.length) i++;
      blocks.push({
        type: "code",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // Markdown Table detection (starts with | and has a delimiter row |--| below it)
    if (
      line.trim().startsWith("|") &&
      i + 1 < rawLines.length &&
      /^\s*\|?\s*[-:]+[-| :]*\|?\s*$/.test(rawLines[i + 1])
    ) {
      const headerLine = line.trim();
      const headers = headerLine
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => {
          // Filter leading and trailing empty cells created by outside pipes
          if (idx === 0 && headerLine.startsWith("|") && cell === "") return false;
          if (idx === arr.length - 1 && headerLine.endsWith("|") && cell === "") return false;
          return true;
        });

      i += 2; // skip header line and separator line
      const rows: string[][] = [];

      while (i < rawLines.length && rawLines[i].trim().startsWith("|")) {
        const rowLine = rawLines[i].trim();
        const rowCells = rowLine
          .split("|")
          .map((c) => c.trim())
          .filter((cell, idx, arr) => {
            if (idx === 0 && rowLine.startsWith("|") && cell === "") return false;
            if (idx === arr.length - 1 && rowLine.endsWith("|") && cell === "") return false;
            return true;
          });
        rows.push(rowCells);
        i++;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
      });
      continue;
    }

    // Heading (#, ##, ###)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith(">")) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // Bullet list (- item, * item, • item)
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\s*[-*•]\s+/.test(rawLines[i])) {
        items.push(rawLines[i].replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: false,
        items,
      });
      continue;
    }

    // Ordered list (1. item)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
        items.push(rawLines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: true,
        items,
      });
      continue;
    }

    // Skip blank lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Standard paragraph: accumulate until empty line or special block
    const pLines: string[] = [rawLines[i]];
    i++;
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith("```") &&
      !rawLines[i].trim().startsWith(">") &&
      !rawLines[i].match(/^(#{1,4})\s+/) &&
      !/^\s*[-*•]\s+/.test(rawLines[i]) &&
      !/^\s*\d+\.\s+/.test(rawLines[i]) &&
      !(
        rawLines[i].trim().startsWith("|") &&
        i + 1 < rawLines.length &&
        /^\s*\|?\s*[-:]+[-| :]*\|?\s*$/.test(rawLines[i + 1])
      )
    ) {
      pLines.push(rawLines[i]);
      i++;
    }

    blocks.push({
      type: "paragraph",
      text: pLines.join("\n"),
    });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\)|\n)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] font-medium text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Link
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Line break
    if (part === "\n") {
      return <br key={index} />;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderBlock(block: MarkdownBlock, key: number): React.ReactNode {
  switch (block.type) {
    case "code":
      return (
        <div
          key={key}
          className="my-2.5 overflow-hidden rounded-xl border border-border/60 bg-muted/40"
        >
          {block.language && (
            <div className="border-b border-border/40 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {block.language}
            </div>
          )}
          <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed text-foreground">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <div
          key={key}
          className="my-3 overflow-x-auto rounded-xl border border-border/60 bg-card shadow-2xs"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/60 text-muted-foreground border-b border-border/50">
              <tr>
                {block.headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 font-semibold text-foreground">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {block.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2 text-foreground/90">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "heading": {
      const Tag = (`h${Math.min(block.level + 2, 6)}`) as "h3" | "h4" | "h5" | "h6";
      return (
        <Tag
          key={key}
          className="font-heading font-bold tracking-tight text-foreground my-2 text-sm sm:text-base"
        >
          {renderInline(block.text)}
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-3 border-primary/70 pl-3 my-2 italic text-muted-foreground text-xs sm:text-sm bg-muted/20 py-1 rounded-r-lg"
        >
          {renderInline(block.text)}
        </blockquote>
      );

    case "list":
      if (block.ordered) {
        return (
          <ol key={key} className="list-decimal space-y-1.5 pl-5 text-xs sm:text-sm">
            {block.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-foreground/90">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={key} className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed text-foreground/90">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );

    case "paragraph":
      return (
        <p key={key} className="leading-relaxed text-xs sm:text-sm text-foreground/95">
          {renderInline(block.text)}
        </p>
      );
  }
}

export function GrizzyMarkdown({ content, className }: GrizzyMarkdownProps) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn("space-y-2.5", className)}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
