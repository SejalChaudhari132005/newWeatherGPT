"""
Compatibility entry point forwarding to backend.app.main:app
"""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))

for path in (project_root, current_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import settings
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
