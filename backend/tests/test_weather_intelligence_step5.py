import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.weather_thresholds import weather_thresholds
from backend.app.services.weather_risk_service import WeatherRiskService
from backend.app.services.weather_insight_service import WeatherInsightService
from backend.app.services.confidence_service import ConfidenceService
from backend.app.agents.fusion_agent import WeatherFusionAgent
from backend.app.schemas.weather_intelligence import WeatherIntelligenceResponse

client = TestClient(app)

def test_risk_service_high_rain_and_heat():
    risk_service = WeatherRiskService()
    
    current = {
        "temperature": 41.5,
        "feels_like": 46.0,
        "rain_probability": 85.0,
        "precipitation": 20.0,
        "wind_speed": 45.0,
        "visibility": 1.5,
        "weather_code": 95,
        "condition": "Thunderstorm with Heavy Rain",
    }
    hourly = [
        {"time": "NOW", "rainProb": 85, "temp": 41.5},
        {"time": "01 PM", "rainProb": 90, "temp": 40.0},
    ]
    daily = [{"day": "Today", "high": 42.0, "low": 28.0}]

    assessment = risk_service.evaluate_risks(current, hourly, daily)
    
    # Assert Rain Risk is High/Extreme
    assert assessment.items["rain"].level in ["high", "extreme"]
    assert assessment.items["rain"].score >= 80

    # Assert Heat Risk is Extreme
    assert assessment.items["heat"].level == "extreme"
    assert assessment.items["heat"].score >= 90

    # Assert Wind Risk is High
    assert assessment.items["wind"].level == "high"

    # Assert Visibility Risk is Moderate/High
    assert assessment.items["visibility"].level in ["moderate", "high"]

    # Assert Thunderstorm Risk is High
    assert assessment.items["thunderstorm"].level == "high"
    assert assessment.overall_level in ["high", "extreme"]

def test_risk_service_calm_pleasant_conditions():
    risk_service = WeatherRiskService()
    
    current = {
        "temperature": 24.0,
        "feels_like": 24.0,
        "rain_probability": 5.0,
        "precipitation": 0.0,
        "wind_speed": 8.0,
        "visibility": 10.0,
        "weather_code": 0,
        "condition": "Clear Sky",
    }
    hourly = [{"time": "NOW", "rainProb": 5, "temp": 24.0}]
    daily = [{"day": "Today", "high": 27.0, "low": 18.0}]

    assessment = risk_service.evaluate_risks(current, hourly, daily)
    assert assessment.items["rain"].level == "low"
    assert assessment.items["heat"].level == "low"
    assert assessment.items["wind"].level == "low"
    assert assessment.overall_level == "low"

def test_insight_service_rain_and_uv_advisory():
    insight_service = WeatherInsightService()
    
    current = {
        "temperature": 36.0,
        "feels_like": 40.0,
        "rain_probability": 80.0,
        "uv_index": 9.5,
        "wind_speed": 15.0,
    }
    hourly = [
        {"time": "NOW", "rainProb": 80},
        {"time": "02 PM", "rainProb": 85},
    ]
    daily = [{"day": "Today", "high": 37.0, "low": 26.0}]

    insights = insight_service.generate_insights(current, hourly, daily, city_name="Kalyan")
    
    categories = [ins.category for ins in insights]
    assert "rain" in categories
    assert "uv" in categories
    assert "temperature" in categories

    rain_ins = next(ins for ins in insights if ins.category == "rain")
    assert rain_ins.is_advisory is True
    assert "Rain Expected" in rain_ins.headline

    uv_ins = next(ins for ins in insights if ins.category == "uv")
    assert uv_ins.is_advisory is True
    assert "UV" in uv_ins.headline

def test_confidence_service_agreement_and_conflict_detection():
    confidence_service = ConfidenceService()

    # Case A: Strong Agreement (delta = 0.5°C)
    om_good = {"temperature": 29.5, "humidity": 75, "wind_speed": 10, "pressure": 1012, "visibility": 8}
    imd_good = {"temperature": 29.0, "humidity": 78}
    
    res_good = confidence_service.evaluate_confidence(
        open_meteo_current=om_good,
        imd_observation=imd_good,
        open_meteo_available=True,
        imd_available=True,
        age_minutes=5
    )
    assert res_good.score >= 80
    assert res_good.level == "high"
    assert res_good.agreement_level == "good"
    assert len(res_good.conflict_warnings) == 0

    # Case B: Significant Disagreement (delta = 5.5°C)
    om_divergent = {"temperature": 29.5, "humidity": 75, "wind_speed": 10, "pressure": 1012, "visibility": 8}
    imd_divergent = {"temperature": 35.0, "humidity": 45}

    res_conflict = confidence_service.evaluate_confidence(
        open_meteo_current=om_divergent,
        imd_observation=imd_divergent,
        open_meteo_available=True,
        imd_available=True,
        age_minutes=5
    )
    assert res_conflict.agreement_level == "low"
    assert len(res_conflict.conflict_warnings) > 0
    assert "diverge" in res_conflict.conflict_warnings[0]

