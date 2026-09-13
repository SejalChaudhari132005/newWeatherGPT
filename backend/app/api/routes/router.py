from fastapi import APIRouter
from backend.app.api.routes import (
    health,
    location,
    weather,
    alerts,
    intelligence,
    chat,
    language,
    voice,
    bhashini,
    route,
    map as map_routes,
    imd_diagnostics,
    radar,
    air_quality,
    roles,
    researcher,
    websocket,
)

api_router = APIRouter(prefix="/api")

# Register routes
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(location.router, tags=["Location"])
api_router.include_router(weather.router, tags=["Weather"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(intelligence.router, tags=["Intelligence"])
api_router.include_router(chat.router, tags=["Chat"])
api_router.include_router(language.router, tags=["Language"])
api_router.include_router(voice.router, tags=["Voice"])
api_router.include_router(bhashini.router, tags=["BHASHINI Multilingual & Voice Layer"])
api_router.include_router(route.router, tags=["Weather-Aware Route Intelligence"])
api_router.include_router(map_routes.router, tags=["Weather Map & Radar Layers"])
api_router.include_router(imd_diagnostics.router, tags=["IMD Diagnostics"])
api_router.include_router(radar.router, tags=["Precipitation Radar"])
api_router.include_router(air_quality.router, tags=["Air Quality Intelligence"])
api_router.include_router(roles.router, tags=["Role Decision Intelligence"])
api_router.include_router(researcher.router, tags=["Researcher Intelligence / WeatherLab"])
api_router.include_router(websocket.router, tags=["Real-Time WebSocket & Ingestion Pipeline"])




