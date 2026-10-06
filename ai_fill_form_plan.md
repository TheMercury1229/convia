# AI Fill Form — Implementation Plan

> **Epic 5** (US-29 → US-38) from `user-stories.md`  
> Stack: Next.js frontend · Express/Node app backend · FastAPI AI backend (LangChain + Groq)

---

## 1. Feature Overview

A respondent opens a published form and instead of filling it field-by-field, they click **"Fill with Grizzy"**. This opens a chat interface where they talk naturally. Grizzy (the AI) extracts field values from their messages, asks follow-ups for anything missing, validates values in real-time, and when all required fields are filled, shows a pre-filled review screen. The respondent edits anything they want and submits.

---

## 2. Architecture

```
┌─────────────────────────────────┐
│         Frontend (Next.js)      │
│  FormViewer → AI Chat Mode      │
│  Holds: messages[], filledAnswers│
│  Streams AI replies via SSE     │
└──────────────┬──────────────────┘
               │ HTTP (proxied, never direct to AI)
               ▼
┌─────────────────────────────────┐
│      App Backend (Express)      │
│  /api/ai/fill-form/*            │
│  - Fetches form schema from DB  │
│  - Builds system prompt         │
│  - Proxies to AI backend        │
│  - Fires analytics events       │
│  - Auth/rate limiting layer     │
└──────────────┬──────────────────┘
               │ Internal HTTP (aiClient)
               ▼
┌─────────────────────────────────┐
│    AI Backend (FastAPI)         │
│  POST /api/fill-form/turn       │
│  - Stateless per-request        │
│  - Receives [systemPrompt +     │
│    messages + userMessage]      │
│  - Returns { reply, extracted } │
│    streamed via SSE             │
└─────────────────────────────────┘
```

**Key principle:** The AI backend is stateless. It receives the full context on every call and returns one turn. No session memory on the AI side. The frontend holds `messages[]`, the app backend holds nothing between turns.

---

## 3. Data Flow Per Turn

```
User types message
        │
        ▼
Frontend: POST /api/ai/fill-form/turn
  body: {
    formId,
    sessionId,          ← same sessionId used for analytics
    messages: [...],    ← full history so far (client-held)
    userMessage: "..."
  }
        │
        ▼
App Backend:
  1. Validate request
  2. Forward to AI Backend with system prompt (built once, cached per formId)
  3. Stream SSE response back to frontend
  4. On each chunk: pipe through
  5. On completion: fire analytics updateSession
        │
        ▼
AI Backend: POST /api/fill-form/turn
  Receives: { system_prompt, messages, user_message }
  Returns stream: SSE chunks of { delta: string, extracted?: {...} }
        │
        ▼
Frontend receives stream:
  - Appends delta to current AI message bubble (real-time)
  - On final chunk: reads `extracted`, merges into filledAnswers
  - Checks completeness → transition if done
```

---

## 4. User Stories Coverage

| Story | What satisfies it |
|---|---|
| **US-29** — Choose "Fill with AI" | "Fill with Grizzy" button on `ViewerWelcome` / header. Flips `FormViewer` into `aiMode` |
| **US-30** — AI asks questions conversationally | Grizzy's system prompt instructs it to ask naturally, one topic at a time |
| **US-31** — Answer naturally | User types freeform, AI extracts structured values |
| **US-32** — AI maps answers to fields | Each turn returns `extracted: { [questionId]: value }` |
| **US-33** — Follow-up for missing info | System prompt instructs AI to ask about unfilled required fields |
| **US-34** — Don't re-ask filled fields | System prompt receives `filledFields` list, AI skips those |
| **US-35** — Continue until all collected | Completeness check on client after every turn |
| **US-36** — See structured answers | Review screen shows pre-populated form |
| **US-37** — Correct before submit | Review screen uses existing `ViewerQuestion` components, fully editable |
| **US-38** — Submit completed form | Same `submitResponse` function already in `form-viewer.tsx` |

---

## 5. What Gets Built — By Layer

### 5.1 AI Backend (FastAPI) — New module: `fill_form`

**New file: `src/modules/fill_form/`**

```
fill_form/
  __init__.py
  route.py        ← POST /api/fill-form/turn  (SSE streaming)
  chain.py        ← LangChain: chat model + structured output
  data_models.py  ← Pydantic: FillFormTurn (input), TurnResponse (output)
  prompts.py      ← System prompt template
```

