import re
from typing import Dict, Any, Optional, List
from backend.app.llm.base import BaseLLMProvider

class MockDeterministicLLMProvider(BaseLLMProvider):
    """
    Deterministic conversational fallback provider.
    Used when no external LLM API key is provided or for fast, predictable test execution.
    Extracts verified metrics directly from the supplied WEATHER CONTEXT block.
    """
    @property
    def name(self) -> str:
        return "mock_deterministic"

    @property
    def model_name(self) -> str:
        return "weathergpt-deterministic-v1"

    async def is_available(self) -> bool:
        return True

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 600,
        **kwargs: Any
    ) -> str:
        # Separate the user query from the injected context block
        if "USER QUESTION:" in prompt:
            parts = prompt.split("USER QUESTION:")
            context_block = parts[0]
            user_q = parts[1].strip().lower()
        else:
            context_block = prompt
            user_q = prompt.lower()

        # Extract context attributes from context_block
        temp_match = re.search(r"Temperature:\s*([\d\.]+)°C", context_block, re.IGNORECASE)
        condition_match = re.search(r"Condition:\s*([^\n\r\|\[]+)", context_block, re.IGNORECASE)
        rain_prob_match = re.search(r"Rain Probability:\s*([\d\.]+)%", context_block, re.IGNORECASE)
        humidity_match = re.search(r"Humidity:\s*([\d\.]+)%", context_block, re.IGNORECASE)
        wind_match = re.search(r"Wind Speed:\s*([\d\.]+\s*km/h)", context_block, re.IGNORECASE)
        location_match = re.search(r"City / Area:\s*([^\n\r]+)", context_block, re.IGNORECASE)
        alert_match = re.search(r"ACTIVE OFFICIAL IMD WARNINGS:\s*([^\n\r]+)", context_block, re.IGNORECASE)
        tomorrow_rain_match = re.search(r"Tomorrow.*?Rain Probability:\s*([\d\.]+)%", context_block, re.IGNORECASE | re.DOTALL)
        tomorrow_high_match = re.search(r"Tomorrow.*?High:\s*([\d\.]+)°C", context_block, re.IGNORECASE | re.DOTALL)

        loc_str = location_match.group(1).strip() if location_match else "your area"
        temp_str = temp_match.group(1) if temp_match else "28.0"
        cond_str = condition_match.group(1).strip() if condition_match else "Pleasant"
        rain_str = rain_prob_match.group(1) if rain_prob_match else "20"
        humid_str = humidity_match.group(1) if humidity_match else "65"
        wind_str = wind_match.group(1).strip() if wind_match else "12 km/h"
        alerts_text = alert_match.group(1).strip() if alert_match else "None"

        # 1. Official Alert Query
        if "warning" in user_q or "alert" in user_q or "cyclone" in user_q:
            if "none" in alerts_text.lower() or "no active" in alerts_text.lower():
                return f"No active official IMD warning was detected for {loc_str} at the time of this check."
            else:
                return f"Official IMD Warning for {loc_str}: {alerts_text}. Please follow official local advisories."

        # 2. Rain / Umbrella Query
        if "rain" in user_q or "umbrella" in user_q or "shower" in user_q or "precipitation" in user_q:
            if "tomorrow" in user_q:
                tom_rain = tomorrow_rain_match.group(1) if tomorrow_rain_match else rain_str
                prob_val = float(tom_rain)
                if prob_val >= 60:
                    return f"Rain is likely tomorrow in {loc_str} with approximately a {int(prob_val)}% chance of precipitation. Carrying an umbrella is recommended.\n\nSource: Open-Meteo forecast."
                elif prob_val >= 30:
                    return f"There is a moderate {int(prob_val)}% chance of passing showers tomorrow in {loc_str}. Keep an eye on local skies.\n\nSource: Open-Meteo forecast."
                else:
                    return f"Rain is unlikely tomorrow in {loc_str}, with only a {int(prob_val)}% precipitation chance. Dry weather is expected.\n\nSource: Open-Meteo forecast."
            else:
                prob_val = float(rain_str)
                if prob_val >= 60:
                    return f"Rain is likely today in {loc_str} (precipitation chance is currently {int(prob_val)}%). You will likely need an umbrella if stepping outdoors.\n\nSource: Open-Meteo forecast."
                elif prob_val >= 30:
                    return f"There is a moderate {int(prob_val)}% chance of light showers in {loc_str}. You may want to carry rain protection just in case.\n\nSource: Open-Meteo forecast."
                else:
                    return f"Rain is not expected right now in {loc_str}. The current precipitation probability is low at {int(prob_val)}%.\n\nSource: Open-Meteo forecast."

        # 3. Temperature / Heat Query
        if "hot" in user_q or "temperature" in user_q or "temp" in user_q or "heat" in user_q or "cold" in user_q:
            if "tomorrow" in user_q:
                tom_high = tomorrow_high_match.group(1) if tomorrow_high_match else str(float(temp_str) + 1.0)
                return f"Tomorrow's maximum temperature in {loc_str} is expected to reach around {tom_high}°C.\n\nSource: Open-Meteo forecast."
            else:
                return f"The current temperature in {loc_str} is {temp_str}°C with {cond_str.lower()} conditions and humidity around {humid_str}%.\n\nSource: Open-Meteo observation."

        # 4. Travel / Safety Query
        if "travel" in user_q or "safe" in user_q or "drive" in user_q:
            prob_val = float(rain_str)
            if prob_val >= 70:
                return f"Conditions may be difficult in {loc_str} due to expected heavy rain ({int(prob_val)}% chance) and reduced visibility. Drive carefully and check local road advisories.\n\nSource: Open-Meteo."
            else:
                return f"Travel conditions in {loc_str} appear generally manageable with {cond_str.lower()} skies and winds around {wind_str}. Stay alert to changing weather.\n\nSource: Open-Meteo."

        # 5. General / Current Weather
        return f"Currently in {loc_str}, the weather is {cond_str} at {temp_str}°C. Humidity is {humid_str}% with wind speeds of {wind_str}.\n\nSource: Open-Meteo."
