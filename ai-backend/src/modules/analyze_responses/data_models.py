"""
modules/analyze_responses/data_models.py
-----------------------------------------
Pydantic v2 request/response schemas for the analyze-responses AI turn endpoint.

Key design:
- AnalyzeResponsesTurnRequest  — what the Express backend sends each turn
- AnalyzeReply                 — what the LLM returns (a single reply string)

Unlike fill_form, there is no structured extraction needed here.
Grizzy's only job is to answer the analyst's question conversationally,
so the output is a plain reply string wrapped in a lightweight model to
keep the structured-output pattern consistent across modules.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Conversation history  (shared shape with fill_form)
# ---------------------------------------------------------------------------

class ConversationMessage(BaseModel):
    """One message in the conversation history sent from the frontend each turn."""
    role: Literal["user", "assistant"] = Field(
        description="'user' = form owner/analyst, 'assistant' = Grizzy."
    )
    content: str = Field(description="The text of the message.")


# ---------------------------------------------------------------------------
# Request — sent by the Express app backend (stateless, full context per turn)
# ---------------------------------------------------------------------------

class AnalyzeResponsesTurnRequest(BaseModel):
    """
    Full context for one conversational analysis turn.

    The Express backend is responsible for:
    - building system_prompt from form schema + pre-computed analytics context
      (the frontend already holds this data from the initial page load —
       no extra DB queries needed per turn)
    - forwarding the client-held messages[] history unchanged
    - appending the latest user_message
    """
    system_prompt: str = Field(
        description=(
            "System prompt built by the Express backend. Contains form metadata, "
            "question definitions, aggregate stats summary, and recent raw responses."
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
        description="The analyst's latest question or message.",
    )


# ---------------------------------------------------------------------------
# Response — what the LLM returns (structured output)
# ---------------------------------------------------------------------------

class AnalyzeReply(BaseModel):
    """
    Structured output the LLM must return for every analysis turn.

    A single `reply` field is sufficient — unlike fill_form there is no
    extraction step.  Wrapping in a model keeps the structured-output pattern
    consistent and makes it trivial to add fields later (e.g. suggested_followups).
    """
    reply: str = Field(
        description=(
            "Grizzy's conversational answer to the analyst's question. "
            "Should be clear, data-grounded, and use markdown for tables/lists "
            "where it aids readability."
        )
    )