**`data_models.py`**
```python
class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class FillFormTurnRequest(BaseModel):
    system_prompt: str           # built by app backend, passed each time
    messages: list[ConversationMessage]
    user_message: str

class ExtractedAnswers(BaseModel):
    # questionId → extracted value (any JSON type)
    answers: dict[str, Any]

class TurnResponse(BaseModel):
    reply: str                   # Grizzy's conversational response
    extracted: ExtractedAnswers  # values extracted this turn (partial is fine)
    is_complete: bool            # AI's opinion (system is the authority, but useful signal)
```

**`chain.py`**
```python
# Chat completion with structured output — one call per turn, fully stateless
# Uses llm.with_structured_output(TurnResponse)
# Input: [SystemMessage(system_prompt), *history_messages, HumanMessage(user_message)]
```

**`route.py`**
```python
# POST /api/fill-form/turn
# Returns: StreamingResponse with media_type="text/event-stream"  ← SSE (confirmed)
# Each SSE event:  data: { "delta": "...", "extracted": {}, "done": false }
# Final SSE event: data: { "delta": "", "extracted": { questionId: value|null }, "done": true }
# null in extracted = user intentionally skipped an optional field
```

**`prompts.py` — System prompt structure**
```
You are Grizzy, a friendly AI assistant helping the user fill out a form.

FORM: {form_title}
{form_description if present}

FIELDS TO COLLECT:
{for each field:}
  - ID: {questionId}
    Label: {label}
    Type: {type}  (text | number | email | radio | checkbox | rating | scale | yes_no | ...)
    Required: {true/false}
    {Validation constraints: min, max, options list, etc.}
    {Description/placeholder if present}

ALREADY FILLED (do not ask about these):
{for each filled field: "Label: value"}

STILL NEEDED (focus on these):
{list of unfilled required field labels}

RULES:
1. Have a natural conversation — don't just list questions robotically
2. You may collect multiple fields from one user message if they provide them
3. If a user provides an invalid value (e.g. age=-5, non-option for a radio),
   reject it kindly and ask again. Do not put it in extracted.
4. OPTIONAL FIELDS: Ask about every optional field exactly once, using lighter
   language ("feel free to share...", "if you'd like..."). If the user says
   anything like 'skip', 'no', 'leave it', 'pass', or simply doesn't provide
   a value — set its extracted value to null and never ask again.
   Asking twice about an optional field is not allowed.
5. When all required fields are filled (optional fields may be null), tell the
   user warmly that you have everything and they can review their answers.
6. Return structured extraction alongside every reply — null counts as a valid
   extracted value for optional fields (signals deliberate skip, not absence).

OUTPUT FORMAT: Always return valid JSON matching TurnResponse schema.
```

---

### 5.2 App Backend (Express) — New routes under `/api/ai/fill-form`

**New file: `src/modules/ai/fill-form.service.ts`**

```typescript
// buildSystemPrompt(form: FormWithSections, filledAnswers: Record<string, unknown>): string
// Fetches form from DB, serialises fields + validation + filled state into system prompt string
// This is called on every turn (cheap string build, no extra DB call if form is cached)

// streamFillFormTurn(body): AsyncIterable<SSEChunk>
// Calls AI backend with axios streaming, pipes SSE chunks back
```

**New routes in `src/modules/ai/ai.router.ts`**

```typescript
// These routes are PUBLIC — no requireAuth (respondents are anonymous)
// Rate limited by formId + sessionId (add express-rate-limit)

// POST /api/ai/fill-form/turn
// body: { formId, sessionId, messages[], userMessage, filledAnswers }
// → fetches form schema, builds system prompt, proxies to AI backend, streams SSE back
// → fires analytics updateSession on completion

router.post("/fill-form/turn", validate(fillFormTurnSchema), controller.fillFormTurn);
```

> [!IMPORTANT]
> These endpoints must NOT use `requireAuth` / `requireOrgMember` — respondents are anonymous. Add separate rate limiting per `formId + sessionId` instead.

**Analytics integration per turn (fires server-side, not client-side)**
```typescript
// After each successful AI turn:
await analyticsService.updateSession(formId, {
  sessionId,
  lastQuestionIndex: Object.keys(filledAnswers).length  // proxy for progress
});
```

---

### 5.3 Frontend — New components + mode toggle in FormViewer

#### Entry point: `viewer-welcome.tsx`
Add a **"Fill with Grizzy 🐻"** button alongside the existing "Start" button. Clicking it sets `mode: "ai"` instead of starting the normal sequential flow.

#### New component: `ai-fill-chat.tsx`
The main chat interface. Lives alongside the existing form-viewer components.

