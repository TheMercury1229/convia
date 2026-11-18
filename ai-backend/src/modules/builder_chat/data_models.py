"""
modules/builder_chat/data_models.py
------------------------------------
Pydantic v2 schemas for the Grizzy Builder Chat AI endpoint.

Defines:
- BuilderChatTurnRequest: payload accepted by POST /api/builder/turn
- BuilderAction: structured mutation actions emitted by the LLM
- BuilderChatReply: structured LLM output (conversational markdown + action list)
"""

from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Conversation history
# ---------------------------------------------------------------------------

class ConversationMessage(BaseModel):
    """One message in the conversation history passed from the client each turn."""
    role: Literal["user", "assistant"] = Field(
        description="'user' = form creator/builder, 'assistant' = Grizzy."
    )
    content: str = Field(description="The text content of the message.")


# ---------------------------------------------------------------------------
# Form context schemas (optional structured representation if provided)
# ---------------------------------------------------------------------------

class QuestionOptionContext(BaseModel):
    id: str
    label: str


class QuestionContext(BaseModel):
    id: str
    sectionId: Optional[str] = ""
    type: str
    label: str
    description: Optional[str] = ""
    placeholder: Optional[str] = ""
    required: bool = False
    position: int = 0
    options: list[QuestionOptionContext] = Field(default_factory=list)
    validation: Optional[dict[str, Any]] = Field(default_factory=dict)


class SectionContext(BaseModel):
    id: str
    title: Optional[str] = ""
    description: Optional[str] = ""
    position: int = 0


class FormMetaContext(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""


class SelectedElementContext(BaseModel):
    type: Literal["form", "section", "question"]
    id: str


class BuilderFormContext(BaseModel):
    form: FormMetaContext
    sections: list[SectionContext] = Field(default_factory=list)
    questions: list[QuestionContext] = Field(default_factory=list)
    selectedElement: Optional[SelectedElementContext] = None


# ---------------------------------------------------------------------------
# Request: sent by the Express app backend (or frontend directly)
# ---------------------------------------------------------------------------

class BuilderChatTurnRequest(BaseModel):
    """
    Full context for one conversational form builder turn.
    Can accept either a pre-built system_prompt from the Express backend,
    or a structured form_context (which will be rendered into a system prompt).
    """
    system_prompt: Optional[str] = Field(
        None,
        description="System prompt containing full form schema, constraints, and instructions.",
    )
    messages: list[ConversationMessage] = Field(
        default_factory=list,
        description="Full conversation history so far (excluding current user_message).",
    )
    user_message: str = Field(
        min_length=1,
        max_length=4000,
        description="The form creator's latest message or instruction.",
    )
    form_context: Optional[BuilderFormContext] = Field(
        None,
        description="Structured form context if system_prompt is not pre-computed.",
    )


# ---------------------------------------------------------------------------
# Action mutations emitted by the LLM
# ---------------------------------------------------------------------------

ActionType = Literal[
    "updateQuestion",
    "updateValidation",
    "updateSection",
    "updateForm",
    "addQuestion",
    "deleteQuestion",
    "addSection",
    "deleteSection",
]


class BuilderAction(BaseModel):
    """
    A single structured mutation to apply to the builder store.
    """
    model_config = {"extra": "allow"}

    type: ActionType = Field(
        description="The mutation type to execute on the client store."
    )
    id: Optional[str] = Field(
        None,
        description="Target ID (questionId or sectionId) when updating or deleting.",
    )
    sectionId: Optional[str] = Field(
        None,
        description="Target section ID when adding a question.",
    )
    questionType: Optional[str] = Field(
        None,
        description="Question type when adding a question (e.g. text, email, number, select, rating, etc.).",
    )
    patch: Optional[dict[str, Any]] = Field(
        None,
        description="Key-value patch dictionary for updateQuestion, updateValidation, updateSection, or updateForm.",
    )
    validation: Optional[dict[str, Any]] = Field(
        None,
        description="Validation rules dictionary for a newly added question or validation updates.",
    )
    label: Optional[str] = Field(
        None,
        description="Label for a newly added question.",
    )
    title: Optional[str] = Field(
        None,
        description="Title for a newly added section.",
    )
    description: Optional[str] = Field(
        None,
        description="Description for a newly added question or section.",
    )
    placeholder: Optional[str] = Field(
        None,
        description="Placeholder text for a newly added question.",
    )
    required: Optional[bool] = Field(
        None,
        description="Whether a newly added question is required.",
    )
    options: Optional[list[dict[str, Any]]] = Field(
        None,
        description="Options array (list of {id: str, label: str}) for choice-based questions.",
    )


# ---------------------------------------------------------------------------
# Top-level LLM output
# ---------------------------------------------------------------------------

class BuilderChatReply(BaseModel):
    """
    Structured output returned by the LLM on each turn.
    """
    reply: str = Field(
        description=(
            "Grizzy's conversational response. If the user is asking questions, advice, "
            "or review, answer thoroughly in markdown. If actions were performed, briefly confirm."
        )
    )
    actions: Optional[list[BuilderAction]] = Field(
        default_factory=list,
        description=(
            "Optional list of structured mutation actions to apply to the builder store. "
            "Leave as an empty list [] if the user is merely asking about the form, seeking feedback, "
            "or not explicitly asking to edit or add elements."
        ),
    )
