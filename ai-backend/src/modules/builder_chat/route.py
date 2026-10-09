"""
modules/builder_chat/route.py
-------------------------------
FastAPI APIRouter: POST /api/builder/turn

Returns a StreamingResponse (text/event-stream / SSE):
- Intermediate events: data: {"delta": "...", "done": false}
- Final event:        data: {"delta": "", "done": true, "actions": [...]}
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from src.modules.builder_chat.chain import run_builder_chat_turn
from src.modules.builder_chat.data_models import BuilderChatTurnRequest
from src.modules.builder_chat.prompts import build_builder_system_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Builder Chat"])

# Characters emitted per SSE chunk — simulates typing speed
_STREAM_CHUNK_SIZE = 4
_STREAM_DELAY_S = 0.015


async def _sse_generator(
    request: BuilderChatTurnRequest,
) -> AsyncGenerator[str, None]:
    """
    Core SSE generator:
      1. Prepare system prompt (use provided string or compile from form_context).
      2. Await the full structured LLM response (reply + actions).
      3. Stream the reply text in small chunks (typing effect).
      4. Emit final event with done=true and actions array.
    """
    system_prompt = request.system_prompt
    if not system_prompt:
        if request.form_context:
            system_prompt = build_builder_system_prompt(request.form_context)
        else:
            system_prompt = "You are Grizzy, AI form co-pilot. Assist the form creator with form editing."

    try:
        result = await run_builder_chat_turn(
            system_prompt=system_prompt,
            history=request.messages,
            user_message=request.user_message,
        )
    except Exception as exc:
        logger.exception("builder_chat chain failed: %s", exc)
        error_payload = json.dumps({"error": str(exc), "done": True, "actions": []})
        yield f"data: {error_payload}\n\n"
        return

    reply_text = result.reply
    actions_data = [a.model_dump(exclude_none=True) for a in result.actions]

    # Stream reply in chunks for live typing effect
    for start in range(0, len(reply_text), _STREAM_CHUNK_SIZE):
        chunk = reply_text[start : start + _STREAM_CHUNK_SIZE]
        payload = json.dumps({"delta": chunk, "done": False})
        yield f"data: {payload}\n\n"
        await asyncio.sleep(_STREAM_DELAY_S)

    # Final event carries done: true and structured actions
    final_payload = json.dumps({
        "delta": "",
        "done": True,
        "actions": actions_data,
    })
    yield f"data: {final_payload}\n\n"


@router.post(
    "/builder/turn",
    status_code=status.HTTP_200_OK,
    summary="One conversational turn of the Grizzy Builder Chat",
    description=(
        "Accepts conversation history and form context, returns an SSE stream. "
        "Streams Grizzy's conversational reply via `delta`, and emits structured "
        "`actions` on the final event (done=true)."
    ),
    response_class=StreamingResponse,
    responses={
        200: {"description": "SSE stream — text/event-stream"},
        422: {"description": "Validation error in request body"},
        502: {"description": "AI backend chain invocation failed"},
    },
)
async def builder_chat_turn(
    body: BuilderChatTurnRequest,
) -> StreamingResponse:
    logger.info(
        "builder_chat_turn called | history_len=%d | user_msg_len=%d",
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
