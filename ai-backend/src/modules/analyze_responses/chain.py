"""
modules/analyze_responses/chain.py
------------------------------------
Stateless LangChain chain for one conversational turn of the analyze-responses flow.

Design mirrors fill_form/chain.py:
  - Uses llm.with_structured_output(AnalyzeReply)
  - Input:  system_prompt (str) + messages (history) + user_message (latest)
  - Output: a validated AnalyzeReply instance (reply text only)
  - Fully async, no side effects, no session state
"""

from __future__ import annotations

import logging

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from src.config.models import llm
from src.modules.analyze_responses.data_models import (
    AnalyzeReply,
    ConversationMessage,
)

logger = logging.getLogger(__name__)

# Structured LLM — forces the model to return a validated AnalyzeReply object.
_structured_llm = llm.with_structured_output(AnalyzeReply)


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


async def run_analyze_responses_turn(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> AnalyzeReply:
    """
    Execute one stateless analyze-responses conversational turn.

    Args:
        system_prompt: Pre-built prompt string from the Express backend.
                       Contains form schema, aggregate stats, and recent raw responses.
        history:       Full prior conversation (client-held, passed each turn).
        user_message:  The analyst's latest question.

    Returns:
        A validated AnalyzeReply with a markdown-formatted reply string.

    Raises:
        langchain_core.exceptions.OutputParserException: if the LLM returns
            a malformed response (rare at temperature=0).
        groq.APIError: on upstream Groq API failures (propagated as-is).
    """
    messages = _build_messages(system_prompt, history, user_message)

    logger.info(
        "analyze_responses turn | history_turns=%d | user_message_len=%d",
        len(history),
        len(user_message),
    )

    result: AnalyzeReply = await _structured_llm.ainvoke(messages)

    logger.info(
        "analyze_responses turn complete | reply_len=%d",
        len(result.reply),
    )

    return result