```typescript
interface AiFillChatProps {
  form: FormWithSections;
  theme: FormThemeResolved;
  isDark: boolean;
  sessionId: string;
  onComplete: (filledAnswers: Record<string, unknown>) => void;  // → review screen
  onDropoff: () => void;  // user closes/leaves
}

// Internal state:
// messages: ChatMessage[]          ← full conversation history (client-held)
// filledAnswers: Record<string, unknown>  ← accumulated extracted values
// isStreaming: boolean
// currentAiMessage: string         ← partial streamed text
```

**Turn handling:**
```typescript
const sendMessage = async (userText: string) => {
  // 1. Append user message to messages[]
  // 2. POST /api/ai/fill-form/turn with full messages[] + filledAnswers
  // 3. Open SSE reader, stream delta chars into currentAiMessage
  // 4. On final chunk: read extracted, merge into filledAnswers
  // 5. Check completeness:
  //    const done = requiredFields.every(q => filledAnswers[q.id] !== undefined)
  //    if (done) → onComplete(filledAnswers)
  // 6. Append completed AI message to messages[]
  // 7. Save filledAnswers to localStorage for dropoff recovery
};
```

#### Modified: `form-viewer.tsx`
Add `mode` state: `"normal" | "ai" | "review"`.

```typescript
// mode === "normal" → existing sequential flow (unchanged)
// mode === "ai"     → render <AiFillChat> instead of ViewerQuestion
// mode === "review" → render <AiFillReview> with pre-populated answers
```

#### New component: `ai-fill-review.tsx`
Pre-populated review screen. Shows all form fields with AI-extracted values, fully editable.

```typescript
interface AiFillReviewProps {
  form: FormWithSections;
  theme: FormThemeResolved;
  initialAnswers: Record<string, unknown>;  // from AI
  onSubmit: (answers: Record<string, unknown>) => void;
  onBack: () => void;  // back to chat
}

// Internally: local answers state seeded from initialAnswers
// Renders existing ViewerQuestion components for each field
// "Edit" → user can change any value, runs validateQuestionAnswer before allowing next
// "Submit" → calls existing submitResponse() 
```

> [!TIP]
> Reuse `validateQuestionAnswer` from `@/lib/validations/question-validator` for the review screen — same validation library you already use in the normal flow.

#### New hook: `use-ai-fill-session.ts`

```typescript
// Wraps localStorage persistence for the AI session
// getStoredSession(formId): { messages, filledAnswers } | null
// saveSession(formId, messages, filledAnswers): void
// clearSession(formId): void

// Called on AiFillChat mount to offer "Continue where you left off?"
// Cleared on successful submit
```

#### New hook: `use-ai-fill-stream.ts`

```typescript
// Handles SSE streaming from /api/ai/fill-form/turn
// Returns: { sendMessage, isStreaming, currentDelta, error }
// Manages EventSource / fetch with ReadableStream internally
```

---

## 6. Analytics — What Changes

Your existing analytics infrastructure works as-is. Minor additions:

### Tag AI sessions
Add optional `source` field to the session start payload:
```typescript
// In startSession:
trackFormStart(formId, sessionId, { source: "ai_fill" })
// vs existing: source: "manual"
```

This lets you later segment drop-off rates, completion rates, and time-to-complete by fill method. Small schema addition to `form_sessions` table.

### Progress tracking during AI chat
The `lastQuestionIndex` field was designed for sequential forms. For AI fill, use:
```
lastQuestionIndex = number of fields extracted so far
```
It maps cleanly — 0 fields extracted = index 0, all fields extracted = index N. The funnel chart in analytics works without any changes.

### Drop-off detection
Same mechanism as today — `pagehide` / `beforeunload` fires `trackFormProgress` with the current `filledAnswers` count. No special AI handling needed.

---

## 7. Session Lifecycle

```
User clicks "Fill with Grizzy"
        │
        ▼
trackFormStart(formId, sessionId, { source: "ai_fill" })
        │
        ▼
[Conversation loop]
  Each turn → updateSession(sessionId, filledAnswers.length)
        │
        ▼
All required fields filled → onComplete() called
  → mode switches to "review"
  → session stays open (not completed yet)
        │
        ▼
User submits from review screen
  → submitResponse(formId, { answers, sessionId })
  → completeSession(sessionId, responseId)   ← existing endpoint
        │
        ▼
Session complete ✓ → isCompleted = true → ViewerCompletion renders
```

**Drop-off scenarios:**

| Scenario | What happens |
|---|---|
| User closes tab mid-chat | `pagehide` fires, `updateSession` called with current `filledAnswers.length` |
| User closes tab on review screen | Same — `filledAnswers` is fully populated at this point |
| User hits "Back" from review to chat | Session remains open, chat resumes from saved state |
| User refreshes page | `localStorage` session detected, "Continue?" prompt offered |

