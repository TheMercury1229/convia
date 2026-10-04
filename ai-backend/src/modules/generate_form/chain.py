"""
modules/generate-form/chain.py
-------------------------------
LangChain LCEL chain: prompt | llm.with_structured_output(GeneratedForm)

This is the only place where the LLM is bound to the output schema.
Import and call `run_generate_form_chain` from the route layer.
"""

from src.config.models import llm
from src.modules.generate_form.data_models import GeneratedForm
from src.modules.generate_form.prompts import form_generation_prompt

# Structured LLM — Groq will return a validated GeneratedForm instance
_structured_llm = llm.with_structured_output(GeneratedForm)

# LCEL chain: format prompt → call structured LLM
_chain = form_generation_prompt | _structured_llm


async def run_generate_form_chain(user_query: str) -> GeneratedForm:
    """
    Invoke the form-generation chain asynchronously.

    Args:
        user_query: Raw natural-language description from the end user.

    Returns:
        A fully validated `GeneratedForm` instance whose fields map directly
        to the `form`, `section`, and `question` database tables.

    Raises:
        langchain_core.exceptions.OutputParserException: if the LLM response
            cannot be coerced into GeneratedForm (very rare with temperature=0).
        groq.APIError: on upstream Groq API failures (propagated as-is for the
            route layer to convert to an HTTP 502).
    """
    result: GeneratedForm = await _chain.ainvoke({"user_query": user_query})
    return result
