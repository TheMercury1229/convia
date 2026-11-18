"""
modules/builder_chat/chain.py
-------------------------------
Stateless LangChain chain for one conversational turn of the Grizzy Builder Chat.

- Uses llm.with_structured_output(BuilderChatReply)
- Input: system_prompt (str) + history (ConversationMessage) + user_message (str)
- Output: validated BuilderChatReply instance (reply text + actions list)
"""

from __future__ import annotations

import logging
from langchain_core.messages import AIMessage, HumanMessage

from src.config.models import llm_google
from src.modules.builder_chat.data_models import (
    BuilderChatReply,
    ConversationMessage,
)
from src.modules.builder_chat.prompts import builder_chat_prompt

logger = logging.getLogger(__name__)

# Structured LLM forces the model to return a validated BuilderChatReply object.
_structured_llm = llm_google.with_structured_output(BuilderChatReply)
_chain = builder_chat_prompt | _structured_llm


def _format_history(history: list[ConversationMessage]) -> list:
    """Convert history into LangChain HumanMessage / AIMessage objects."""
    lc_messages = []
    for msg in history:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))
    return lc_messages


async def run_builder_chat_turn(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> BuilderChatReply:
    """
    Execute one stateless form-builder conversational turn.

    Args:
        system_prompt: Full prompt string containing form schema and instructions.
        history:       Prior conversation history for this builder session.
        user_message:  The builder's latest instruction or question.

    Returns:
        Validated BuilderChatReply with reply markdown and mutation actions.
    """
    prompt_text = system_prompt
    if "json" not in prompt_text.lower():
        prompt_text += "\n\nReturn your response as a valid JSON object with 'reply' and 'actions'."

    history_messages = _format_history(history)

    logger.info(
        "builder_chat turn | history_len=%d | user_message_len=%d",
        len(history),
        len(user_message),
    )

    result: BuilderChatReply = await _chain.ainvoke({
        "system_prompt": prompt_text,
        "history": history_messages,
        "user_message": user_message,
    })

    logger.info(
        "builder_chat turn complete | reply_len=%d | action_count=%d",
        len(result.reply),
        len(result.actions),
    )

    return result
