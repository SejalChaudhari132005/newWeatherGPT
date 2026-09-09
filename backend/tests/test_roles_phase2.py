import sys
import os
import asyncio
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.agri_weather_service import agri_weather_service
from backend.app.agents.farmer_agent import farmer_agent, FarmerAgent
from backend.app.agents.role_router import role_router


def run_unit_tests():
    print("=== 1. Test AgriWeatherService Soil State Calculation ===")
    mock_hourly_dry = {
        "soil_moisture_0_to_7cm": [0.12],
        "soil_moisture_7_to_28cm": [0.15],
        "et0_fao_evapotranspiration": [5.2],
        "soil_temperature_0cm": [31.5],
        "precipitation_probability": [5],
    }
    mock_current_dry = {"temperature_2m": 33.0, "wind_speed_10m": 12.0}
    soil_dry = agri_weather_service.evaluate_soil_state(mock_hourly_dry, mock_current_dry)
    assert soil_dry.moisture_status == "deficit", f"Expected deficit, got {soil_dry.moisture_status}"
    assert soil_dry.irrigation_urgency == "critical", f"Expected critical, got {soil_dry.irrigation_urgency}"
    assert soil_dry.et0_evapotranspiration_mm == 5.2
    print(" [PASS] Deficit soil moisture & critical irrigation urgency verified.")

    print("\n=== 2. Test AgriWeatherService Spraying Risk (Wash-off & Drift) ===")
    # Scenario A: High rain expected -> High wash-off risk
    mock_hourly_rainy = {
        "precipitation": [2.5, 4.0, 1.2, 0.0],
        "precipitation_probability": [85, 90, 70, 20],
        "wind_speed_10m": [8.0, 9.0],
        "temperature_2m": [26.0],
    }
    mock_current_rainy = {"temperature_2m": 26.0, "wind_speed_10m": 8.0}
    spray_rainy = agri_weather_service.evaluate_spraying_risk("soybean", "flowering", mock_hourly_rainy, mock_current_rainy)
    assert spray_rainy.wash_off_risk == "HIGH", f"Expected HIGH wash-off, got {spray_rainy.wash_off_risk}"
    assert spray_rainy.overall_risk == "HIGH"
    assert spray_rainy.badge_color == "red"
    print(" [PASS] High rain wash-off risk flagged correctly.")

    # Scenario B: High wind -> High drift risk
    mock_hourly_windy = {
        "precipitation": [0.0, 0.0],
        "precipitation_probability": [10, 5],
        "wind_speed_10m": [22.0, 20.0],
        "temperature_2m": [28.0],
    }
    mock_current_windy = {"temperature_2m": 28.0, "wind_speed_10m": 22.0}
    spray_windy = agri_weather_service.evaluate_spraying_risk("cotton", "boll_formation", mock_hourly_windy, mock_current_windy)
    assert spray_windy.drift_risk == "HIGH", f"Expected HIGH drift, got {spray_windy.drift_risk}"
    assert spray_windy.overall_risk == "HIGH"
    print(" [PASS] High wind drift risk flagged correctly.")

    # Scenario C: Optimal calm morning -> LOW risk
    mock_hourly_calm = {
        "precipitation": [0.0, 0.0, 0.0],
        "precipitation_probability": [5, 5, 0],
        "wind_speed_10m": [7.0, 8.0, 9.0],
        "temperature_2m": [24.0, 25.0, 27.0],
        "time": ["2026-09-10T06:00", "2026-09-10T07:00", "2026-09-10T08:00"],
    }
    mock_current_calm = {"temperature_2m": 24.0, "wind_speed_10m": 7.0}
    spray_calm = agri_weather_service.evaluate_spraying_risk("wheat", "vegetative", mock_hourly_calm, mock_current_calm)
    assert spray_calm.overall_risk == "LOW"
    assert spray_calm.badge_color == "green"
    print(" [PASS] Optimal spray conditions recognized cleanly.")

    print("\n=== 3. Test Crop Pest & Disease Propensity Models ===")
    pests_soybean = agri_weather_service.calculate_disease_propensity("soybean", "flowering", 28.0, 78.0, 40.0)
    assert len(pests_soybean) >= 2
    assert any("Semilooper" in p.disease_or_pest_name for p in pests_soybean)
    assert any(p.risk_level == "high" for p in pests_soybean)
    print(f" [PASS] Soybean pests evaluated: {[p.disease_or_pest_name for p in pests_soybean]}")

    pests_wheat = agri_weather_service.calculate_disease_propensity("wheat", "grain_filling", 18.0, 82.0, 10.0)
    assert any("Rust" in p.disease_or_pest_name for p in pests_wheat)
    print(f" [PASS] Wheat rust evaluated: {[p.disease_or_pest_name for p in pests_wheat]}")

    print("\n=== 4. Test FarmerAgent Registration in RoleRouter ===")
    agent = role_router.get_agent("farmer")
    assert isinstance(agent, FarmerAgent), f"Expected FarmerAgent instance, got {type(agent)}"
    assert agent.role_name == "farmer"
    print(f" [PASS] RoleRouter correctly resolves 'farmer' -> {agent.__class__.__name__}")


def run_api_tests():
    print("\n=== 5. Test REST API /api/roles/farmer/decisions across crops ===")
    client = TestClient(app)

    crops_to_test = [
        ("soybean", "flowering"),
        ("cotton", "boll_formation"),
        ("wheat", "vegetative"),
        ("rice", "tillering"),
    ]

    for crop_name, stage_name in crops_to_test:
        resp = client.get(f"/api/roles/farmer/decisions?latitude=19.876&longitude=75.343&crop={crop_name}&stage={stage_name}")
        assert resp.status_code == 200, f"API failed for {crop_name}: {resp.text}"
        data = resp.json()["data"]
        assert data["crop"].lower() == crop_name
        assert "soil_state" in data
        assert "best_farming_windows" in data
        assert "spraying_suitability" in data
        assert "pest_disease_risks" in data
        print(f" [PASS] API response for {crop_name.title()} ({stage_name}): Spray Risk={data['spraying_suitability']['overall_risk']}, Windows={len(data['best_farming_windows'])}")

    print("\n[SUCCESS] ALL PHASE 2 TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    run_unit_tests()
    run_api_tests()
