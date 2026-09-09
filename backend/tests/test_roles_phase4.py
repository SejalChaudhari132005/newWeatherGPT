import sys
import os
import math
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.aviation_weather_service import aviation_weather_service, AviationWeatherService, INDIAN_AIRPORTS_CATALOG
from backend.app.agents.aviation_agent import aviation_agent, AviationAgent
from backend.app.agents.role_router import role_router


def run_unit_tests():
    print("=== 1. Test Runway Crosswind & Headwind Trigonometric Resolution across 360° ===")
    
    # Test Case A: Pure Headwind (Runway 27 = 270°, Wind = 270° @ 20 kts)
    comp_a = aviation_weather_service.resolve_runway_winds(
        runway_heading_deg=270,
        wind_speed_kts=20.0,
        wind_dir_deg=270,
        runway_id="27",
    )
    assert comp_a.headwind_kts == 20.0, f"Expected 20.0 headwind, got {comp_a.headwind_kts}"
    assert comp_a.crosswind_kts == 0.0, f"Expected 0.0 crosswind, got {comp_a.crosswind_kts}"
    assert comp_a.crosswind_direction == "head"
    assert comp_a.operational_status == "normal"
    print(" [PASS] Pure headwind vector verified.")

    # Test Case B: Direct Right Crosswind (Runway 27 = 270°, Wind = 360° @ 18 kts)
    comp_b = aviation_weather_service.resolve_runway_winds(
        runway_heading_deg=270,
        wind_speed_kts=18.0,
        wind_dir_deg=360,
        runway_id="27",
    )
    assert comp_b.headwind_kts == 0.0
    assert comp_b.crosswind_kts == 18.0
    assert comp_b.crosswind_direction == "right"
    assert comp_b.operational_status == "caution"  # 18 kts > 15 kts caution threshold
    assert not comp_b.is_crosswind_exceeded
    print(" [PASS] Direct right crosswind caution vector verified.")

    # Test Case C: Exceeded Left Crosswind (Runway 09 = 090°, Wind = 360° @ 28 kts)
    comp_c = aviation_weather_service.resolve_runway_winds(
        runway_heading_deg=90,
        wind_speed_kts=28.0,
        wind_dir_deg=360,
        runway_id="09",
    )
    assert comp_c.crosswind_kts == 28.0
    assert comp_c.crosswind_direction == "left"
    assert comp_c.is_crosswind_exceeded
    assert comp_c.operational_status == "exceeded"  # 28 kts > 25 kts limit
    print(" [PASS] Exceeded crosswind limitation (>25 kts) verified.")

    # Test Case D: Pure Tailwind (Runway 27 = 270°, Wind = 090° @ 12 kts)
    comp_d = aviation_weather_service.resolve_runway_winds(
        runway_heading_deg=270,
        wind_speed_kts=12.0,
        wind_dir_deg=90,
        runway_id="27",
    )
    assert comp_d.headwind_kts == -12.0, f"Expected -12.0 tailwind, got {comp_d.headwind_kts}"
    assert comp_d.crosswind_kts == 0.0
    assert comp_d.crosswind_direction == "tail"
    print(" [PASS] Pure tailwind vector verified.")

    # Test Case E: 45° Diagonal Wind (Runway 27 = 270°, Wind = 315° @ 20 kts)
    # Headwind = 20 * cos(45°) ≈ 14.1 kts, Crosswind = 20 * sin(45°) ≈ 14.1 kts
    comp_e = aviation_weather_service.resolve_runway_winds(
        runway_heading_deg=270,
        wind_speed_kts=20.0,
        wind_dir_deg=315,
        runway_id="27",
    )
    assert math.isclose(comp_e.headwind_kts, 14.1, abs_tol=0.2)
    assert math.isclose(comp_e.crosswind_kts, 14.1, abs_tol=0.2)
    assert comp_e.crosswind_direction == "right"
    print(" [PASS] 45-degree diagonal wind vector verified.")

    print("\n=== 2. Test Flight Rules Evaluation (VFR, MVFR, IFR, LVP) ===")
    # VFR
    fr_vfr = aviation_weather_service.evaluate_flight_rules(temp_c=28.0, dew_c=20.0, visibility_m=7000)
    assert fr_vfr.category == "VFR"

    # MVFR
    fr_mvfr = aviation_weather_service.evaluate_flight_rules(temp_c=24.0, dew_c=22.0, visibility_m=4000)
    assert fr_mvfr.category == "MVFR"

    # IFR
    fr_ifr = aviation_weather_service.evaluate_flight_rules(temp_c=21.0, dew_c=20.5, visibility_m=1800)
    assert fr_ifr.category == "IFR"

    # LVP
    fr_lvp = aviation_weather_service.evaluate_flight_rules(temp_c=18.0, dew_c=18.0, visibility_m=600)
    assert fr_lvp.category == "LVP"
    print(" [PASS] Flight rules boundary classification verified (VFR/MVFR/IFR/LVP).")

    print("\n=== 3. Test METAR/TAF Decoding & Tokenizer ===")
    meta = INDIAN_AIRPORTS_CATALOG["VABB"]
    decoded = aviation_weather_service.decode_metar_taf(
        icao="VABB",
        airport_meta=meta,
        wind_dir_deg=260,
        wind_spd_kts=14.0,
        wind_gusts_kts=20.0,
        visibility_m=6000,
        temp_c=29.0,
        dew_c=23.0,
        surface_pressure=1012.0,
        est_ceiling_ft=3400,
        active_rwy=comp_a,
        flight_cat="VFR",
    )
    assert "METAR VABB" in decoded.raw_metar
    assert len(decoded.tokens) >= 7
    assert any(t.category == "wind" for t in decoded.tokens)
    assert any(t.category == "altimeter" for t in decoded.tokens)
    print(f" [PASS] Tokenized METAR created: {decoded.raw_metar}")

    print("\n=== 4. Test AviationAgent Registration in RoleRouter ===")
    agent = role_router.get_agent("aviation")
    assert isinstance(agent, AviationAgent), f"Expected AviationAgent instance, got {type(agent)}"
    assert agent.role_name == "aviation"

    pilot_agent = role_router.get_agent("pilot")
    assert isinstance(pilot_agent, AviationAgent)
    print(f" [PASS] RoleRouter correctly resolves 'aviation' & 'pilot' -> {agent.__class__.__name__}")