def test_weather_fusion_agent_builds_complete_intelligence():
    async def run_test():
        mock_weather_agent = AsyncMock()
        mock_weather_agent.get_weather.return_value = {
            "location": {"latitude": 19.2403, "longitude": 73.1305, "city": "Kalyan", "state": "Maharashtra", "country": "India"},
            "current": {
                "temperature": 30.0,
                "feels_like": 34.0,
                "humidity": 78.0,
                "rain_probability": 65.0,
                "precipitation": 2.0,
                "wind_speed": 18.0,
                "wind_direction": "WSW",
                "pressure": 1010.0,
                "visibility": 7.0,
                "uv_index": 6.5,
                "condition": "Scattered Clouds",
                "icon": "cloud-sun",
                "weather_code": 2,
                "observed_at": "2026-09-08T17:00:00Z"
            },
            "hourly": [{"time": "NOW", "temp": 30.0, "condition": "Scattered Clouds", "icon": "cloud-sun", "rainProb": 65}],
            "daily": [{"day": "Today", "date": "Sep 08", "high": 32.0, "low": 24.0, "condition": "Scattered Clouds", "icon": "cloud-sun", "rainProbability": 70}],
            "source": {"provider": "Open-Meteo", "retrieved_at": "2026-09-08T17:00:00Z", "is_cached": False}
        }

        mock_alert_agent = AsyncMock()
        mock_alert_agent.get_active_alerts.return_value = [
            {
                "id": "alert-imd-1",
                "type": "rainfall",
                "severity": "yellow",
                "severity_label": "Be Aware (Watch)",
                "title": "Moderate Rain Watch",
                "description": "Scattered rainfall spells expected.",
                "affected_area": "Thane",
                "source": "India Meteorological Department",
                "valid_until": "2026-09-09T00:00:00Z",
                "issued_at": "2026-09-08T12:00:00Z"
            }
        ]

        mock_imd_provider = AsyncMock()
        mock_imd_provider.get_current_observation.return_value = {
            "source": "India Meteorological Department",
            "station_name": "Thane",
            "station_code": "43004",
            "district": "Thane",
            "subdivision": "Konkan & Goa",
            "state": "Maharashtra",
            "temperature": 29.5,
            "humidity": 80.0,
            "rainfall_past_24h": 4.0,
            "forecast_summary": "Generally cloudy sky with rain",
            "observed_at": "2026-09-08T12:00:00Z",
            "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India"
        }

        agent = WeatherFusionAgent(
            weather_agent_inst=mock_weather_agent,
            alert_agent_inst=mock_alert_agent,
            imd_provider_inst=mock_imd_provider,
        )

        intel = await agent.build_weather_intelligence(19.2403, 73.1305, {"city": "Kalyan", "state": "Maharashtra"})
        
        # Verify Provenance
        assert intel.current.temperature.value == 30.0
        assert intel.current.temperature.source == "Open-Meteo"
        assert intel.official_information.observations[0].temperature == 29.5
        assert intel.official_information.observations[0].source == "India Meteorological Department"

        # Verify Risks, Insights & Confidence are generated
        assert intel.risks.overall_level in ["low", "moderate", "high", "extreme"]
        assert len(intel.insights) > 0
        assert intel.confidence.score >= 50
        assert len(intel.alerts) == 1
        assert intel.alerts[0].severity == "yellow"
        assert intel.location.imd_station == "Thane"

    asyncio.run(run_test())

def test_api_weather_intelligence_endpoint():
    res = client.get("/api/weather/intelligence?latitude=19.2403&longitude=73.1305&city=Kalyan")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    data = json_data["data"]

    # Verify structure
    assert "location" in data
    assert "current" in data
    assert "forecast" in data
    assert "official_information" in data
    assert "alerts" in data
    assert "risks" in data
    assert "insights" in data
    assert "confidence" in data
    assert "source_status" in data
    assert "data_freshness" in data

    # Verify coordinate preservation
    assert data["location"]["latitude"] == 19.2403
    assert data["location"]["longitude"] == 73.1305
