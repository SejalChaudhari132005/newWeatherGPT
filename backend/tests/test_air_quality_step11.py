import sys
import os
from fastapi.testclient import TestClient

# Ensure sys.path includes root and backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app
from backend.app.services.air_quality_engine import air_quality_engine

client = TestClient(app)


def test_air_quality_engine_classification():
    # Test Good (AQI <= 20)
    eval_good = air_quality_engine.evaluate_aqi_category(15)
    assert eval_good["category"] == "GOOD"
    assert eval_good["label"] == "Good"

    adv_good = air_quality_engine.generate_citizen_advisory("GOOD", "pm2_5")
    assert "outdoor activities" in adv_good["outdoor"].lower()

    # Test Poor (AQI 60-80)
    eval_poor = air_quality_engine.evaluate_aqi_category(75)
    assert eval_poor["category"] == "POOR"
    
    pollutants = {
        "pm2_5": 60.0,
        "pm10": 110.0,
        "no2": 130.0,
        "o3": 140.0,
        "so2": 220.0,
        "co": 12000.0,
    }
    primary = air_quality_engine.determine_primary_pollutant(pollutants)
    assert primary in ["pm2_5", "pm10", "no2", "so2", "o3", "co"]
    
    adv_poor = air_quality_engine.generate_citizen_advisory("POOR", primary)
    assert "sensitive" in adv_poor["sensitive"].lower() or "limit" in adv_poor["sensitive"].lower()

    # Test Extremely Poor (AQI > 100)
    eval_extreme = air_quality_engine.evaluate_aqi_category(110)
    assert eval_extreme["category"] == "EXTREMELY_POOR"


def test_air_quality_engine_trend():
    # Improving trend (current high, future low -> diff_pct < -0.15)
    trend_improving = air_quality_engine.evaluate_trend([80.0, 78.0, 75.0, 50.0, 45.0, 40.0])
    assert trend_improving["trend"] == "IMPROVING"

    # Worsening trend (current low, future high -> diff_pct > 0.15)
    trend_worsening = air_quality_engine.evaluate_trend([30.0, 32.0, 31.0, 60.0, 65.0, 70.0])
    assert trend_worsening["trend"] == "WORSENING"

    # Stable trend
    trend_stable = air_quality_engine.evaluate_trend([50.0, 50.0, 51.0, 50.0, 52.0, 51.0])
    assert trend_stable["trend"] == "STABLE"


def test_weather_synergy_note():
    note = air_quality_engine.combine_weather_and_air_quality(
        aqi_category="POOR",
        primary_pollutant="pm2_5",
        temperature=36.0,
        humidity=80.0,
        condition="Scattered Clouds"
    )
    assert note is not None
    assert "heat stress" in note.lower() or "humidity" in note.lower()


def test_air_quality_current_endpoint():
    # Kalyan coordinates
    response = client.get("/api/air-quality/current?latitude=19.2403&longitude=73.1305")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "location" in data
    assert "air_quality" in data
    assert "interpretation" in data
    assert "aqi" in data["air_quality"]
    assert "category" in data["air_quality"]
    assert len(data["air_quality"]["pollutants"]) >= 5


def test_air_quality_hourly_endpoint():
    # Delhi coordinates
    response = client.get("/api/air-quality/hourly?latitude=28.6139&longitude=77.2090&hours=24")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "trend" in data
    assert "hours" in data
    assert len(data["hours"]) > 0
    assert "time" in data["hours"][0]
    assert "aqi" in data["hours"][0]
