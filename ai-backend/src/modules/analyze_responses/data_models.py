"""
modules/analyze_responses/data_models.py
-----------------------------------------
Pydantic v2 request/response schemas for the analyze-responses AI turn endpoint.

Key design:
- AnalyzeResponsesTurnRequest  — what the Express backend sends each turn
- AnalyzeReply                 — what the LLM returns (a single reply string)
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Conversation history
# ---------------------------------------------------------------------------

class ConversationMessage(BaseModel):
    """One message in the conversation history sent from the frontend each turn."""
    role: Literal["user", "assistant"] = Field(
        description="'user' = form owner/analyst, 'assistant' = Grizzy."
    )
    content: str = Field(description="The text of the message.")


# ---------------------------------------------------------------------------
# Analytics Context Models (sent by Node without constructing raw prompt)
# ---------------------------------------------------------------------------

class DistributionItem(BaseModel):
    label: str
    count: int = 0
    percent: float = 0.0


class TopWordItem(BaseModel):
    word: str
    count: int = 0


class QuestionInsightContext(BaseModel):
    questionId: Optional[str] = None
    label: str
    type: str
    totalAnswered: int = 0
    totalSkipped: int = 0
    answerRate: float = 0.0
    distribution: list[DistributionItem] = Field(default_factory=list)
    averageScore: Optional[float] = None
    topWords: Optional[list[TopWordItem]] = Field(default_factory=list)


class AggregateStatsContext(BaseModel):
    totalViews: int = 0
    totalSubmissions: int = 0
    completedSubmissions: int = 0
    partialSubmissions: int = 0
    completionRate: float = 0.0
    engagementRate: float = 0.0
    dropoffRate: float = 0.0
    lastSubmissionAt: Optional[str] = None
    questionInsights: list[QuestionInsightContext] = Field(default_factory=list)


class AnalyticsQuestionOption(BaseModel):
    id: str
    label: str


class AnalyticsQuestionContext(BaseModel):
    id: str
    label: str
    type: str
    isRequired: bool = False
    options: list[AnalyticsQuestionOption] = Field(default_factory=list)


class RawResponseContext(BaseModel):
    submittedAt: str
    answers: dict[str, Any] = Field(default_factory=dict)


class AnalyticsContext(BaseModel):
    formTitle: str
    formDescription: Optional[str] = ""
    questions: list[AnalyticsQuestionContext] = Field(default_factory=list)
    stats: AggregateStatsContext
    recentResponses: list[RawResponseContext] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Request — sent by the Express app backend (stateless, full context per turn)
# ---------------------------------------------------------------------------

class AnalyzeResponsesTurnRequest(BaseModel):
    """
    Full context for one conversational analysis turn.
    Accepts analytics_context so Python constructs the prompt internally.
    """
    system_prompt: Optional[str] = Field(
        None,
        description="Optional pre-built system prompt for backward compatibility.",
    )
    analytics_context: Optional[AnalyticsContext] = Field(
        None,
        description="Structured analytics context to construct the prompt in Python.",
    )
    messages: list[ConversationMessage] = Field(
        default_factory=list,
        description="Full conversation history so far (excluding current user_message).",
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
    """
    reply: str = Field(
        description=(
            "Grizzy's conversational answer to the analyst's question. "
            "Should be clear, data-grounded, and use markdown for tables/lists "
            "where it aids readability."
        )
    )
