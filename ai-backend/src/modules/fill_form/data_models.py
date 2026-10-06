"""
modules/fill_form/data_models.py
---------------------------------
Pydantic v2 request/response schemas for the fill-form AI turn endpoint.

Key design:
- FillFormTurnRequest  — what the app backend sends each turn (stateless)
- TurnResponse         — what the LLM returns (reply + extracted answers + done flag)
- ExtractedAnswers     — maps questionId → any JSON-serialisable value; null = deliberate skip
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Conversation history
# ---------------------------------------------------------------------------

class ConversationMessage(BaseModel):
    """One entry in the conversation history passed from the frontend each turn."""
    role: Literal["user", "assistant"] = Field(
        description="Who sent this message — 'user' (respondent) or 'assistant' (Grizzy)."
    )
    content: str = Field(description="The text of the message.")


# ---------------------------------------------------------------------------
# Request — sent by the app backend (stateless, full context every turn)
# ---------------------------------------------------------------------------

class FillFormTurnRequest(BaseModel):
    """
    Full context for one conversational turn.

    The app backend is responsible for:
    - building system_prompt from the form schema + already-filled answers
    - forwarding the client-held messages[] history unchanged
    - appending the latest user_message
    """
    system_prompt: str = Field(
        description=(
            "System prompt built by the app backend. Contains form metadata, "
            "field definitions, validation rules, already-filled values, and "
            "the list of still-needed fields."
        )
    )
    messages: list[ConversationMessage] = Field(
        default_factory=list,
        description=(
            "Full conversation history so far (excluding the current user_message). "
            "Empty on the very first turn."
        ),
    )
    user_message: str = Field(
        min_length=1,
        max_length=4000,
        description="The respondent's latest message — not yet appended to messages[].",
    )


# ---------------------------------------------------------------------------
# Response — what the LLM returns (structured output)
# ---------------------------------------------------------------------------

class ExtractedAnswers(BaseModel):
    """
    Field values extracted from this turn's conversation.

    - Present key + non-null value  → field was answered
    - Present key + null value       → respondent deliberately skipped an optional field
    - Absent key                     → field not mentioned this turn (don't touch existing state)

    Values are any JSON type: str, int, float, bool, list[str], null.
    """
    answers: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Map of questionId → extracted value for THIS turn only. "
            "null means the user skipped an optional field. "
            "Omit keys for fields not discussed this turn."
        ),
    )


class TurnResponse(BaseModel):
    """
    Structured output the LLM must return for every conversational turn.

    - reply        → Grizzy's natural-language response shown in the chat bubble
    - extracted    → values pulled from this turn (partial is fine; null = skip)
    - is_complete  → AI's signal that all required fields are now filled
                     (the system does an authoritative check on top of this)
    """
    reply: str = Field(
        description=(
            "Grizzy's conversational response to the user. "
            "Warm, natural, never robotic. Ask for missing fields; "
            "confirm good answers; celebrate when done."
        )
    )
    extracted: ExtractedAnswers = Field(
        description=(
            "Structured extraction from this turn. "
            "Include every field the user mentioned — partial is perfectly fine."
        )
    )
    is_complete: bool = Field(
        description=(
            "Set to true ONLY when EVERY field in the form has been addressed. "
            "All required fields must be answered AND all optional fields must have been "
            "explicitly asked and either answered or deliberately declined/skipped by the user (with null). "
            "Must be false if ANY field from the Still Needed list remains unasked or unaddressed."
        )
    )
