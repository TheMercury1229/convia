"""
modules/fill_form/chain.py
---------------------------
Stateless LangChain chain for one conversational turn of the fill-form flow.

Design:
  - Uses llm.with_structured_output(TurnResponse) — same pattern as generate_form.
  - Input: system_prompt (str) + messages (history) + user_message (latest).
  - Output: a validated TurnResponse instance (reply + extracted + is_complete).
  - Fully async, no side effects, no session state.
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from src.config.models import llm
from src.modules.fill_form.data_models import (
    ConversationMessage,
    TurnResponse,
)

logger = logging.getLogger(__name__)

# Structured LLM — forces the model to return a validated TurnResponse object.
# Mirrors the generate_form pattern: llm.with_structured_output(schema)
_structured_llm = llm.with_structured_output(TurnResponse)


def _build_messages(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> list:
    """
    Convert the plain-dict history into LangChain message objects.

    Message order:
      [SystemMessage, ...history as Human/AI messages..., HumanMessage(user_message)]
    """
    lc_messages = [SystemMessage(content=system_prompt)]

    for msg in history:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))

    lc_messages.append(HumanMessage(content=user_message))
    return lc_messages


async def run_fill_form_turn(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> TurnResponse:
    """
    Execute one stateless fill-form conversational turn.

    Args:
        system_prompt: Pre-built prompt string from the app backend.
                       Contains form schema, filled state, rules.
        history:       Full prior conversation (client-held, passed each turn).
        user_message:  The respondent's latest message.

    Returns:
        A validated TurnResponse with reply text, extracted answers, and
        is_complete flag.

    Raises:
        langchain_core.exceptions.OutputParserException: if the LLM returns
            a malformed JSON response (rare at temperature=0).
        groq.APIError: on upstream Groq API failures (propagated as-is).
    """
    messages = _build_messages(system_prompt, history, user_message)

    logger.info(
        "fill_form turn | history_turns=%d | user_message_len=%d",
        len(history),
        len(user_message),
    )

    result: TurnResponse = await _structured_llm.ainvoke(messages)

    logger.info(
        "fill_form turn complete | extracted_keys=%s | is_complete=%s",
        list(result.extracted.answers.keys()),
        result.is_complete,
    )

    return result
