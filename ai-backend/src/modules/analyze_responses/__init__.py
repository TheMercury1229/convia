"""
modules/analyze_responses/__init__.py
--------------------------------------
Expose the FastAPI router for the analyze-responses module.
"""

from src.modules.analyze_responses.route import router

__all__ = ["router"]
