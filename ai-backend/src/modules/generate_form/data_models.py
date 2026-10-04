"""
modules/generate-form/data_models.py
-------------------------------------
Pydantic v2 output schemas that map 1-to-1 with the Drizzle DB schema.

Layout mirrors the DB exactly so the caller can destructure the response
and write rows directly without any transformation:

    { form, sections, questions } = response

Field names match the DB column names (snake_case).
Types match the DB column constraints (Optional where nullable, etc.).
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enum — mirrors pgEnum("question_type", [...])
# ---------------------------------------------------------------------------

class QuestionType(str, Enum):
    text        = "text"
    textarea    = "textarea"
    paragraph   = "paragraph"
    number      = "number"
    email       = "email"
    phone       = "phone"
    date        = "date"
    select      = "select"
    multi_select = "multi_select"
    radio       = "radio"
    checkbox    = "checkbox"
    rating      = "rating"
    file        = "file"
    url         = "url"
    time        = "time"
    datetime    = "datetime"
    yes_no      = "yes_no"
    scale       = "scale"
    heading     = "heading"


# ---------------------------------------------------------------------------
# Nested JSON shapes stored in question.options / question.validation columns
# ---------------------------------------------------------------------------

class QuestionOption(BaseModel):
    """One entry in the `options` JSON array (select / radio / checkbox / multi_select)."""
    id:    str = Field(description="Short machine-safe unique identifier for this option, e.g. 'opt_1'")
    label: str = Field(description="Human-readable label shown in the UI")


class QuestionValidation(BaseModel):
    """
    Loose, type-specific validation rules stored in question.validation (JSON).
    Only populate fields that are relevant for the chosen question type.
    """
    # text / textarea / paragraph
    min_length:   Optional[int] = Field(None, description="Minimum character length")
    max_length:   Optional[int] = Field(None, description="Maximum character length")
    pattern:      Optional[str] = Field(None, description="Regex pattern the answer must match")
    custom_error: Optional[str] = Field(None, description="Custom validation error message")
    min_words:    Optional[int] = Field(None, description="Minimum word count")
    max_words:    Optional[int] = Field(None, description="Maximum word count")

    # number
    min:          Optional[float] = Field(None, description="Minimum numeric value")
    max:          Optional[float] = Field(None, description="Maximum numeric value")
    step:         Optional[float] = Field(None, description="Allowed step increment")
    integer_only: Optional[bool]  = Field(None, description="Whether only integers are accepted")

    # email
    disallow_free_emails: Optional[bool] = Field(None, description="Block free-tier email providers")
    allowed_domains:      Optional[str]  = Field(None, description="Comma-separated list of allowed email domains")

    # phone
    phone_format: Optional[str] = Field(None, description="'any' | 'e164' | 'us'")

    # date / time / datetime
    min_date:           Optional[str]  = Field(None, description="ISO date string lower bound")
    max_date:           Optional[str]  = Field(None, description="ISO date string upper bound")
    disable_past_dates: Optional[bool] = Field(None, description="Prevent past dates from being selected")
    disable_future_dates: Optional[bool] = Field(None, description="Prevent future dates from being selected")
    min_time:           Optional[str]  = Field(None, description="HH:MM lower bound")
    max_time:           Optional[str]  = Field(None, description="HH:MM upper bound")
    step_minutes:       Optional[int]  = Field(None, description="Minute step for time pickers")
    min_date_time:      Optional[str]  = Field(None, description="ISO datetime lower bound")
    max_date_time:      Optional[str]  = Field(None, description="ISO datetime upper bound")

    # select / multi_select / radio / checkbox
    default_value:    Optional[str] = Field(None, description="Pre-selected option id")
    min_selections:   Optional[int] = Field(None, description="Minimum number of options that must be chosen")
    max_selections:   Optional[int] = Field(None, description="Maximum number of options that can be chosen")
    exact_selections: Optional[int] = Field(None, description="Exact number of options that must be chosen")
    allow_other:      Optional[bool] = Field(None, description="Whether a free-text 'Other' choice is allowed")

    # rating / scale
    max_rating: Optional[int] = Field(None, description="Upper bound of rating scale")
    min_rating: Optional[int] = Field(None, description="Lower bound of rating scale")
    min_scale:  Optional[int] = Field(None, description="Minimum scale value")
    max_scale:  Optional[int] = Field(None, description="Maximum scale value")
    min_label:  Optional[str] = Field(None, description="Label for the minimum end of the scale")
    max_label:  Optional[str] = Field(None, description="Label for the maximum end of the scale")

    # yes_no
    must_be_yes: Optional[bool] = Field(None, description="Whether the answer must be 'Yes' (e.g. consent checkbox)")

    # file
    max_file_size_mb:    Optional[int] = Field(None, description="Maximum file size in megabytes")
    allowed_extensions:  Optional[str] = Field(None, description="Comma-separated allowed file extensions, e.g. '.pdf,.docx'")
    max_files:           Optional[int] = Field(None, description="Maximum number of files that can be uploaded")

    # url
    require_https:       Optional[bool] = Field(None, description="Whether the URL must use HTTPS")
    allowed_url_domains: Optional[str]  = Field(None, description="Comma-separated list of allowed URL domains")


# ---------------------------------------------------------------------------
# DB row shapes
# ---------------------------------------------------------------------------

class FormOutput(BaseModel):
    """
    Maps to the `form` table.
    `id`, `slug`, `orgId`, `createdAt`, `updatedAt` are generated server-side —
    the LLM does NOT produce them.
    """
    title:       str           = Field(description="Concise, human-friendly title for the form")
    description: Optional[str] = Field(None, description="One-sentence summary of the form's purpose")


class SectionOutput(BaseModel):
    """
    Maps to the `section` table.
    `id`, `formId`, `createdAt`, `updatedAt` are generated server-side.
    `position` is 0-based and determined by the item's index in the sections list.
    """
    title:       Optional[str] = Field(None, description="Section heading; null for the default/only section")
    description: Optional[str] = Field(None, description="Optional sub-heading or instructions for this section")
    position:    int           = Field(description="0-based ordering index of this section within the form")


class QuestionOutput(BaseModel):
    """
    Maps to the `question` table.
    `id`, `formId`, `sectionId`, `createdAt`, `updatedAt` are generated server-side.
    `section_index` tells the API which section (by 0-based index) this question belongs to.
    """
    section_index: int          = Field(description="0-based index into the sections array — links question to its parent section")
    field_name:    str          = Field(description="Machine-safe snake_case identifier, unique within the form, e.g. 'full_name'. Never use spaces or special chars.")
    label:         str          = Field(description="Human-readable question text shown in the UI")
    description:   Optional[str] = Field(None, description="Helper text shown below the label")
    placeholder:   Optional[str] = Field(None, description="Placeholder text shown inside the input when empty")
    type:          QuestionType  = Field(description="Input type — must be one of the QuestionType enum values")
    is_required:   bool          = Field(description="Whether this question must be answered before form submission")
    position:      int           = Field(description="0-based position of this question within its section")
    options:       Optional[list[QuestionOption]] = Field(
        None,
        description="Required for select / multi_select / radio / checkbox types. Must be null for all others."
    )
    validation:    Optional[QuestionValidation]   = Field(
        None,
        description="Type-specific validation rules. Omit fields that are not relevant to the question type."
    )


# ---------------------------------------------------------------------------
# Top-level structured output — what the LLM returns
# ---------------------------------------------------------------------------

class GeneratedForm(BaseModel):
    """
    Complete form payload returned by the LLM.
    The API layer destructures { form, sections, questions } and writes each
    to the corresponding DB table.
    """
    form:      FormOutput           = Field(description="Top-level form metadata")
    sections:  list[SectionOutput]  = Field(description="Ordered list of sections; at least one section is required")
    questions: list[QuestionOutput] = Field(description="Flat list of all questions across all sections, ordered by section then position")
