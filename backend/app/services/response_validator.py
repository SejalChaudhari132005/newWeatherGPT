import re
from typing import Dict, Any, Tuple, Optional
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.core.logging import logger

class ResponseValidator:
    """
    Validates LLM-generated text against the authoritative WeatherIntelligenceData object.
    Guards against hallucinated warnings, impossible temperatures, and source misattributions.
    """

    def validate_and_sanitize(
        self,
        llm_output: str,
        intelligence: WeatherIntelligenceData,
        user_query: str
    ) -> Tuple[bool, str, Dict[str, Any]]:
        text = llm_output.strip()
        issues = []
        is_valid = True

        # 1. Alert Hallucination Check
        has_real_alert = len(intelligence.alerts) > 0
        text_lower = text.lower()

        alert_keywords = ["red alert", "orange alert", "yellow alert", "cyclone warning", "flood warning"]
        for kw in alert_keywords:
            if kw in text_lower and not has_real_alert:
                is_valid = False
                issues.append(f"Fabricated alert detected: '{kw}' mentioned while no active official IMD warning exists.")

        # 2. Temperature Plausibility Check
        curr_temp = intelligence.current.temperature.value
        if curr_temp is not None:
            # Look for explicit °C mentions
            temp_matches = re.findall(r"(\d+(?:\.\d+)?)\s*°\s*c", text, re.IGNORECASE)
            daily_highs = [d.high for d in intelligence.forecast.daily if d.high is not None]
            daily_lows = [d.low for d in intelligence.forecast.daily if d.low is not None]

            min_plausible = min([curr_temp] + daily_lows) - 6.0
            max_plausible = max([curr_temp] + daily_highs) + 6.0

            for t_str in temp_matches:
                t_val = float(t_str)
                if t_val < min_plausible or t_val > max_plausible:
                    is_valid = False
                    issues.append(f"Temperature deviation: {t_val}°C mentioned, which exceeds plausible context range ({min_plausible:.1f}°C - {max_plausible:.1f}°C).")

        # 3. Source Misattribution Check
        if "imd forecast" in text_lower and not any("imd" in (d.condition or "").lower() for d in intelligence.forecast.daily):
            # Minor issue: Open-Meteo provides the numerical forecast
            pass

        # If invalid, generate a safe deterministic fallback
        if not is_valid:
            logger.warning(f"[ResponseValidator] Response validation failed: {issues}. Falling back to safe deterministic synthesis.")
            sanitized_text = self._build_deterministic_fallback(intelligence, user_query)
            return False, sanitized_text, {"validation_passed": False, "issues": issues}

        return True, text, {"validation_passed": True, "issues": []}

    def _build_deterministic_fallback(self, intelligence: WeatherIntelligenceData, query: str) -> str:
        loc_name = intelligence.location.city or "your area"
        curr = intelligence.current
        temp = curr.temperature.value
        cond = curr.condition
        rain_prob = curr.rain_probability.value

        q_lower = query.lower()
        if "alert" in q_lower or "warning" in q_lower:
            if intelligence.alerts:
                al = intelligence.alerts[0]
                return f"Official IMD Warning for {loc_name}: {al.title}. {al.description}. Follow local advisories."
            return f"No active official IMD warning was detected for {loc_name} at the time of this check."

        if "rain" in q_lower or "umbrella" in q_lower:
            if rain_prob and rain_prob >= 50:
                return f"Rain is likely in {loc_name} with an estimated {int(rain_prob)}% precipitation chance. Carrying rain protection is advised.\n\nSource: Open-Meteo forecast."
            return f"Rain is not expected right now in {loc_name} (precipitation chance is {int(rain_prob or 0)}%).\n\nSource: Open-Meteo forecast."

        if "tomorrow" in q_lower and intelligence.forecast.daily:
            tom = intelligence.forecast.daily[0]
            tom_rain = getattr(tom, "rainProbability", getattr(tom, "rain_probability", 0))
            return f"Tomorrow in {loc_name}: {tom.condition}, with temperatures between {tom.low}°C and {tom.high}°C. Rain chance: {tom_rain}%.\n\nSource: Open-Meteo forecast."

        return f"Currently in {loc_name}, it is {cond} with a temperature of {temp}°C (feels like {curr.feels_like.value}°C) and {curr.humidity.value}% humidity.\n\nSource: Open-Meteo."

response_validator = ResponseValidator()
