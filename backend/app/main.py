import os
import sys
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

# Ensure project root & app directory are on sys.path for direct script execution
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))

for path in (project_root, backend_dir, current_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

from backend.app.core.config import settings
from backend.app.core.logging import logger, LoggingMiddleware
from backend.app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from backend.app.api.routes.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"WeatherGPT API starting in [{settings.ENVIRONMENT}] mode")
    yield
    logger.info("WeatherGPT API shutting down")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS Middleware for development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom logging middleware
app.add_middleware(LoggingMiddleware)

# Register custom exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Mount API router
app.include_router(api_router)

# Mount direct root WebSocket endpoint ws://localhost:8000/ws/live-alerts
from fastapi import WebSocket
from backend.app.api.routes.websocket import websocket_live_alerts
@app.websocket("/ws/live-alerts")
async def root_websocket_live_alerts(websocket: WebSocket, client_id: str = "web-client"):
    await websocket_live_alerts(websocket, client_id=client_id)

if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
