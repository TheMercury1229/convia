"""
modules/analyze_responses/route.py
------------------------------------
FastAPI APIRouter: POST /api/analyze-responses/turn

Returns a StreamingResponse (text/event-stream / SSE) — identical wire protocol
to fill_form so the frontend can reuse the same SSE-reading hook.

SSE event format:
  Every chunk:  data: {"delta": "...", "done": false}
  Final chunk:  data: {"delta": "",   "done": true}

Streaming strategy (same as fill_form):
  - Await the full LLM response (structured output requires complete JSON).
  - Stream the reply text character-by-character to give a "typing" effect.
  - The final SSE event carries done=true so the frontend knows to stop.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, status
from fastapi.responses import StreamingResponse

from src.modules.analyze_responses.chain import run_analyze_responses_turn
from src.modules.analyze_responses.data_models import AnalyzeResponsesTurnRequest
from src.modules.analyze_responses.prompts import build_analyze_system_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Analyze Responses"])

# Characters emitted per SSE chunk — same values as fill_form for consistency.
_STREAM_CHUNK_SIZE = 4
_STREAM_DELAY_S = 0.015


async def _sse_generator(
    request: AnalyzeResponsesTurnRequest,
) -> AsyncGenerator[str, None]:
    """
    Core SSE generator:
      1. Prepare system prompt (use provided string or compile from analytics_context).
      2. Await the full structured LLM response.
      3. Stream the reply text in small chunks (typing effect).
      4. Emit one final event with done=true.
    """
    system_prompt = request.system_prompt
    if not system_prompt:
        if request.analytics_context:
            system_prompt = build_analyze_system_prompt(request.analytics_context)
        else:
            system_prompt = "You are Grizzy, a warm and insightful AI analytics assistant for Convia."

    try:
        result = await run_analyze_responses_turn(
            system_prompt=system_prompt,
            history=request.messages,
            user_message=request.user_message,
        )
    except Exception as exc:
        logger.exception("analyze_responses chain failed: %s", exc)
        error_payload = json.dumps({"error": str(exc), "done": True})
        yield f"data: {error_payload}\n\n"
        return

    reply_text = result.reply

    # Stream reply in chunks — gives a "typing" feel in the chat UI
    for start in range(0, len(reply_text), _STREAM_CHUNK_SIZE):
        chunk = reply_text[start : start + _STREAM_CHUNK_SIZE]
        payload = json.dumps({"delta": chunk, "done": False})
        yield f"data: {payload}\n\n"
        await asyncio.sleep(_STREAM_DELAY_S)

    # Final event — empty delta, done flag
    final_payload = json.dumps({"delta": "", "done": True})
    yield f"data: {final_payload}\n\n"


@router.post(
    "/analyze-responses/turn",
    status_code=status.HTTP_200_OK,
    summary="One conversational turn of the AI response analysis flow",
    description=(
        "Accepts the full conversation context (system prompt with analytics data, "
        "history, latest user question) and returns an SSE stream. "
        "Each event carries a `delta` of Grizzy's reply. "
        "The final event (done=true) signals the end of the response."
    ),
    response_class=StreamingResponse,
    responses={
        200: {"description": "SSE stream — text/event-stream"},
        422: {"description": "Validation error in request body"},
        502: {"description": "AI backend chain invocation failed"},
    },
)
async def analyze_responses_turn(
    body: AnalyzeResponsesTurnRequest,
) -> StreamingResponse:
    logger.info(
        "analyze_responses_turn called | history_len=%d | user_msg_len=%d",
        len(body.messages),
        len(body.user_message),
    )

    return StreamingResponse(
        _sse_generator(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
