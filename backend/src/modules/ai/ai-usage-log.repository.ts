import { randomUUID } from "crypto";
import db from "../../db/db";
import { aiUsageLog, type aiFeatureEnum } from "../../db/schema/ai-usage-log-schema";

export type AiFeature = (typeof aiFeatureEnum.enumValues)[number];

export interface InsertAiUsageLogInput {
  orgId: string;
  userId?: string | null;
  formId: string;
  feature: AiFeature;
  userMessage: string;
  aiReply: string;
  turnIndex?: number;
}

/**
 * Inserts an AI usage log entry into the ai_usage_log table.
 * aiReply is capped at 10,000 characters as per design.
 */
export async function insertAiUsageLog(input: InsertAiUsageLogInput) {
  const [row] = await db
    .insert(aiUsageLog)
    .values({
      id: randomUUID(),
      orgId: input.orgId,
      userId: input.userId ?? null,
      formId: input.formId,
      feature: input.feature,
      userMessage: input.userMessage,
      aiReply: input.aiReply.slice(0, 10_000),
      turnIndex: input.turnIndex ?? 0,
    })
    .returning();
  return row;
}

/**
 * Safe fire-and-forget wrapper for recording AI usage logs.
 * Never throws, so client-facing streams are never interrupted.
 */
export async function fireAiUsageLog(input: InsertAiUsageLogInput): Promise<void> {
  try {
    await insertAiUsageLog(input);
  } catch (err) {
    console.error("[ai-usage-log] Failed to persist AI usage log:", err);
  }
}

export interface StreamUsageLoggerOptions {
  stream: NodeJS.ReadableStream;
  orgId: string;
  userId?: string | null;
  formId: string;
  feature: AiFeature;
  userMessage: string;
  turnIndex: number;
}

/**
 * Attaches a passive listener to the AI SSE stream to accumulate the AI reply
 * and record it in ai_usage_log once the stream completes.
 */
export function attachStreamUsageLogger(options: StreamUsageLoggerOptions): void {
  let accumulatedReply = "";
  let buffer = "";

  options.stream.on("data", (chunk: Buffer | string) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) {
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (typeof parsed.delta === "string") {
            accumulatedReply += parsed.delta;
          }
        } catch {
          // ignore incomplete or non-JSON chunk
        }
      }
    }
  });

  options.stream.on("end", () => {
    if (buffer.trim().startsWith("data:")) {
      try {
        const parsed = JSON.parse(buffer.trim().slice(5).trim());
        if (typeof parsed.delta === "string") {
          accumulatedReply += parsed.delta;
        }
      } catch {
        // ignore
      }
    }

    if (accumulatedReply.trim()) {
      void fireAiUsageLog({
        orgId: options.orgId,
        userId: options.userId,
        formId: options.formId,
        feature: options.feature,
        userMessage: options.userMessage,
        aiReply: accumulatedReply,
        turnIndex: options.turnIndex,
      });
    }
  });
}

