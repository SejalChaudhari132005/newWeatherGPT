"""
Command-Line Diagnostic Runner for IMD API Connectivity.
Usage:
    python backend/test_imd.py
    python -m backend.app.services.imd.test_cli
"""

import sys
import os
import asyncio
from typing import Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.app.services.imd.imd_diagnostics import imd_diagnostic_service
from backend.app.services.imd.imd_client import imd_client


async def run_cli_diagnostic():
    print("=" * 70)
    print("      WEATHERGPT - IMD API ACCESS & CAPABILITY DIAGNOSTIC")
    print("=" * 70)

    key_info = imd_client.get_masked_key_info()
    print(f"Provider:           India Meteorological Department (IMD)")
    print(f"Official Gateway:   {imd_client.base_url}")
    print(f"Credential Status:  {'Configured [Masked: ' + key_info['masked'] + ']' if key_info['configured'] else 'NOT CONFIGURED'}")
    print("-" * 70)
    print("Running diagnostic probe across 10 official IMD capabilities...")
    print("-" * 70)

    report = await imd_diagnostic_service.run_diagnostics(
        latitude=19.2597,
        longitude=73.1339,
        city_hint="Kalyan-Dombivli",
        district_hint="Thane",
        state_hint="Maharashtra",
    )

    services = report.get("services", {})
    cap_names = {
        "current_weather": "Current Weather",
        "lat_lon_weather": "Lat/Lon Weather",
        "forecast": "Forecast (7-Day)",
        "nowcast": "Nowcast (0-3h)",
        "warnings": "Weather Warnings",
        "rainfall": "Rainfall & QPF",
        "cyclone": "Cyclone Tracking",
        "fishermen_warning": "Fishermen / Marine",
        "radar": "Doppler Radar",
        "lightning": "Lightning / DAMINI",
    }

    print(f"{'CAPABILITY':<24} | {'STATUS':<15} | {'HTTP':<6} | {'LATENCY':<8} | {'MESSAGE'}")
    print("-" * 70)

    for key, name in cap_names.items():
        res = services.get(key, {})
        status = res.get("status", "unknown").upper()
        http_code = str(res.get("http_status", 0))
        lat = f"{res.get('response_time_ms', 0)}ms"
        msg = res.get("message", "")[:35]
        icon = "[PASS]" if status == "AVAILABLE" else "[FAIL]"
        print(f"{icon} {name:<18} | {status:<15} | {http_code:<6} | {lat:<8} | {msg}")

    print("=" * 70)
    summary = report.get("summary", {})
    print(f"Overall Status:        {report.get('overall_status', 'unknown').upper()}")
    print(f"Available Capabilities: {summary.get('available_services', 0)} / {summary.get('total_services', 0)}")
    print("=" * 70)

    radar_assessment = report.get("radar_specific_assessment", {})
    print("\nRADAR SPECIFIC VERIFICATION:")
    for k, v in radar_assessment.items():
        print(f"  • {k}: {v}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_cli_diagnostic())
