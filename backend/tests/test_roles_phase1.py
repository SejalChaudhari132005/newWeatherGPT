import sys
import os
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    client = TestClient(app)

    print("=== 1. Test /api/roles/airports ===")
    r = client.get("/api/roles/airports")
    assert r.status_code == 200, f"Airports endpoint failed: {r.text}"
    airports_data = r.json()
    print(f"Airports found: {len(airports_data['airports'])}")
    for a in airports_data['airports'][:5]:
        print(f" - {a['icao']} ({a['iata']}): {a['name']} - Runways: {[rw['id'] for rw in a['runways']]}")

    print("\n=== 2. Test /api/roles/farmer/decisions ===")
    r = client.get("/api/roles/farmer/decisions?latitude=19.076&longitude=72.8777&crop=soybean&stage=flowering")
    assert r.status_code == 200, f"Farmer endpoint failed: {r.text}"
    farmer = r.json()["data"]
    print(f"Crop: {farmer['crop']} ({farmer['phenological_stage']})")
    print(f"Soil State: Surface Moisture: {farmer['soil_state']['moisture_surface_0_to_7cm']} m³/m³, ET0: {farmer['soil_state']['et0_evapotranspiration_mm']} mm")
    print(f"Spraying Suitability: {farmer['spraying_suitability']['overall_risk']} (Badge: {farmer['spraying_suitability']['badge_color']})")
    print(f"Best Farming Windows: {len(farmer['best_farming_windows'])} slots identified")
    for w in farmer['best_farming_windows']:
        print(f" - {w['activity'].title()} [{w['start_time']} -> {w['end_time']}]: {w['suitability']} (Score: {w['score']}) - {w['rationale']}")

    print("\n=== 3. Test /api/roles/fisher/decisions ===")
    r = client.get("/api/roles/fisher/decisions?latitude=18.92&longitude=72.83&departure_time=05:30")
    assert r.status_code == 200, f"Fisher endpoint failed: {r.text}"
    fisher = r.json()["data"]
    print(f"Sailing Clearance: {fisher['sailing_clearance']['status'].upper()} (Badge: {fisher['sailing_clearance']['badge_color']})")
    print(f"Reason: {fisher['sailing_clearance']['primary_reason']}")
    print(f"Recommended Return Time: {fisher['return_time_intelligence']['recommended_return_time']} (Cutoff: {fisher['return_time_intelligence']['cutoff_hour']})")
    print(f"Sea State: Wave Height {fisher['sea_state']['wave_height_m']}m, Swell {fisher['sea_state']['swell_height_m']}m, Beaufort: {fisher['sea_state']['beaufort_description']}")
    print(f"Zone Risks: {len(fisher['zone_risks'])} zones evaluated")

    print("\n=== 4. Test /api/roles/aviation/briefing ===")
    r = client.get("/api/roles/aviation/briefing?icao=VABB")
    assert r.status_code == 200, f"Aviation briefing failed: {r.text}"
    av = r.json()["data"]
    print(f"Airport: {av['airport_name']} ({av['icao']}/{av['iata']})")
    print(f"Flight Rules: {av['flight_rules']['category']} - {av['flight_rules']['rationale']}")
    active = av['active_runway']
    print(f"Active Runway {active['runway_id']} (Heading {active['runway_heading_deg']}°): Wind {active['wind_direction_deg']}°@{active['wind_speed_kts']}kts | Headwind: {active['headwind_kts']}kts, Crosswind: {active['crosswind_kts']}kts ({active['crosswind_direction']})")
    print(f"Decoded METAR: {av['decoded_metar_taf']['raw_metar']}")

    print("\n=== 5. Test /api/roles/aviation/compare (VABB vs VAPO) ===")
    r = client.get("/api/roles/aviation/compare?icao1=VABB&icao2=VAPO")
    assert r.status_code == 200, f"Aviation compare failed: {r.text}"
    comp = r.json()["data"]
    print(f"Favorable Airport: {comp['favorable_airport']}")
    print(f"Summary: {comp['comparative_summary']}")

    print("\n[SUCCESS] ALL PHASE 1 TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_tests()
