from typing import Dict, Any, List, Optional
from backend.app.core.weather_thresholds import weather_thresholds, WeatherThresholds
from backend.app.schemas.weather_intelligence import WeatherInsight

class WeatherInsightService:
    """
    Deterministic Insight Engine.
    Synthesizes current, hourly, and daily metrics into concise,
    human-readable citizen weather insights without relying on an LLM.
    """

    def __init__(self, thresholds: Optional[WeatherThresholds] = None):
        self.t = thresholds or weather_thresholds

    def generate_insights(
        self,
        current: Dict[str, Any],
        hourly: List[Dict[str, Any]],
        daily: List[Dict[str, Any]],
        city_name: Optional[str] = None,
    ) -> List[WeatherInsight]:
        insights: List[WeatherInsight] = []
        loc_str = city_name or "your area"

        # 1. Rain & Precipitation Insights
        rain_prob = current.get("rain_probability") or 0.0
        upcoming_rain_hours = [
            h for h in hourly[:12] if (h.get("rainProb") or 0) >= self.t.RAIN_PROB_MODERATE
        ]

        if upcoming_rain_hours:
            first_rain_hour = upcoming_rain_hours[0].get("time", "soon")
            highest_prob = max([h.get("rainProb") or 0 for h in upcoming_rain_hours])
            if highest_prob >= self.t.RAIN_PROB_HIGH:
                insights.append(WeatherInsight(
                    id="insight-rain-high",
                    category="rain",
                    headline="Rain Expected Today",
                    detail=f"High probability of rain ({int(highest_prob)}%) expected around {first_rain_hour}. Carrying an umbrella is recommended.",
                    icon="cloud-rain",
                    is_advisory=True
                ))
            else:
                insights.append(WeatherInsight(
                    id="insight-rain-moderate",
                    category="rain",
                    headline="Scattered Showers Possible",
                    detail=f"Moderate chance of passing showers starting around {first_rain_hour}.",
                    icon="cloud-drizzle",
                    is_advisory=False
                ))
        elif rain_prob >= self.t.RAIN_PROB_LOW:
            insights.append(WeatherInsight(
                id="insight-rain-low",
                category="rain",
                headline="Low Rain Probability",
                detail="Mostly dry conditions expected across the next 12 hours with minimal chance of precipitation.",
                icon="cloud-sun",
                is_advisory=False
            ))
        else:
            insights.append(WeatherInsight(
                id="insight-rain-none",
                category="rain",
                headline="Dry & Clear Weather Ahead",
                detail="No significant rainfall predicted over the next 24 hours.",
                icon="sun",
                is_advisory=False
            ))

        # 2. Temperature & Thermal Insights
        temp = current.get("temperature") or 25.0
        feels_like = current.get("feels_like") or temp
        today_daily = daily[0] if daily else {}
        max_temp = today_daily.get("high") or temp
        min_temp = today_daily.get("low") or temp

        if max_temp >= self.t.TEMP_EXTREME_HEAT or feels_like >= 42.0:
            insights.append(WeatherInsight(
                id="insight-temp-extreme",
                category="temperature",
                headline="Extreme Thermal Conditions",
                detail=f"Maximum temperatures reaching {max_temp}°C (feels like {feels_like}°C). Drink plenty of water and stay indoors during afternoon hours.",
                icon="flame",
                is_advisory=True
            ))
        elif max_temp >= self.t.TEMP_VERY_HOT:
            insights.append(WeatherInsight(
                id="insight-temp-hot",
                category="temperature",
                headline="Warm & Humid Weather",
                detail=f"Peak temperature of {max_temp}°C expected today with elevated humidity levels.",
                icon="thermometer-sun",
                is_advisory=False
            ))
        elif min_temp <= self.t.TEMP_COLD:
            insights.append(WeatherInsight(
                id="insight-temp-cold",
                category="temperature",
                headline="Chilly Temperatures",
                detail=f"Night and early morning temperatures dipping to {min_temp}°C. Light woolens advised.",
                icon="snowflake",
                is_advisory=True
            ))
        else:
            insights.append(WeatherInsight(
                id="insight-temp-pleasant",
                category="comfort",
                headline="Pleasant Temperature Profile",
                detail=f"Temperatures ranging comfortably between {min_temp}°C and {max_temp}°C.",
                icon="smile",
                is_advisory=False
            ))

        # 3. UV Index Advisory
        uv = current.get("uv_index") or 0.0
        if uv >= self.t.UV_VERY_HIGH:
            insights.append(WeatherInsight(
                id="insight-uv-extreme",
                category="uv",
                headline="Intense UV Radiation",
                detail=f"UV Index is peaking at {uv:.1f} (Very High). Sunscreen and UV-protective eyewear recommended between 11 AM and 3 PM.",
                icon="sun-medium",
                is_advisory=True
            ))
        elif uv >= self.t.UV_HIGH:
            insights.append(WeatherInsight(
                id="insight-uv-high",
                category="uv",
                headline="High UV Index",
                detail=f"Moderate-to-high UV exposure ({uv:.1f}). Seek shade during peak sunlight hours.",
                icon="sun",
                is_advisory=False
            ))

        # 4. Wind Insight
        wind_spd = current.get("wind_speed") or 0.0
        wind_dir = current.get("wind_direction") or "Variable"
        if wind_spd >= self.t.WIND_HIGH:
            insights.append(WeatherInsight(
                id="insight-wind-strong",
                category="wind",
                headline="Breezy to Gusty Winds",
                detail=f"Sustained wind speeds of {wind_spd} km/h blowing from the {wind_dir}.",
                icon="wind",
                is_advisory=True
            ))

        # 5. Visibility Insight
        vis_km = current.get("visibility")
        if vis_km is not None and vis_km < self.t.VISIBILITY_REDUCED:
            insights.append(WeatherInsight(
                id="insight-vis-fog",
                category="visibility",
                headline="Reduced Road Visibility",
                detail=f"Atmospheric visibility is restricted to {vis_km} km. Drive with low-beam headlights.",
                icon="eye-off",
                is_advisory=True
            ))

        return insights

weather_insight_service = WeatherInsightService()
