from typing import Dict, Any, Optional
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData

class WeatherContextService:
    """
    Transforms verified Weather Intelligence into a clean, compact, source-annotated text block
    for LLM system and user prompt injection. Ensures complete grounding and provenance separation.
    """

    def build_llm_context(
        self,
        intelligence: WeatherIntelligenceData,
        user_role: str = "citizen",
        time_range: str = "current"
    ) -> str:
        loc = intelligence.location
        curr = intelligence.current
        fc = intelligence.forecast
        alerts = intelligence.alerts
        risks = intelligence.risks
        conf = intelligence.confidence
        fresh = intelligence.data_freshness

        # 1. Location Block
        loc_lines = [
            f"- Coordinates: {loc.latitude:.4f}, {loc.longitude:.4f}",
            f"- City / Area: {loc.city or 'Local Area'}",
            f"- District: {loc.district or 'N/A'}, State: {loc.state or 'India'}",
        ]
        if loc.imd_station:
            loc_lines.append(f"- Nearest IMD Station: {loc.imd_station}")
        if loc.imd_subdivision:
            loc_lines.append(f"- IMD Meteorological Subdivision: {loc.imd_subdivision}")

        # 2. Current Observation Block
        curr_lines = [
            f"- Temperature: {curr.temperature.value}°C (Feels like {curr.feels_like.value}°C) [Source: {curr.temperature.source}]",
            f"- Condition: {curr.condition}",
            f"- Rain Probability: {curr.rain_probability.value}% | Precipitation: {curr.precipitation.value} mm",
            f"- Humidity: {curr.humidity.value}% | Pressure: {curr.pressure.value} hPa",
            f"- Wind Speed: {curr.wind_speed.value} km/h (Direction: {curr.wind_direction.value})",
            f"- Visibility: {curr.visibility.value} km | UV Index: {curr.uv_index.value}",
        ]

        # 3. Forecast Highlights (Tomorrow / Next 24h)
        fc_lines = []
        if fc.daily:
            for day_item in fc.daily[:3]:
                rain_prob = getattr(day_item, "rain_probability", getattr(day_item, "rainProbability", 0))
                fc_lines.append(
                    f"- {day_item.day} ({day_item.date}): {day_item.condition}, High: {day_item.high}°C, Low: {day_item.low}°C, Rain Probability: {rain_prob}%"
                )

        if fc.hourly:
            # Hourly snapshot
            hourly_snips = []
            for h in fc.hourly[:6]:
                r_prob = getattr(h, "rain_probability", getattr(h, "rainProb", 0))
                hourly_snips.append(f"{h.time}: {h.temp}°C ({r_prob}% rain)")
            fc_lines.append(f"- Next Hours: {', '.join(hourly_snips)}")

        # 4. Official IMD Warnings
        alert_lines = []
        if alerts and len(alerts) > 0:
            for al in alerts:
                alert_lines.append(
                    f"- OFFICIAL IMD {al.severity.upper()} WARNING ({al.severity_label}): {al.title} - {al.description} (Valid until: {al.valid_until})"
                )
        else:
            alert_lines.append("- No active official IMD warning was detected for this location.")

        # 5. WeatherGPT Deterministic Risk Matrix
        risk_lines = [f"- Overall Evaluated Risk: {risks.overall_level.upper()} ({risks.summary})"]
        for k, v in risks.items.items():
            if v.level in ["moderate", "high", "extreme"]:
                risk_lines.append(f"  * {v.category.title()}: {v.level.upper()} - {v.reason}")

        # 6. Insights
        insight_lines = []
        for ins in intelligence.insights[:3]:
            prefix = "[Advisory] " if ins.is_advisory else ""
            insight_lines.append(f"- {prefix}{ins.headline}: {ins.detail}")

        # 7. Confidence & Freshness
        conf_lines = [
            f"- WeatherGPT Confidence Score: {conf.score}/100 ({conf.level.upper()})",
            f"- Factors: {'; '.join(conf.factors)}",
            f"- Data Age: {fresh.age_minutes} minutes ago (Status: {fresh.status.upper()})",
        ]
        if conf.conflict_warnings:
            conf_lines.append(f"- Telemetry Variance: {'; '.join(conf.conflict_warnings)}")

        context_text = f"""=== VERIFIED WEATHER INTELLIGENCE CONTEXT ===
TARGET LOCATION:
{chr(10).join(loc_lines)}

CURRENT METEOROLOGICAL TELEMETRY:
{chr(10).join(curr_lines)}

FORECAST TIMELINE (Model: Open-Meteo):
{chr(10).join(fc_lines)}

ACTIVE OFFICIAL IMD WARNINGS:
{chr(10).join(alert_lines)}

WEATHERGPT ALGORITHMIC RISKS:
{chr(10).join(risk_lines)}

SYNTHESIZED INSIGHTS:
{chr(10).join(insight_lines) if insight_lines else "- Normal conditions."}

DATA CONFIDENCE & PROVENANCE:
{chr(10).join(conf_lines)}
============================================="""
        return context_text

    def build_structured_context(self, intelligence: WeatherIntelligenceData) -> Dict[str, Any]:
        """
        Returns a clean structured dictionary for metadata and rich frontend cards.
        """
        loc = intelligence.location
        curr = intelligence.current
        fc = intelligence.forecast

        return {
            "location": {
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "city": loc.city or "Detected Area",
                "district": loc.district or "",
                "state": loc.state or "India",
                "source": "GPS + Geocoding",
            },
            "current_weather": {
                "temperature": curr.temperature.value,
                "feels_like": curr.feels_like.value,
                "humidity": curr.humidity.value,
                "wind_speed": curr.wind_speed.value,
                "wind_direction": curr.wind_direction.value,
                "visibility": curr.visibility.value,
                "pressure": curr.pressure.value,
                "uv_index": curr.uv_index.value,
                "rain_probability": curr.rain_probability.value,
                "condition": curr.condition,
                "icon": curr.icon,
            },
            "forecast": {
                "daily": [
                    {
                        "day": d.day,
                        "date": d.date,
                        "high": d.high,
                        "low": d.low,
                        "condition": d.condition,
                        "icon": d.icon,
                        "rain_probability": getattr(d, "rainProbability", getattr(d, "rain_probability", 0)),
                    }
                    for d in (fc.daily or [])[:5]
                ],
                "hourly": [
                    {
                        "time": h.time,
                        "temp": h.temp,
                        "condition": h.condition,
                        "rain_probability": getattr(h, "rainProb", getattr(h, "rain_probability", 0)),
                    }
                    for h in (fc.hourly or [])[:8]
                ],
            },
            "alerts": [
                {
                    "id": a.id,
                    "title": a.title,
                    "description": a.description,
                    "severity": a.severity,
                    "severity_label": a.severity_label,
                    "source": a.source,
                    "valid_until": a.valid_until,
                }
                for a in (intelligence.alerts or [])
            ],
            "confidence": {
                "score": intelligence.confidence.score,
                "label": intelligence.confidence.level,
            },
            "sources": [
                {"name": "Open-Meteo", "type": "weather_data"},
                {"name": "India Meteorological Department (IMD)", "type": "official_warning"},
            ],
            "retrieved_at": intelligence.data_freshness.retrieved_at,
        }

weather_context_service = WeatherContextService()
