from typing import Dict, Any, List, Optional
from backend.app.core.weather_thresholds import weather_thresholds, WeatherThresholds
from backend.app.schemas.weather_intelligence import RiskAssessment, RiskItem, RiskLevel

class WeatherRiskService:
    """
    Deterministic risk evaluation engine.
    Calculates application-level risk scores and classifications for
    rain, heat, wind, visibility, and severe weather indicators.
    
    IMPORTANT: These are WeatherGPT algorithmic indicators, not government warnings.
    """

    def __init__(self, thresholds: Optional[WeatherThresholds] = None):
        self.t = thresholds or weather_thresholds

    def evaluate_risks(
        self,
        current: Dict[str, Any],
        hourly: List[Dict[str, Any]],
        daily: List[Dict[str, Any]],
    ) -> RiskAssessment:
        items: Dict[str, RiskItem] = {}

        # 1. Rain Risk Assessment
        rain_prob = current.get("rain_probability") or 0.0
        precip_mm = current.get("precipitation") or 0.0

        # Also inspect next 6-hour forecast for approaching precipitation
        max_upcoming_rain_prob = max([h.get("rainProb") or 0 for h in hourly[:6]], default=rain_prob)
        effective_rain_prob = max(rain_prob, max_upcoming_rain_prob)

        if effective_rain_prob >= self.t.RAIN_PROB_HIGH or precip_mm >= self.t.RAIN_HEAVY_MM:
            rain_level: RiskLevel = "high"
            rain_score = 80
            rain_reason = f"High precipitation probability ({int(effective_rain_prob)}%) with expected rain spells."
        elif effective_rain_prob >= self.t.RAIN_PROB_MODERATE or precip_mm >= self.t.RAIN_MODERATE_MM:
            rain_level = "moderate"
            rain_score = 50
            rain_reason = f"Moderate chance of precipitation ({int(effective_rain_prob)}%)."
        else:
            rain_level = "low"
            rain_score = 15
            rain_reason = f"Low probability of precipitation ({int(effective_rain_prob)}%)."

        items["rain"] = RiskItem(
            category="Rain & Precipitation",
            level=rain_level,
            score=rain_score,
            reason=rain_reason,
            icon="cloud-rain"
        )

        # 2. Heat & Thermal Risk Assessment
        temp = current.get("temperature") or 25.0
        feels_like = current.get("feels_like") or temp

        if temp >= self.t.TEMP_EXTREME_HEAT or feels_like >= 42.0:
            heat_level: RiskLevel = "extreme"
            heat_score = 95
            heat_reason = f"Extreme thermal conditions ({temp}°C, feels like {feels_like}°C). Limit outdoor exposure."
        elif temp >= self.t.TEMP_VERY_HOT or feels_like >= 38.0:
            heat_level = "high"
            heat_score = 75
            heat_reason = f"Very high temperatures ({temp}°C, feels like {feels_like}°C). High hydration recommended."
        elif temp >= self.t.TEMP_HOT:
            heat_level = "moderate"
            heat_score = 45
            heat_reason = f"Warm conditions ({temp}°C). Normal seasonal comfort."
        else:
            heat_level = "low"
            heat_score = 10
            heat_reason = f"Comfortable temperature range ({temp}°C)."

        items["heat"] = RiskItem(
            category="Thermal & Heat Stress",
            level=heat_level,
            score=heat_score,
            reason=heat_reason,
            icon="flame"
        )

        # 3. Wind Risk Assessment
        wind_spd = current.get("wind_speed") or 0.0

        if wind_spd >= self.t.WIND_EXTREME:
            wind_level: RiskLevel = "extreme"
            wind_score = 90
            wind_reason = f"Severe wind gusts ({wind_spd} km/h). Potential structural hazard."
        elif wind_spd >= self.t.WIND_HIGH:
            wind_level = "high"
            wind_score = 70
            wind_reason = f"Strong sustained winds ({wind_spd} km/h). Exercise caution during outdoor travel."
        elif wind_spd >= self.t.WIND_MODERATE:
            wind_level = "moderate"
            wind_score = 40
            wind_reason = f"Breezy conditions ({wind_spd} km/h)."
        else:
            wind_level = "low"
            wind_score = 10
            wind_reason = f"Calm wind speeds ({wind_spd} km/h)."

        items["wind"] = RiskItem(
            category="Wind Dynamics",
            level=wind_level,
            score=wind_score,
            reason=wind_reason,
            icon="wind"
        )

        # 4. Visibility Risk Assessment
        vis_km = current.get("visibility")

        if vis_km is not None and vis_km < self.t.VISIBILITY_VERY_LOW:
            vis_level: RiskLevel = "high"
            vis_score = 80
            vis_reason = f"Dense fog or reduced visibility ({vis_km} km). Hazardous commute conditions."
        elif vis_km is not None and vis_km < self.t.VISIBILITY_NORMAL:
            vis_level = "moderate"
            vis_score = 45
            vis_reason = f"Moderate visibility restriction ({vis_km} km)."
        else:
            vis_level = "low"
            vis_score = 5
            vis_reason = f"Clear visibility ({vis_km or 10} km)."

        items["visibility"] = RiskItem(
            category="Atmospheric Visibility",
            level=vis_level,
            score=vis_score,
            reason=vis_reason,
            icon="eye"
        )

        # 5. Thunderstorm / Severe Convective Risk
        code = current.get("weather_code") or 0
        cond_str = (current.get("condition") or "").lower()

        if code in [95, 96, 99] or "thunder" in cond_str or "lightning" in cond_str:
            storm_level: RiskLevel = "high"
            storm_score = 85
            storm_reason = "Thunderstorm and lightning activity indicated by meteorological telemetry."
        else:
            storm_level = "low"
            storm_score = 5
            storm_reason = "No thunderstorm activity detected in the immediate area."

        items["thunderstorm"] = RiskItem(
            category="Thunderstorm & Lightning",
            level=storm_level,
            score=storm_score,
            reason=storm_reason,
            icon="zap"
        )

        # Determine Overall Level
        risk_priority = {"extreme": 4, "high": 3, "moderate": 2, "low": 1}
        max_level_num = max([risk_priority.get(item.level, 1) for item in items.values()])
        level_map = {4: "extreme", 3: "high", 2: "moderate", 1: "low"}
        overall_level: RiskLevel = level_map.get(max_level_num, "low")

        high_risks = [k for k, v in items.items() if v.level in ["high", "extreme"]]
        if high_risks:
            summary = f"Elevated environmental risk detected for: {', '.join(high_risks).title()}."
        elif any(v.level == "moderate" for v in items.values()):
            summary = "Moderate environmental risks present. General vigilance recommended."
        else:
            summary = "All monitored environmental risks are within normal, safe operating limits."

        return RiskAssessment(
            overall_level=overall_level,
            items=items,
            summary=summary,
            disclaimer="WeatherGPT algorithmic risk assessment. Official safety directives are provided exclusively via IMD warnings."
        )

weather_risk_service = WeatherRiskService()
