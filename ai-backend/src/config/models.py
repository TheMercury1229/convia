"""
config/models.py
----------------
Centralised LLM provider initialisation.
All modules should import `llm` from here — never instantiate ChatGroq elsewhere.
"""

import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError(
        "GROQ_API_KEY is not set. Add it to your .env file before starting the server."
    )

GROQ_MODEL_NAME="openai/gpt-oss-120b"
llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL_NAME)

GOOGLE_API_KEY=os.environ.get('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise EnvironmentError(
        "GOOGLE_API_KEY is not set. Add it to your .env file before starting the server."
    )

llm_google = ChatGoogleGenerativeAI(api_key=GOOGLE_API_KEY, model="gemini-3.8-flash")