def run_api_tests():
    print("\n=== 5. Test REST API /api/roles/airports ===")
    client = TestClient(app)

    resp_cat = client.get("/api/roles/airports")
    assert resp_cat.status_code == 200
    airports = resp_cat.json()["airports"]
    assert len(airports) >= 8
    icaos = [a["icao"] for a in airports]
    assert "VABB" in icaos
    assert "VIDP" in icaos
    assert "VOBL" in icaos
    assert "VAPO" in icaos
    print(f" [PASS] Airport catalog API returned {len(airports)} Indian international airports.")

    print("\n=== 6. Test REST API /api/roles/aviation/briefing ===")
    resp_brief = client.get("/api/roles/aviation/briefing?icao=VABB&active_runway_override=27")
    assert resp_brief.status_code == 200
    data = resp_brief.json()["data"]
    assert data["icao"] == "VABB"
    assert "flight_rules" in data
    assert "active_runway" in data
    assert data["active_runway"]["runway_id"] == "27"
    assert "decoded_metar_taf" in data
    print(f" [PASS] Aviation briefing API for VABB Runway 27: Status={data['flight_rules']['category']}, Wind={data['active_runway']['wind_speed_kts']}kts")

    print("\n=== 7. Test REST API /api/roles/aviation/compare ===")
    resp_comp = client.get("/api/roles/aviation/compare?icao1=VABB&icao2=VAPO")
    assert resp_comp.status_code == 200
    comp_data = resp_comp.json()["data"]
    assert comp_data["origin"]["icao"] == "VABB"
    assert comp_data["destination"]["icao"] == "VAPO"
    assert "enroute_risk_level" in comp_data
    assert "comparative_summary" in comp_data
    print(f" [PASS] Dual airport comparison API (VABB -> VAPO): Risk={comp_data['enroute_risk_level']}, Favorable={comp_data['favorable_airport']}")

    print("\n[SUCCESS] ALL PHASE 4 AVIATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    run_unit_tests()
    run_api_tests()
