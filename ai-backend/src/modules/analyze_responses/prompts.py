"""
modules/analyze_responses/prompts.py
--------------------------------------
System prompt template and builder for the analyze-responses conversational AI.
Directly constructs the prompt from structured AnalyticsContext.
"""

from __future__ import annotations

import json
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from src.modules.analyze_responses.data_models import (
    AnalyticsContext,
    AnalyticsQuestionContext,
    QuestionInsightContext,
    RawResponseContext,
)

MAX_RECENT_RESPONSES = 50


def serialize_question_insight(insight: QuestionInsightContext) -> str:
    lines = [
        f"  - **{insight.label}** ({insight.type})",
        f"    Answer rate: {insight.answerRate:.1f}%  |  Answered: {insight.totalAnswered}  |  Skipped: {insight.totalSkipped}",
    ]

    if insight.distribution:
        dist_str = ", ".join(
            f"'{d.label}' {d.count} ({d.percent:.1f}%)"
            for d in insight.distribution[:8]
        )
        lines.append(f"    Distribution: {dist_str}")

    if insight.averageScore is not None:
        lines.append(f"    Average score: {insight.averageScore:.2f}")

    if insight.topWords:
        words = ", ".join(
            f"'{w.word}' ({w.count})"
            for w in insight.topWords[:10]
        )
        lines.append(f"    Top words: {words}")

    return "\n".join(lines)


def serialize_raw_response(
    response: RawResponseContext,
    questions: list[AnalyticsQuestionContext],
    index: int,
) -> str:
    label_map = {q.id: q.label for q in questions}

    answer_parts = []
    for q_id, val in response.answers.items():
        if val is not None and val != "":
            label = label_map.get(q_id, q_id)
            display = json.dumps(val) if isinstance(val, (dict, list)) else str(val)
            answer_parts.append(f"{label}: {display}")

    answers_str = " | ".join(answer_parts) if answer_parts else "(no answers)"
    return f"  {index + 1}. [{response.submittedAt}] {answers_str}"


def build_analyze_system_prompt(context: AnalyticsContext) -> str:
    """Build the full system prompt from AnalyticsContext in Python."""
    description_block = (
        f"Description: {context.formDescription}"
        if context.formDescription
        else ""
    )

    if context.questions:
        q_lines = [
            f"  - [{q.id}] {q.label} ({q.type}{', required' if q.isRequired else ', optional'})"
            for q in context.questions
        ]
        questions_block = "\n".join(q_lines)
    else:
        questions_block = "  (no questions defined)"

    stats = context.stats
    last_sub = stats.lastSubmissionAt or "N/A"

    if stats.questionInsights:
        insights_block = "\n".join(
            serialize_question_insight(qi) for qi in stats.questionInsights
        )
    else:
        insights_block = "  (no per-question data available)"

    aggregate_block = f"""Total Views: {stats.totalViews}
Total Submissions: {stats.totalSubmissions}  |  Completed: {stats.completedSubmissions}  |  Partial: {stats.partialSubmissions}
Overall Completion Rate: {stats.completionRate:.1f}%
Engagement Rate: {stats.engagementRate:.1f}%
Drop-off Rate: {stats.dropoffRate:.1f}%
Last Submission: {last_sub}

Per-question breakdown:
{insights_block}""".strip()

    capped = context.recentResponses[:MAX_RECENT_RESPONSES]
    if capped:
        recent_block = "\n".join(
            serialize_raw_response(r, context.questions, i)
            for i, r in enumerate(capped)
        )
    else:
        recent_block = "  (no responses yet)"

    prompt = f"""You are **Grizzy**, a warm and insightful AI analytics assistant for Convia \
— a form-intelligence platform.
Your job is to help the **form owner** understand their form's response data \
through natural conversation.

## Form Overview
Form: {context.formTitle}{chr(10) + description_block if description_block else ""}

## Questions / Fields
{questions_block}

## Aggregate Statistics (full dataset — {stats.totalSubmissions} total submissions)
{aggregate_block}

## Recent Responses (last {len(capped)} submissions — raw answers)
{recent_block}

## Your Capabilities & Rules
1. **Data-grounded answers only**: Base every answer strictly on the statistics \
and raw responses provided above. Never invent data, percentages, or trends \
that are not present in the context.
2. **Acknowledge limitations**: If the user asks something you cannot answer \
from the given data (e.g. future predictions, data outside this form), say so \
honestly and explain what would be needed.
3. **Qualitative + quantitative**: Summarise open-text answers, identify \
sentiment themes, or spot patterns in the raw responses. For numeric questions, \
cite exact figures from the stats block.
4. **Markdown output**: Use markdown tables, bullet lists, or bold text where \
it improves readability. Keep replies concise unless depth is requested.
5. **Scope**: Only discuss this form's response data. Politely decline \
unrelated questions and redirect to the data.
6. **Tone**: Warm, professional, and analytical — like a knowledgeable \
colleague reviewing data together.

## Output Format
Return ONLY valid JSON: {{ "reply": "<your markdown-formatted answer>" }}
No markdown fences, no extra commentary outside the JSON."""

    return prompt


# ChatPromptTemplate for LCEL chain
analyze_chat_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "{system_prompt}"),
        MessagesPlaceholder("history"),
        ("human", "{user_message}"),
    ]
)
