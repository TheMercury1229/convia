"""
modules/analyze_responses/chain.py
------------------------------------
Stateless LangChain chain for one conversational turn of the analyze-responses flow.

Design:
  - Uses analyze_chat_prompt | llm.with_structured_output(AnalyzeReply)
  - Input:  system_prompt (str) + history (ConversationMessage) + user_message (str)
  - Output: a validated AnalyzeReply instance (reply text only)
"""

from __future__ import annotations

import logging

from langchain_core.messages import AIMessage, HumanMessage

from src.config.models import llm
from src.modules.analyze_responses.data_models import (
    AnalyzeReply,
    ConversationMessage,
)
from src.modules.analyze_responses.prompts import analyze_chat_prompt

logger = logging.getLogger(__name__)

# Structured LLM — forces the model to return a validated AnalyzeReply object.
_structured_llm = llm.with_structured_output(AnalyzeReply)
_chain = analyze_chat_prompt | _structured_llm


def _format_history(history: list[ConversationMessage]) -> list:
    """Convert history into LangChain HumanMessage / AIMessage objects."""
    lc_messages = []
    for msg in history:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))
    return lc_messages


async def run_analyze_responses_turn(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> AnalyzeReply:
    """
    Execute one stateless analyze-responses conversational turn using LCEL.

    Args:
        system_prompt: Prompt string containing form schema and stats.
        history:       Full prior conversation (client-held, passed each turn).
        user_message:  The analyst's latest question.

    Returns:
        A validated AnalyzeReply with a markdown-formatted reply string.
    """
    history_messages = _format_history(history)

    logger.info(
        "analyze_responses turn | history_turns=%d | user_message_len=%d",
        len(history),
        len(user_message),
    )

    result: AnalyzeReply = await _chain.ainvoke({
        "system_prompt": system_prompt,
        "history": history_messages,
        "user_message": user_message,
    })

    logger.info(
        "analyze_responses turn complete | reply_len=%d",
        len(result.reply),
    )

    return result
