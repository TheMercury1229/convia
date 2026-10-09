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
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from src.config.models import llm_google
from src.modules.builder_chat.data_models import (
    BuilderChatReply,
    ConversationMessage,
)

logger = logging.getLogger(__name__)

# Structured LLM forces the model to return a validated BuilderChatReply object.
_structured_llm = llm_google.with_structured_output(BuilderChatReply)


def _build_messages(
    system_prompt: str,
    history: list[ConversationMessage],
    user_message: str,
) -> list:
    """
    Convert history into LangChain message objects.
    Order: [SystemMessage, ...history..., HumanMessage(user_message)]
    """
    # Ensure the messages contain the word 'json' to satisfy Groq's json_object mode requirement
    prompt_text = system_prompt
    if "json" not in prompt_text.lower():
        prompt_text += "\n\nReturn your response as a valid JSON object with 'reply' and 'actions'."

    lc_messages = [SystemMessage(content=prompt_text)]

    for msg in history:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))

    lc_messages.append(HumanMessage(content=user_message))
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
    messages = _build_messages(system_prompt, history, user_message)

    logger.info(
        "builder_chat turn | history_len=%d | user_message_len=%d",
        len(history),
        len(user_message),
    )

    result: BuilderChatReply = await _structured_llm.ainvoke(messages)

    logger.info(
        "builder_chat turn complete | reply_len=%d | action_count=%d",
        len(result.reply),
        len(result.actions),
    )

    return result
