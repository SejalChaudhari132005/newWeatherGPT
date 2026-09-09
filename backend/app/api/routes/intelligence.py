from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.agents.fusion_agent import weather_fusion_agent
from backend.app.schemas.weather_intelligence import WeatherIntelligenceResponse

router = APIRouter()

@router.get("/weather/intelligence", response_model=WeatherIntelligenceResponse)
async def get_weather_intelligence(
    latitude: float = Query(..., description="Exact GPS or manual latitude", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Exact GPS or manual longitude", ge=-180.0, le=180.0),
    city: Optional[str] = Query(None, description="Optional city metadata"),
    district: Optional[str] = Query(None, description="Optional district metadata"),
    state: Optional[str] = Query(None, description="Optional state metadata"),
    country: Optional[str] = Query("India", description="Optional country metadata"),
):
    """
    Retrieve production-ready Verified Weather Intelligence:
    - Provenance-aware current conditions
    - Numerical model forecast timeline (Open-Meteo)
    - Official meteorological intelligence (IMD)
    - Active government weather warnings (IMD)
    - Deterministic risk assessment (Risk Engine)
    - Natural language weather insights (Insight Engine)
    - Data confidence score & conflict detection (Confidence Engine)
    """
    location_meta = {
        "city": city,
        "district": district,
        "state": state,
        "country": country,
    }

    try:
        data = await weather_fusion_agent.build_weather_intelligence(
            latitude=latitude,
            longitude=longitude,
            location_meta=location_meta
        )
        return WeatherIntelligenceResponse(success=True, data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate weather intelligence: {str(exc)}"
        )


@router.get("/intelligence/citizen")
async def get_citizen_intelligence(
    latitude: float = Query(..., description="Exact GPS or manual latitude", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Exact GPS or manual longitude", ge=-180.0, le=180.0),
    city: Optional[str] = Query(None, description="Optional city metadata"),
    district: Optional[str] = Query(None, description="Optional district metadata"),
    state: Optional[str] = Query(None, description="Optional state metadata"),
    country: Optional[str] = Query("India", description="Optional country metadata"),
    role: Optional[str] = Query("citizen", description="User role, defaults to citizen"),
):
    """
    Step 8 Role-Based Intelligence Endpoint:
    Returns dynamic, non-hardcoded Citizen dashboard intelligence:
    - Outdoor Plan (Umbrella, walking, activities)
    - Commute Safety (Road condition, visibility, rain impact)
    - Weather Advice (UV protection, hydration, comfort)
    - Official Warning (IMD authoritative warnings)
    - Outdoor Suitability (Event planning assessment: GOOD / MODERATE / POOR)
    """
    from backend.app.agents.role_router import role_router

    location_meta = {
        "city": city,
        "district": district,
        "state": state,
        "country": country,
    }

    try:
        data = await weather_fusion_agent.build_weather_intelligence(
            latitude=latitude,
            longitude=longitude,
            location_meta=location_meta
        )
        agent = role_router.get_agent(role)
        insights = await agent.generate_dashboard_insights(data)

        return {
            "success": True,
            "role": agent.role_name,
            "location": {
                "city": data.location.city or city,
                "district": data.location.district or district,
                "state": data.location.state or state,
                "latitude": latitude,
                "longitude": longitude,
            },
            "intelligence": insights,
            "weather_summary": {
                "temperature": data.current.temperature.value if data.current.temperature else None,
                "feels_like": data.current.feels_like.value if data.current.feels_like else None,
                "condition": data.current.condition,
                "rain_probability": data.current.rain_probability.value if data.current.rain_probability else 0.0,
                "wind_speed": data.current.wind_speed.value if data.current.wind_speed else 0.0,
                "uv_index": data.current.uv_index.value if data.current.uv_index else 0.0,
                "visibility": data.current.visibility.value if data.current.visibility else 10.0,
                "humidity": data.current.humidity.value if data.current.humidity else 60.0,
            }
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate citizen intelligence: {str(exc)}"
        )

