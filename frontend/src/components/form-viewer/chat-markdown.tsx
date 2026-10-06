"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe React-based Markdown renderer tailored for AI chat bubbles.
 * Supports:
 * - Bold (**text**) & Italic (*text* or _text_)
 * - Inline code (`code`)
 * - Multi-line fenced code blocks (```code```)
 * - Unordered bullet lists (- or *)
 * - Ordered lists (1., 2., etc.)
 * - Blockquotes (> quote)
 * - Links ([label](url))
 * - Paragraph breaks
 */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn("text-sm leading-relaxed space-y-2.5", className)}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

type Block =
  | { type: "code"; language?: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string };

function parseBlocks(markdown: string): Block[] {
  const rawLines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
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
      if (i < rawLines.length) i++; // consume closing ```
      blocks.push({
        type: "code",
        language,
        code: codeLines.join("\n"),
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
    const pLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith("```") &&
      !rawLines[i].trim().startsWith(">") &&
      !rawLines[i].match(/^(#{1,4})\s+/) &&
      !/^\s*[-*•]\s+/.test(rawLines[i]) &&
      !/^\s*\d+\.\s+/.test(rawLines[i])
    ) {
      pLines.push(rawLines[i]);
      i++;
    }

    if (pLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: pLines.join("\n"),
      });
    }
  }

  return blocks;
}

function renderBlock(block: Block, key: number): React.ReactNode {
  switch (block.type) {
    case "code":
      return (
        <div key={key} className="my-2 overflow-hidden rounded-xl border border-border/40 bg-black/10 dark:bg-black/40">
          {block.language && (
            <div className="border-b border-border/20 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
              {block.language}
            </div>
          )}
          <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "heading": {
      const Tag = (`h${Math.min(block.level + 2, 6)}`) as "h3" | "h4" | "h5" | "h6";
      return (
        <Tag key={key} className="font-heading font-semibold tracking-tight text-foreground my-1.5 text-base sm:text-lg">
          {renderInline(block.text)}
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-3 border-primary/60 pl-3.5 italic text-muted-foreground my-1"
        >
          {renderInline(block.text)}
        </blockquote>
      );

    case "list":
      if (block.ordered) {
        return (
          <ol key={key} className="list-decimal space-y-1 pl-5 text-sm">
            {block.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={key} className="list-disc space-y-1 pl-5 text-sm">
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );

    case "paragraph":
      return (
        <p key={key} className="leading-relaxed">
          {renderInline(block.text)}
        </p>
      );
  }
}

/**
 * Parses inline markdown: bold, italic, code, links
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex tokeniser for:
  // 1) `code`
  // 2) **bold** or __bold__
  // 3) *italic* or _italic_
  // 4) [label](url)
  // 5) line break \n
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\)|\n)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded-md bg-black/10 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[12px] font-medium"
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
        <em key={index} className="italic">
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
          className="text-primary underline hover:opacity-80 transition-opacity"
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
