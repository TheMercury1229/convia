"""
modules/fill_form/chain.py
---------------------------
Stateless LangChain chain for one conversational turn of the fill-form flow.

Design:
  - Uses fill_form_chat_prompt | llm.with_structured_output(TurnResponse)
  - Input: system_prompt (str) + history (ConversationMessage) + user_message (str).
  - Output: a validated TurnResponse instance (reply + extracted + is_complete).
"""

from __future__ import annotations

import logging

from langchain_core.messages import AIMessage, HumanMessage

from src.config.models import llm
from src.modules.fill_form.data_models import (
    ConversationMessage,
    TurnResponse,
)
from src.modules.fill_form.prompts import fill_form_chat_prompt

logger = logging.getLogger(__name__)

# Structured LLM — forces the model to return a validated TurnResponse object.
_structured_llm = llm.with_structured_output(TurnResponse)
_chain = fill_form_chat_prompt | _structured_llm


def _format_history(history: list[ConversationMessage]) -> list:
    """Convert history into LangChain HumanMessage / AIMessage objects."""
    lc_messages = []
    for msg in history:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))
    return lc_messages


async def run_fill_form_turn(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> TurnResponse:
    """
    Execute one stateless fill-form conversational turn using LCEL.

    Args:
        system_prompt: Prompt string containing form schema, filled state, rules.
        history:       Full prior conversation (client-held, passed each turn).
        user_message:  The respondent's latest message.

    Returns:
        A validated TurnResponse with reply text, extracted answers, and
        is_complete flag.
    """
    history_messages = _format_history(history)

    logger.info(
        "fill_form turn | history_turns=%d | user_message_len=%d",
        len(history),
        len(user_message),
    )

    result: TurnResponse = await _chain.ainvoke({
        "system_prompt": system_prompt,
        "history": history_messages,
        "user_message": user_message,
    })

    logger.info(
        "fill_form turn complete | extracted_keys=%s | is_complete=%s",
        list(result.extracted.answers.keys()),
        result.is_complete,
    )

    return result