---

## 8. Validation — Two Layers

### Layer 1: AI-side (semantic)
System prompt tells Grizzy the constraints per field. If user says age = -5 for a field with `min: 0`, Grizzy rejects it conversationally before it ever lands in `extracted`.

### Layer 2: System-side (schema)
After each turn, run `validateQuestionAnswer(field, extractedValue)` on every newly extracted answer. If any fail:
- Remove the invalid value from `filledAnswers`
- Send a synthetic error message back into the conversation: `"Actually, that value didn't pass validation — [error]. Can you provide a valid one?"`
- The AI will pick this up in the next turn's history and handle it

This means even if the AI is fooled into accepting an invalid value, your system catches it. The AI is never the authority on validity.

---

## 9. Implementation Order

### Phase 1 — AI Backend: `fill_form` module
1. `data_models.py` — define `FillFormTurnRequest` and `TurnResponse`
2. `prompts.py` — write the system prompt template
3. `chain.py` — stateless chat completion with `with_structured_output(TurnResponse)`
4. `route.py` — `POST /api/fill-form/turn` with SSE streaming
5. Register router in `app.py`
6. Manual test with Postman/curl

### Phase 2 — App Backend: proxy + system prompt builder
1. `fill-form.service.ts` — `buildSystemPrompt()` + `streamFillFormTurn()`
2. `fill-form.controller.ts` — thin controller
3. Add routes to `ai.router.ts` (public, rate-limited)
4. Wire analytics `updateSession` call on turn completion

### Phase 3 — Frontend: hooks + streaming
1. `use-ai-fill-stream.ts` — SSE stream hook
2. `use-ai-fill-session.ts` — localStorage persistence hook
3. Test end-to-end streaming with a real form

### Phase 4 — Frontend: UI components
1. `ai-fill-chat.tsx` — chat interface with streaming bubbles
2. `ai-fill-review.tsx` — pre-populated review screen (reuse `ViewerQuestion`)
3. Modify `viewer-welcome.tsx` — add "Fill with Grizzy" button
4. Modify `form-viewer.tsx` — add `mode` state, wire components

### Phase 5 — Polish + analytics
1. Tag sessions with `source: "ai_fill"`
2. `localStorage` dropoff recovery ("Continue?" prompt)
3. Animation/transition between chat → review
4. Error states (AI backend down, timeout, etc.)

---

## 10. Open Decisions (Decide Before Phase 1)

| Decision | Options | Recommendation |
|---|---|---|
| **Streaming protocol** | ~~SSE vs WebSocket~~ | ✅ **SSE confirmed** — `text/event-stream`, client only receives |
| **LLM for fill-form** | Same Groq model as generate_form | Start same, easy to swap later |
| **Structured output strategy** | `with_structured_output` vs JSON mode + parse | `with_structured_output` — consistent with generate_form chain |
| **Rate limiting** | Per IP, per formId+sessionId, per formId | Per `formId + sessionId` — prevents one session from spamming |
| **Optional fields** | ~~AI skips vs always asks~~ | ✅ **Ask once, never block.** User skip → `null` in `extracted`. Keeps `answerRate` analytics honest. |
| **"Continue?" prompt threshold** | Always show if session exists vs only if >1 field filled | Only if ≥1 field filled (otherwise just start fresh) |

---

## 11. File Checklist

### New files
- `ai-backend/src/modules/fill_form/__init__.py`
- `ai-backend/src/modules/fill_form/data_models.py`
- `ai-backend/src/modules/fill_form/prompts.py`
- `ai-backend/src/modules/fill_form/chain.py`
- `ai-backend/src/modules/fill_form/route.py`
- `backend/src/modules/ai/fill-form.service.ts`
- `backend/src/modules/ai/fill-form.controller.ts`
- `backend/src/modules/ai/fill-form.schema.ts`
- `frontend/src/components/form-viewer/ai-fill-chat.tsx`
- `frontend/src/components/form-viewer/ai-fill-review.tsx`
- `frontend/src/hooks/use-ai-fill-stream.ts`
- `frontend/src/hooks/use-ai-fill-session.ts`

### Modified files
- `ai-backend/src/app.py` — register `fill_form` router
- `backend/src/modules/ai/ai.router.ts` — add fill-form routes
- `frontend/src/components/form-viewer/form-viewer.tsx` — add `mode` state
- `frontend/src/components/form-viewer/viewer-welcome.tsx` — add "Fill with Grizzy" button
- `frontend/src/hooks/use-form-analytics-session.ts` — add `source` tagging (optional for v1)
