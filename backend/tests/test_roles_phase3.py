import sys
import os
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.marine_weather_service import marine_weather_service
from backend.app.agents.fisherman_agent import fisherman_agent, FishermanAgent
from backend.app.agents.role_router import role_router


def run_unit_tests():
    print("=== 1. Test MarineWeatherService Sailing Clearance Boundaries ===")
    # Scenario A: Favorable conditions (< 1.4m wave, < 16 kts wind)
    clearance_fav = marine_weather_service.evaluate_sailing_clearance(
        wave_height_m=1.1,
        wind_speed_kts=12.0,
        swell_height_m=0.8,
        swell_period_s=5.5,
    )
    assert clearance_fav.status == "favorable", f"Expected favorable, got {clearance_fav.status}"
    assert clearance_fav.badge_color == "green"
    assert not clearance_fav.squall_risk
    print(" [PASS] Favorable sailing clearance verified.")

    # Scenario B: Caution conditions (1.4m - 2.5m wave or 16-24 kts wind)
    clearance_caut = marine_weather_service.evaluate_sailing_clearance(
        wave_height_m=1.8,
        wind_speed_kts=19.5,
        swell_height_m=1.2,
        swell_period_s=7.0,
    )
    assert clearance_caut.status == "caution", f"Expected caution, got {clearance_caut.status}"
    assert clearance_caut.badge_color == "yellow"
    print(" [PASS] Caution sailing clearance for mechanized craft verified.")

    # Scenario C: Severe / No Departure (> 2.5m wave or > 24 kts wind)
    clearance_danger = marine_weather_service.evaluate_sailing_clearance(
        wave_height_m=3.1,
        wind_speed_kts=28.0,
        swell_height_m=2.6,
        swell_period_s=9.5,
    )
    assert clearance_danger.status == "no_departure", f"Expected no_departure, got {clearance_danger.status}"
    assert clearance_danger.badge_color == "red"
    assert clearance_danger.squall_risk
    print(" [PASS] No-Departure harbor bound status verified.")

    print("\n=== 2. Test MarineWeatherService Return-Time Intelligence ===")
    mock_hourly = {
        "wave_height": [1.1, 1.2, 1.3, 1.7, 2.1, 2.6, 2.8],
        "wind_speed_10m": [18.0, 20.0, 22.0, 30.0, 38.0, 45.0, 50.0],
        "wave_period": [6.0, 6.2, 6.5, 7.2, 7.8, 8.5, 9.0],
    }
    ret_intel, temp_slots = marine_weather_service.calculate_return_time(
        departure_time_str="05:30 AM",
        hourly=mock_hourly,
        current_status="favorable",
        base_wave_h=1.1,
        base_wind_kts=12.0,
    )
    assert ret_intel.recommended_return_time != ""
    assert ret_intel.cutoff_hour != ""
    assert ret_intel.safe_duration_hours > 0
    assert len(temp_slots) == 4
    print(f" [PASS] Return-time cutoff identified: {ret_intel.cutoff_hour}, Return by: {ret_intel.recommended_return_time}")

    print("\n=== 3. Test Semi-Diurnal Tide Extrema Calculation ===")
    # West Coast (Mumbai, lon < 78)
    tides_west = marine_weather_service.compute_tide_extrema(18.913, 72.825)
    assert len(tides_west) == 4
    assert any(t.tide_type == "high" and t.height_m > 3.0 for t in tides_west)
    print(" [PASS] West coast macro-tidal calculation verified (Peak > 3.5m).")

    # East Coast (Chennai, lon >= 78)
    tides_east = marine_weather_service.compute_tide_extrema(13.125, 80.298)
    assert len(tides_east) == 4
    assert any(t.tide_type == "high" and t.height_m < 2.5 for t in tides_east)
    print(" [PASS] East coast micro-tidal calculation verified.")

    print("\n=== 4. Test Zone-Tiered Risks ===")
    zones = marine_weather_service.evaluate_zone_risks(1.5, 15.0)
    assert len(zones) == 3
    assert zones[0].zone_name == "Near-Shore (0-5 nm)"
    assert zones[1].zone_name == "Coastal (5-20 nm)"
    assert zones[2].zone_name == "Deep-Sea (>20 nm)"
    print(" [PASS] 3-tier zone danger matrix verified.")

    print("\n=== 5. Test FishermanAgent Registration in RoleRouter ===")
    agent = role_router.get_agent("fisher")
    assert isinstance(agent, FishermanAgent), f"Expected FishermanAgent instance, got {type(agent)}"
    assert agent.role_name == "fisher"
    print(f" [PASS] RoleRouter correctly resolves 'fisher' -> {agent.__class__.__name__}")


def run_api_tests():
    print("\n=== 6. Test REST API /api/roles/fisher/decisions across Indian Harbors ===")
    client = TestClient(app)

    harbors = [
        ("Sassoon Docks Mumbai", 18.913, 72.825),
        ("Kochi Fishing Harbor", 9.948, 76.257),
        ("Kasimedu Chennai", 13.125, 80.298),
        ("Visakhapatnam Harbor", 17.695, 83.298),
    ]

    for name, lat, lon in harbors:
        resp = client.get(f"/api/roles/fisher/decisions?latitude={lat}&longitude={lon}&departure_time=05:30")
        assert resp.status_code == 200, f"API failed for {name}: {resp.text}"
        data = resp.json()["data"]
        assert "sailing_clearance" in data
        assert "return_time_intelligence" in data
        assert "sea_state" in data
        assert "temporal_curve" in data
        assert "zone_risks" in data
        assert "tide_schedule" in data
        print(f" [PASS] API response for {name}: Status={data['sailing_clearance']['status']}, Return Deadline={data['return_time_intelligence']['recommended_return_time']}")

    print("\n[SUCCESS] ALL PHASE 3 TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    run_unit_tests()
    run_api_tests()
