import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.core.config import settings

# Configure standard logger
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("weathergpt")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        method = request.method
        
        logger.info(f"-> START {method} {path} [client: {client_ip}]")
        
        try:
            response: Response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            logger.info(
                f"<- END   {method} {path} | Status: {response.status_code} | Duration: {duration_ms:.2f}ms"
            )
            return response
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"<- FAIL  {method} {path} | Error: {type(exc).__name__}: {str(exc)} | Duration: {duration_ms:.2f}ms"
            )
            raise exc
