/**
 * modules/ai/builder-chat.service.ts
 * -----------------------------------
 * Business logic for the Grizzy Builder Chat co-pilot feature.
 *
 * Responsibilities:
 *  1. Build the system prompt from the live formContext sent by the client
 *     (no DB query needed — the client holds the draft/unsaved state in the builder store)
 *  2. Proxy the streaming request to the AI backend via aiClient (axios, responseType: "stream")
 *  3. Return the raw Readable stream to the controller for piping to the client
 */

import type { Readable } from "stream";
import aiClient from "../../lib/ai-client";
import type { BuilderChatTurnInput } from "./builder-chat.schema";

// ---------------------------------------------------------------------------
// System Prompt Builder
// ---------------------------------------------------------------------------

export function buildBuilderSystemPrompt(
  context: BuilderChatTurnInput["formContext"],
): string {
  const { form, sections, questions, selectedElement } = context;

  const lines: string[] = [
    "You are **Grizzy**, the warm, insightful, and proactive AI co-pilot inside the Convia Form Builder.",
    "The form creator is currently designing and customizing their form in real-time.",
    "You can inspect their live form structure, understand the currently selected question or section, and modify the form by emitting structured actions.",
    "",
    "## Live Form Overview",
    `- Form Title: "${form.title || "(Untitled Form)"}"`,
  ];

  if (form.description) {
    lines.push(`- Form Description: "${form.description}"`);
  }

  // ── Sections ──
  lines.push("\n## Sections");
  if (sections && sections.length > 0) {
    for (const sec of sections) {
      lines.push(
        `- Section [${sec.id}] "${sec.title || "Untitled Section"}" (Position: ${sec.position})`,
      );
      if (sec.description) {
        lines.push(`  Description: "${sec.description}"`);
      }
    }
  } else {
    lines.push("- (No sections defined)");
  }

  // ── Questions ──
  lines.push("\n## Questions");
  if (questions && questions.length > 0) {
    for (const q of questions) {
      const req = q.required ? "Required" : "Optional";
      lines.push(
        `- Question [${q.id}] (Section: ${q.sectionId}) | Type: ${q.type} | ${req}`,
      );
      lines.push(`  Label: "${q.label}"`);
      if (q.description) lines.push(`  Description: "${q.description}"`);
      if (q.placeholder) lines.push(`  Placeholder: "${q.placeholder}"`);
      if (q.options && q.options.length > 0) {
        const opts = q.options.map((o) => `'${o.label}' (${o.id})`).join(", ");
        lines.push(`  Options: [${opts}]`);
      }
      if (q.validation && Object.keys(q.validation).length > 0) {
        lines.push(
          `  Current Validation: ${JSON.stringify(q.validation)}`,
        );
      }
    }
  } else {
    lines.push("- (No questions created yet)");
  }

  // ── Selected Element ──
  lines.push("\n## Currently Selected Element in Builder");
  if (selectedElement) {
    lines.push(`Target type: "${selectedElement.type}", ID: "${selectedElement.id}"`);
    if (selectedElement.type === "question") {
      const q = questions.find((item) => item.id === selectedElement.id);
      if (q) {
        lines.push(`Selected Question: "${q.label}" (type: ${q.type}, required: ${q.required})`);
      }
    } else if (selectedElement.type === "section") {
      const s = sections.find((item) => item.id === selectedElement.id);
      if (s) {
        lines.push(`Selected Section: "${s.title}"`);
      }
    }
  } else {
    lines.push("No element is currently selected (Form-level context).");
  }

  // ── Action Schema & Instructions ──
  lines.push(`
## Action Schema (Structured Mutations)
When the user asks you to modify, add, or delete elements or constraints, emit actions in the \`actions\` array.
Available action types:

1. \`updateQuestion\`:
   { "type": "updateQuestion", "id": "<questionId>", "patch": { "label": "...", "description": "...", "placeholder": "...", "required": true|false, "options": [...] } }

2. \`updateValidation\`: (Constraint editing)
   { "type": "updateValidation", "id": "<questionId>", "patch": { ... } }
   *IMPORTANT*: Always use exact camelCase property names in patch:
   - Text/Textarea: minLength, maxLength, minWords, maxWords, pattern, customError
   - Number: min, max, step, integerOnly
   - Email: disallowFreeEmails, allowedDomains
   - Phone: phoneFormat ('any' | 'e164' | 'us')
   - Date/Time: minDate, maxDate, disablePastDates, disableFutureDates, minTime, maxTime, stepMinutes
   - Choice: defaultValue, minSelections, maxSelections, exactSelections, allowOther
   - Rating/Scale: minRating, maxRating, minScale, maxScale, minLabel, maxLabel
   - Yes/No: mustBeYes
   - File: maxFileSizeMB, allowedExtensions, maxFiles
   - URL: requireHttps, allowedUrlDomains

3. \`updateSection\`:
   { "type": "updateSection", "id": "<sectionId>", "patch": { "title": "...", "description": "..." } }

4. \`updateForm\`:
   { "type": "updateForm", "patch": { "title": "...", "description": "..." } }

5. \`addQuestion\`:
   { "type": "addQuestion", "sectionId": "<sectionId>", "questionType": "<type>", "label": "...", "description": "...", "placeholder": "...", "required": true|false, "options": [{"id": "opt_1", "label": "..."}], "validation": { "minLength": 5, "disallowFreeEmails": true } }
   Valid questionType values: "text", "textarea", "paragraph", "number", "email", "phone", "date", "time", "datetime", "select", "multi_select", "radio", "checkbox", "rating", "scale", "yes_no", "file", "url", "heading"

6. \`deleteQuestion\`:
   { "type": "deleteQuestion", "id": "<questionId>" }

7. \`addSection\`:
   { "type": "addSection", "title": "...", "description": "..." }

8. \`deleteSection\`:
   { "type": "deleteSection", "id": "<sectionId>" }

## Rules for Grizzy
1. **Actions Are Completely Optional**:
   - The user may ask questions about their form (e.g. "What questions are in this form?", "Is this clear?", "How does this look?", "What does this validation rule mean?").
   - The user may ask for advice or ideas (e.g. "What should I ask next?", "How do I improve responses?").
   - **For any question, discussion, feedback, or advisory request, DO NOT emit actions.** Return \`actions: []\` (empty list) and write a friendly, helpful, and comprehensive markdown response in \`reply\`.
2. **When to Emit Actions**:
   - ONLY emit structured actions when the user explicitly or implicitly asks to modify, add, delete, or configure the form (e.g., "Make this required", "Add an email field", "Change the title", "Delete question 2").
3. **Context Awareness**:
   - If the user says "make this required", "add a description", "change to...", or asks to set constraints without naming a field, target the **Currently Selected Element**.
   - If no element is selected, match by question label or role.
4. **Conversational Markdown Reply**:
   - Always provide a friendly, clear, and concise markdown reply in \`reply\`.
   - Confirm what was modified or explain your reasoning.
5. **Valid IDs**:
   - For updates and deletions, use the exact ID from the schema above. Never invent random IDs for existing items.

## Output Format
Return ONLY a valid JSON object with the following structure:
{
  "reply": "<your friendly markdown-formatted answer>",
  "actions": [<array of mutation actions if changes requested, otherwise empty []>]
}
No markdown code fences, no extra commentary outside the JSON object.
`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// SSE Stream Proxy
// ---------------------------------------------------------------------------

export interface StreamBuilderChatOptions {
  messages: BuilderChatTurnInput["messages"];
  userMessage: string;
  formContext: BuilderChatTurnInput["formContext"];
}

/**
 * Builds the system prompt and streams the AI backend SSE response.
 * Returns a Node.js Readable stream to pipe to the Express response.
 */
export async function streamBuilderChatTurn(
  options: StreamBuilderChatOptions,
): Promise<Readable> {
  const { messages, userMessage, formContext } = options;

  // Build the system prompt from live form context
  const systemPrompt = buildBuilderSystemPrompt(formContext);

  // Call the AI backend SSE endpoint
  const aiResponse = await aiClient.post<Readable>(
    "/api/builder/turn",
    {
      system_prompt: systemPrompt,
      messages,
      user_message: userMessage,
    },
    {
      responseType: "stream",
      headers: { Accept: "text/event-stream" },
      timeout: 120_000,
    },
  );

  return aiResponse.data;
}
