"""
Official IMD Data Normalizer.
Converts heterogeneous raw IMD API responses into standard WeatherGPT internal schemas.
Only populates fields actually provided by the source; never fabricates missing values.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger("imd_normalizer")


def _safe_float(val: Any) -> Optional[float]:
    if val is None or val == "" or val == "-" or str(val).lower() in ("na", "null", "none"):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def normalize_current_weather(raw: Any, station_meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Normalize raw IMD observation into unified internal schema.
    """
    meta = station_meta or {}
    item = raw[0] if isinstance(raw, list) and len(raw) > 0 else (raw if isinstance(raw, dict) else {})
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "source": "India Meteorological Department (IMD)",
        "source_type": "official_station_observation",
        "timestamp": item.get("Date") or item.get("observed_at") or now_iso,
        "station": {
            "name": item.get("Station_Name") or meta.get("station_name"),
            "code": item.get("Station_Code") or meta.get("station_code"),
            "district": meta.get("district"),
            "state": meta.get("state"),
            "latitude": meta.get("latitude"),
            "longitude": meta.get("longitude"),
        },
        "temperature": _safe_float(item.get("Today_Max_temp") or item.get("temp") or item.get("temperature")),
        "temperature_min": _safe_float(item.get("Today_Min_temp")),
        "humidity": _safe_float(
            item.get("Relative_Humidity_at_1730")
            or item.get("Relative_Humidity_at_0830")
            or item.get("humidity")
        ),
        "rainfall_24h": _safe_float(item.get("Past_24_hrs_Rainfall") or item.get("rainfall")),
        "wind_speed": _safe_float(item.get("wind_speed")),
        "wind_direction": _safe_float(item.get("wind_direction")),
        "visibility_km": _safe_float(item.get("visibility")),
        "pressure_hpa": _safe_float(item.get("pressure")),
        "forecast_summary": str(item.get("Todays_Forecast") or item.get("weather_desc") or "").strip() or None,
        "astronomical": {
            "sunrise": item.get("Sunrise_time"),
            "sunset": item.get("Sunset_time"),
            "moonrise": item.get("Moonrise_time"),
            "moonset": item.get("Moonset_time"),
        },
        "attribution": "Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
    }


def normalize_forecast(raw: Any, station_meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Normalize 7-day city weather forecast bulletin.
    """
    meta = station_meta or {}
    days = []

    if isinstance(raw, list):
        for entry in raw:
            days.append(entry)
    elif isinstance(raw, dict):
        # Format for multi-day fields
        for day_idx in range(1, 8):
            prefix = f"Day_{day_idx}" if day_idx > 1 else "Todays"
            max_t = _safe_float(raw.get(f"{prefix}_Forecast_Max_Temp") or raw.get(f"Day_{day_idx}_Max_Temp"))
            min_t = _safe_float(raw.get(f"{prefix}_Forecast_Min_temp") or raw.get(f"Day_{day_idx}_Min_temp"))
            desc = raw.get(f"{prefix}_Forecast") or raw.get(f"Day_{day_idx}_Forecast")
            if max_t is not None or desc is not None:
                days.append({
                    "day_number": day_idx,
                    "max_temp_c": max_t,
                    "min_temp_c": min_t,
                    "summary": str(desc).strip() if desc else None,
                })

    return {
        "source": "India Meteorological Department (IMD 7-Day City Forecast)",
        "station_name": meta.get("station_name"),
        "station_code": meta.get("station_code"),
        "days": days,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "attribution": "Official IMD City Bulletin",
    }


def normalize_nowcast(raw: Any, district_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Normalize 0-3 hour district nowcast.
    """
    items = raw if isinstance(raw, list) else ([raw] if isinstance(raw, dict) else [])
    active_nowcasts = []

    for it in items:
        if isinstance(it, dict):
            active_nowcasts.append({
                "district": it.get("district_name") or district_name,
                "warning": it.get("nowcast_warning") or it.get("warning_text") or it.get("description"),
                "severity_colour": it.get("colour_code") or it.get("severity") or "green",
                "valid_until": it.get("valid_to") or it.get("valid_until"),
            })

    return {
        "source": "India Meteorological Department (IMD Nowcast)",
        "district": district_name,
        "nowcasts": active_nowcasts,
        "is_active": len(active_nowcasts) > 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def normalize_warnings(raw: Any, filter_district: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Normalize district severe weather warnings.
    """
    items = raw if isinstance(raw, list) else ([raw] if isinstance(raw, dict) else [])
    results = []

    for it in items:
        if not isinstance(it, dict):
            continue
        dist = str(it.get("district_name") or it.get("District") or "")
        if filter_district and dist and (filter_district.lower() not in dist.lower() and dist.lower() not in filter_district.lower()):
            continue

        raw_col = str(it.get("colour_code") or it.get("color") or it.get("severity") or "green").lower()
        if "red" in raw_col:
            sev = "red"
            sev_lbl = "High Risk / Take Action"
        elif "orange" in raw_col or "amber" in raw_col:
            sev = "orange"
            sev_lbl = "Alert / Be Prepared"
        elif "yellow" in raw_col:
            sev = "yellow"
            sev_lbl = "Watch / Be Updated"
        else:
            sev = "green"
            sev_lbl = "No Warning"

        results.append({
            "district": dist,
            "state": it.get("state_name") or it.get("State"),
            "severity": sev,
            "severity_label": sev_lbl,
            "warning_type": it.get("warning_type") or "meteorological_hazard",
            "description": it.get("warning_text") or it.get("warning"),
            "valid_from": it.get("valid_from") or it.get("Date"),
            "valid_until": it.get("valid_to") or it.get("valid_until"),
            "source": "India Meteorological Department",
        })

    return results
