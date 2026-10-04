"""
main.py
-------
Entrypoint — run with:  python main.py   or   uvicorn main:app --port 8080
"""

import uvicorn
from src.app import app  # re-export so `uvicorn main:app` also works

if __name__ == "__main__":
    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=8080,
        reload=True,          # hot-reload in development
        log_level="info",
    )
