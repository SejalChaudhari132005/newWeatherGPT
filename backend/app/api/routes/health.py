from fastapi import APIRouter
from backend.app.schemas.health import HealthCheckResponse

router = APIRouter()

@router.get("/health", response_model=HealthCheckResponse, summary="Backend Health Check")
async def health_check():
    """Health check endpoint to verify backend service readiness."""
    return HealthCheckResponse(
        status="ok",
        service="WeatherGPT API"
    )
