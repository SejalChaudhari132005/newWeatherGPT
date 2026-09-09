import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.weather_code_service import decode_weather_code
from backend.app.services.weather_cache import weather_cache_service

client = TestClient(app)

def test_wmo_code_mapping():
    assert decode_weather_code(0)["condition"] == "Clear Sky"
    assert decode_weather_code(3)["condition"] == "Overcast"
    assert decode_weather_code(61)["condition"] == "Slight Rain"
    assert decode_weather_code(95)["condition"] == "Thunderstorm"

def test_weather_endpoint_valid_coordinates():
    # Kalyan coordinates
    lat = 19.2403
    lon = 73.1305
    response = client.get(f"/api/weather?latitude={lat}&longitude={lon}&city=Kalyan")

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True

    data = json_data["data"]
    assert data["location"]["latitude"] == lat
    assert data["location"]["longitude"] == lon
    assert data["location"]["city"] == "Kalyan"

    # Current weather assertion
    current = data["current"]
    assert "temperature" in current
    assert "feels_like" in current
    assert "humidity" in current
    assert "condition" in current
    assert "weather_code" in current

    # Hourly forecast (24 hours)
    assert len(data["hourly"]) == 24
    assert "temp" in data["hourly"][0]
    assert "rainProb" in data["hourly"][0]

    # Daily forecast (7 days)
    assert len(data["daily"]) == 7
    assert "high" in data["daily"][0]
    assert "low" in data["daily"][0]

    # Source metadata
    assert data["source"]["provider"] == "Open-Meteo"

def test_weather_endpoint_caching():
    lat = 18.5204
    lon = 73.8567

    # First request - live fetch
    res1 = client.get(f"/api/weather?latitude={lat}&longitude={lon}")
    assert res1.status_code == 200
    assert res1.json()["data"]["source"]["is_cached"] is False

    # Second request - must return cached payload
    res2 = client.get(f"/api/weather?latitude={lat}&longitude={lon}")
    assert res2.status_code == 200
    assert res2.json()["data"]["source"]["is_cached"] is True

def test_weather_endpoint_invalid_coordinates():
    # Out of range latitude
    res_lat = client.get("/api/weather?latitude=105.0&longitude=73.13")
    assert res_lat.status_code == 422 # FastAPI validation error for ge/le bounds

    # Out of range longitude
    res_lon = client.get("/api/weather?latitude=19.24&longitude=200.0")
    assert res_lon.status_code == 422
