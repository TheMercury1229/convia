"""
modules/generate-form/route.py
-------------------------------
FastAPI APIRouter for POST /api/generate-form

Accepts a user_query, runs the LangChain generation chain, and returns
a structured payload that the frontend can destructure and write to the DB.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Form Generation"])


# ---------------------------------------------------------------------------
# Request / Response schemas (API layer — separate from the LLM output models)
# ---------------------------------------------------------------------------

class GenerateFormRequest(BaseModel):
    user_query: str = Field(
        ...,
        min_length=5,
        max_length=2000,
        description="Natural-language description of the form the user wants to create.",
        examples=["Create a job application form with personal details, work experience, and a file upload for the resume."],
    )


class GenerateFormResponse(BaseModel):
    """
    Envelope returned to the client.
    `data` contains the raw GeneratedForm dict with keys:
        { form, sections, questions }
    The client can destructure this object and write directly to the DB.
    """
    success: bool = True
    data:    dict = Field(description="{ form, sections, questions } — ready for DB insertion")


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post(
    "/generate-form",
    response_model=GenerateFormResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a complete form from a natural-language description",
    description=(
        "Invokes the Convio AI engine to produce a structured form specification "
        "(form metadata + sections + questions) from the user's query. "
        "The response payload is DB-ready and can be destructured directly."
    ),
)
async def generate_form(body: GenerateFormRequest) -> GenerateFormResponse:
    # Import here to avoid circular-import issues at module load time
    # and because the chain module itself loads config/models (dotenv).
    from src.modules.generate_form.chain import run_generate_form_chain

    logger.info("generate_form called | query_length=%d", len(body.user_query))

    try:
        result = await run_generate_form_chain(body.user_query)
    except Exception as exc:
        logger.exception("Chain invocation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI generation failed: {str(exc)}",
        ) from exc

    # Serialise to dict — excludes unset optional fields (keeps payload lean)
    payload = result.model_dump(exclude_unset=False, exclude_none=True)

    logger.info(
        "generate_form success | sections=%d questions=%d",
        len(payload.get("sections", [])),
        len(payload.get("questions", [])),
    )

    return GenerateFormResponse(data=payload)
