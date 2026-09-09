import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.imd_location_mapper import imd_location_mapper
from backend.app.providers.weather.imd import IMDWeatherProvider
from backend.app.agents.alert_agent import AlertAgent
from backend.app.services.weather_fusion_service import WeatherFusionService

client = TestClient(app)

def test_imd_location_mapper_delhi():
    lat, lon = 28.6139, 77.2090  # New Delhi
    mapping = imd_location_mapper.map_coordinates_to_imd(lat, lon)
    assert mapping.station_code == "42182"
    assert "Delhi" in mapping.station_name or "Safdarjung" in mapping.station_name
    assert mapping.subdivision == "Haryana Chandigarh & Delhi"
    assert mapping.original_latitude == lat
    assert mapping.original_longitude == lon
    assert mapping.distance_km < 10.0

def test_imd_location_mapper_kalyan_maharashtra():
    lat, lon = 19.2403, 73.1305  # Kalyan, Maharashtra
    mapping = imd_location_mapper.map_coordinates_to_imd(lat, lon, city_hint="Kalyan", district_hint="Thane", state_hint="Maharashtra")
    assert mapping.subdivision == "Konkan & Goa"
    assert mapping.state == "Maharashtra"
    assert mapping.district == "Thane"
    assert mapping.original_latitude == lat
    assert mapping.original_longitude == lon

def test_imd_location_mapper_bengaluru():
    lat, lon = 12.9716, 77.5946  # Bengaluru
    mapping = imd_location_mapper.map_coordinates_to_imd(lat, lon)
    assert mapping.station_code == "43295"
    assert "Bengaluru" in mapping.station_name
    assert mapping.subdivision == "South Interior Karnataka"

def test_imd_warning_normalization_and_severity():
    provider = IMDWeatherProvider()
    mapping = imd_location_mapper.map_coordinates_to_imd(19.2403, 73.1305, district_hint="Thane", state_hint="Maharashtra")

    raw_warnings = [
        {
            "id": "w1",
            "district_name": "Thane",
            "state_name": "Maharashtra",
            "colour_code": "Orange",
            "warning_text": "Heavy to very heavy rainfall likely in isolated places.",
            "title": "Heavy Rainfall Alert",
            "valid_from": "2026-09-08T00:00:00Z",
            "valid_until": "2026-09-08T23:59:59Z",
        },
        {
            "id": "w2",
            "district_name": "Patna",  # Different district in Bihar
            "state_name": "Bihar",
            "colour_code": "Red",
            "warning_text": "Severe thunderstorm with lightning.",
            "title": "Thunderstorm Warning",
        }
    ]

    filtered = provider._normalize_and_filter_warnings(raw_warnings, mapping)
    # Only Thane/Maharashtra warning should be returned for Kalyan coords
    assert len(filtered) == 1
    alert = filtered[0]
    assert alert["severity"] == "orange"
    assert alert["type"] == "rainfall"
    assert "Heavy to very heavy rainfall" in alert["description"]
    assert alert["source"] == "India Meteorological Department"

def test_alert_agent_filters_by_location():
    async def run_test():
        mock_provider = AsyncMock(spec=IMDWeatherProvider)
        mock_provider.provider_name = "India Meteorological Department"
        mock_provider.get_warnings.return_value = [
            {
                "id": "alert-1",
                "type": "rainfall",
                "severity": "yellow",
                "severity_label": "Be Aware (Watch)",
                "title": "Moderate Rain Watch",
                "description": "Light to moderate rain expected.",
                "affected_area": "Pune",
                "source": "India Meteorological Department",
                "valid_until": "2026-09-09T18:00:00Z",
                "issued_at": "2026-09-08T12:00:00Z",
            }
        ]

        agent = AlertAgent(imd_provider=mock_provider)
        alerts = await agent.get_active_alerts(18.5204, 73.8567)  # Pune
        assert len(alerts) == 1
        assert alerts[0]["type"] == "rainfall"
        assert alerts[0]["severity"] == "yellow"

    asyncio.run(run_test())

def test_weather_fusion_service_preserves_provenance():
    async def run_test():
        mock_weather_agent = AsyncMock()
        mock_weather_agent.get_weather.return_value = {
            "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra", "country": "India"},
            "current": {"temperature": 29.5, "humidity": 80, "condition": "Overcast", "observed_at": "2026-09-08T12:00:00Z", "source": "Open-Meteo"},
            "hourly": [{"time": "NOW", "temp": 29.5, "condition": "Overcast", "icon": "cloudy", "rainProb": 40, "source": "Open-Meteo"}],
            "daily": [{"day": "Today", "date": "Sep 08", "high": 31.0, "low": 25.0, "condition": "Overcast", "icon": "cloudy", "rainProbability": 50, "source": "Open-Meteo"}],
            "source": {"provider": "Open-Meteo", "retrieved_at": "2026-09-08T12:00:00Z", "is_cached": False}
        }

        mock_alert_agent = AsyncMock()
        mock_alert_agent.get_active_alerts.return_value = []

        mock_imd_provider = AsyncMock()
        mock_imd_provider.provider_name = "India Meteorological Department"
        mock_imd_provider.get_current_observation.return_value = {
            "source": "India Meteorological Department",
            "station_name": "Mumbai (Santacruz)",
            "station_code": "43003",
            "district": "Thane",
            "subdivision": "Konkan & Goa",
            "state": "Maharashtra",
            "temperature": 29.8,
            "humidity": 82,
            "rainfall_past_24h": 5.2,
            "forecast_summary": "Partly cloudy with one or two spells of rain",
            "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India"
        }

        fusion = WeatherFusionService(
            weather_agent_inst=mock_weather_agent,
            alert_agent_inst=mock_alert_agent,
            imd_provider=mock_imd_provider
        )

        fused = await fusion.get_fused_weather(19.2403, 73.1305)

        # 1. Provenance verified: Open-Meteo temperature is preserved exactly
        assert fused["current"]["temperature"] == 29.5
        assert fused["current"]["source"] == "Open-Meteo"
        assert fused["source"]["provider"] == "Open-Meteo"

        # 2. Official IMD block is separate and unmerged
        assert fused["official_information"]["source"] == "India Meteorological Department"
        assert fused["official_information"]["temperature"] == 29.8
        assert fused["official_information"]["station_name"] == "Mumbai (Santacruz)"
        assert fused["official_information"]["rainfall_past_24h"] == 5.2

    asyncio.run(run_test())

def test_api_alerts_endpoint():
    res = client.get("/api/alerts?latitude=28.6139&longitude=77.2090")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert "alerts" in json_data
    assert isinstance(json_data["alerts"], list)

def test_api_weather_endpoint_with_fusion():
    res = client.get("/api/weather?latitude=19.2403&longitude=73.1305&city=Kalyan")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    data = json_data["data"]

    # Coordinates preserved
    assert data["location"]["latitude"] == 19.2403
    assert data["location"]["longitude"] == 73.1305

    # Model forecast present
    assert data["source"]["provider"] == "Open-Meteo"
    assert "temperature" in data["current"]

    # Official IMD block present
    assert "official_information" in data
    assert data["official_information"]["source"] == "India Meteorological Department"
    assert "alerts" in data
