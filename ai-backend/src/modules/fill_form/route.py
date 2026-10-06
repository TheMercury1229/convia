"""
modules/fill_form/route.py
---------------------------
FastAPI APIRouter: POST /api/fill-form/turn

Returns a StreamingResponse (text/event-stream / SSE) so the app backend
can pipe the response to the frontend in real-time.

SSE event format:
  Every chunk:  data: {"delta": "...", "extracted": {}, "done": false}
  Final chunk:  data: {"delta": "", "extracted": {"q1": "val", "q2": null}, "done": true}

The `extracted` field on intermediate chunks is always {} (empty dict).
The fully accumulated extraction is only emitted on the final `done: true` event,
so the frontend only needs to process it once.

Streaming strategy:
  - We call run_fill_form_turn() which awaits the full LLM response (structured output
    cannot be streamed token-by-token since it needs the full JSON to validate).
  - Once we have the complete TurnResponse, we stream the `reply` text character-by-character
    (or in small chunks) to give the frontend a "typing" effect.
  - The final SSE event carries the full extracted answers.

This gives real-time visual feedback while keeping structured output guarantees.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from src.modules.fill_form.chain import run_fill_form_turn
from src.modules.fill_form.data_models import FillFormTurnRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Fill Form"])

# How many characters to emit per SSE chunk while simulating streaming.
# Smaller = smoother animation, more events. 3-5 chars is a good balance.
_STREAM_CHUNK_SIZE = 4

# Delay between streamed chunks (seconds). Mimics typing speed.
_STREAM_DELAY_S = 0.015


async def _sse_generator(request: FillFormTurnRequest) -> AsyncGenerator[str, None]:
    """
    Core generator:
      1. Await the full structured LLM response.
      2. Stream the reply text in small chunks (typing effect).
      3. Emit one final event with done=true and the full extracted answers.
    """
    try:
        turn = await run_fill_form_turn(
            system_prompt=request.system_prompt,
            history=request.messages,
            user_message=request.user_message,
        )
    except Exception as exc:
        logger.exception("fill_form chain failed: %s", exc)
        # Emit an error event so the frontend knows what happened
        error_payload = json.dumps({"error": str(exc), "done": True})
        yield f"data: {error_payload}\n\n"
        return

    reply_text = turn.reply
    extracted_dict = turn.extracted.answers

    # Stream the reply in chunks — gives a "typing" feel in the chat UI
    for start in range(0, len(reply_text), _STREAM_CHUNK_SIZE):
        chunk = reply_text[start : start + _STREAM_CHUNK_SIZE]
        payload = json.dumps({"delta": chunk, "extracted": {}, "done": False})
        yield f"data: {payload}\n\n"
        await asyncio.sleep(_STREAM_DELAY_S)

    # Final event — empty delta, full extracted answers, done flag
    final_payload = json.dumps(
        {
            "delta": "",
            "extracted": extracted_dict,
            "is_complete": turn.is_complete,
            "done": True,
        }
    )
    yield f"data: {final_payload}\n\n"


@router.post(
    "/fill-form/turn",
    status_code=status.HTTP_200_OK,
    summary="One conversational turn of the AI form-fill flow",
    description=(
        "Accepts the full conversation context (system prompt, history, latest user message) "
        "and returns an SSE stream. Each event carries a `delta` of Grizzy's reply. "
        "The final event (done=true) also contains the structured `extracted` answers for this turn."
    ),
    response_class=StreamingResponse,
    responses={
        200: {"description": "SSE stream — text/event-stream"},
        422: {"description": "Validation error in request body"},
        502: {"description": "AI backend chain invocation failed"},
    },
)
async def fill_form_turn(body: FillFormTurnRequest) -> StreamingResponse:
    logger.info(
        "fill_form_turn called | history_len=%d | user_msg_len=%d",
        len(body.messages),
        len(body.user_message),
    )

    return StreamingResponse(
        _sse_generator(body),
        media_type="text/event-stream",
        headers={
            # Prevent proxies / nginx from buffering the SSE stream
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
