from typing import Dict, Any, List, Optional
from datetime import datetime

class AirQualityEngine:
    """
    Deterministic Air Quality & Health Interpretation Engine for WeatherGPT.
    Never invents pollutant numbers. Calculates factual severity bands, primary pollutant,
    hourly trends, and non-diagnostic citizen health advisories.
    """

    # Official European Environment Agency / CAMS Air Quality Thresholds (in μg/m³)
    POLLUTANT_THRESHOLDS = {
        "pm2_5": [
            {"max": 10.0, "category": "GOOD", "label": "Good"},
            {"max": 20.0, "category": "FAIR", "label": "Fair"},
            {"max": 25.0, "category": "MODERATE", "label": "Moderate"},
            {"max": 50.0, "category": "POOR", "label": "Poor"},
            {"max": 75.0, "category": "VERY_POOR", "label": "Very Poor"},
            {"max": float("inf"), "category": "EXTREMELY_POOR", "label": "Extremely Poor"},
        ],
        "pm10": [
            {"max": 20.0, "category": "GOOD", "label": "Good"},
            {"max": 40.0, "category": "FAIR", "label": "Fair"},
            {"max": 50.0, "category": "MODERATE", "label": "Moderate"},
            {"max": 100.0, "category": "POOR", "label": "Poor"},
            {"max": 150.0, "category": "VERY_POOR", "label": "Very Poor"},
            {"max": float("inf"), "category": "EXTREMELY_POOR", "label": "Extremely Poor"},
        ],
        "no2": [
            {"max": 40.0, "category": "GOOD", "label": "Good"},
            {"max": 90.0, "category": "FAIR", "label": "Fair"},
            {"max": 120.0, "category": "MODERATE", "label": "Moderate"},
            {"max": 230.0, "category": "POOR", "label": "Poor"},
            {"max": 340.0, "category": "VERY_POOR", "label": "Very Poor"},
            {"max": float("inf"), "category": "EXTREMELY_POOR", "label": "Extremely Poor"},
        ],
        "o3": [
            {"max": 50.0, "category": "GOOD", "label": "Good"},
            {"max": 100.0, "category": "FAIR", "label": "Fair"},
            {"max": 130.0, "category": "MODERATE", "label": "Moderate"},
            {"max": 240.0, "category": "POOR", "label": "Poor"},
            {"max": 380.0, "category": "VERY_POOR", "label": "Very Poor"},
            {"max": float("inf"), "category": "EXTREMELY_POOR", "label": "Extremely Poor"},
        ],
        "so2": [
            {"max": 100.0, "category": "GOOD", "label": "Good"},
            {"max": 200.0, "category": "FAIR", "label": "Fair"},
            {"max": 350.0, "category": "MODERATE", "label": "Moderate"},
            {"max": 500.0, "category": "POOR", "label": "Poor"},
            {"max": 750.0, "category": "VERY_POOR", "label": "Very Poor"},
            {"max": float("inf"), "category": "EXTREMELY_POOR", "label": "Extremely Poor"},
        ],
        "co": [
            {"max": 5000.0, "category": "GOOD", "label": "Good"},
            {"max": 7500.0, "category": "FAIR", "label": "Fair"},
            {"max": 10000.0, "category": "MODERATE", "label": "Moderate"},
            {"max": 20000.0, "category": "POOR", "label": "Poor"},
            {"max": float("inf"), "category": "VERY_POOR", "label": "Very Poor"},
        ],
    }

    CATEGORY_RANKS = {
        "GOOD": 1,
        "FAIR": 2,
        "MODERATE": 3,
        "POOR": 4,
        "VERY_POOR": 5,
        "EXTREMELY_POOR": 6,
        "UNKNOWN": 0,
    }

    POLLUTANT_NAMES = {
        "pm2_5": "Fine Particulate Matter (PM2.5)",
        "pm10": "Coarse Particulate Matter (PM10)",
        "no2": "Nitrogen Dioxide (NO₂)",
        "o3": "Surface Ozone (O₃)",
        "so2": "Sulfur Dioxide (SO₂)",
        "co": "Carbon Monoxide (CO)",
    }

    POLLUTANT_DESCRIPTIONS = {
        "pm2_5": "Microscopic particles from combustion and vehicle emissions that can penetrate deep into airways.",
        "pm10": "Inhalable dust, pollen, and road particles affecting upper respiratory passages.",
        "no2": "Emissions mainly from vehicular traffic and industrial fuel combustion.",
        "o3": "Ground-level photochemical smog formed when pollutants react with sunlight.",
        "so2": "Emissions produced from burning fossil fuels in power stations and industrial facilities.",
        "co": "Colorless gas produced from incomplete combustion of motor vehicles and biomass.",
    }

    def evaluate_pollutant_category(self, code: str, value: Optional[float]) -> Dict[str, str]:
        """Determine category and human-readable label for a single pollutant."""
        if value is None:
            return {"category": "UNKNOWN", "label": "Unknown"}

        thresholds = self.POLLUTANT_THRESHOLDS.get(code, [])
        for item in thresholds:
            if value <= item["max"]:
                return {"category": item["category"], "label": item["label"]}

        return {"category": "UNKNOWN", "label": "Unknown"}

    def evaluate_aqi_category(self, aqi: Optional[int]) -> Dict[str, str]:
        """
        Evaluate overall European AQI category.
        Scale: 0-20: Good, 21-40: Fair, 41-60: Moderate, 61-80: Poor, 81-100: Very Poor, >100: Extremely Poor.
        """
        if aqi is None:
            return {"category": "UNKNOWN", "label": "Unknown"}
        if aqi <= 20:
            return {"category": "GOOD", "label": "Good"}
        elif aqi <= 40:
            return {"category": "FAIR", "label": "Fair"}
        elif aqi <= 60:
            return {"category": "MODERATE", "label": "Moderate"}
        elif aqi <= 80:
            return {"category": "POOR", "label": "Poor"}
        elif aqi <= 100:
            return {"category": "VERY_POOR", "label": "Very Poor"}
        else:
            return {"category": "EXTREMELY_POOR", "label": "Extremely Poor"}

    def determine_primary_pollutant(self, pollutants: Dict[str, Optional[float]]) -> Optional[str]:
        """
        Find the pollutant with the highest severity rank.
        Defaults to PM2.5 or PM10 if multiple share highest severity rank.
        """
        highest_rank = 0
        primary_code = None

        # Prefer PM2.5 / PM10 in tiebreaks due to significant health impact
        tiebreak_priority = ["pm2_5", "pm10", "no2", "o3", "so2", "co"]

        for code in tiebreak_priority:
            val = pollutants.get(code)
            if val is not None:
                cat_info = self.evaluate_pollutant_category(code, val)
                rank = self.CATEGORY_RANKS.get(cat_info["category"], 0)
                if rank > highest_rank:
                    highest_rank = rank
                    primary_code = code

        return primary_code if highest_rank >= self.CATEGORY_RANKS["MODERATE"] else (primary_code or "pm2_5")

    def generate_citizen_advisory(self, category: str, primary_pollutant: Optional[str]) -> Dict[str, str]:
        """
        Generate practical, citizen-friendly, non-diagnostic advisories.
        """
        pollutant_name = self.POLLUTANT_NAMES.get(primary_pollutant or "", "Pollutants")

        if category == "GOOD":
            return {
                "outdoor": "Air quality is ideal for all outdoor activities, workouts, and travel.",
                "sensitive": "Air quality poses virtually no risk to sensitive individuals or general public.",
            }
        elif category == "FAIR":
            return {
                "outdoor": "Air quality is acceptable for general outdoor activities.",
                "sensitive": "Very sensitive individuals with respiratory allergies may experience minor symptoms during prolonged exertion.",
            }
        elif category == "MODERATE":
            return {
                "outdoor": "Air quality is acceptable for most people. Outdoor sports and daily commutes are generally fine.",
                "sensitive": f"If you are sensitive to air pollution or notice respiratory discomfort, consider limiting prolonged outdoor exertion ({pollutant_name}).",
            }
        elif category == "POOR":
            return {
                "outdoor": "Air pollution is elevated. General public should consider reducing prolonged or heavy outdoor exertion.",
                "sensitive": "Children, the elderly, and individuals with respiratory or heart conditions should limit prolonged outdoor exposure and keep medications handy.",
            }
        elif category == "VERY_POOR":
            return {
                "outdoor": "Air pollution is significantly high. Avoid strenuous outdoor activities; prefer indoor exercises and keep windows closed.",
                "sensitive": "Sensitive individuals should avoid going outdoors. Use N95 masks if outdoor movement is essential.",
            }
        elif category == "EXTREMELY_POOR":
            return {
                "outdoor": "Severe air pollution levels detected. Everyone should avoid outdoor activities and minimize outdoor exposure.",
                "sensitive": "Sensitive groups must remain indoors in clean-air environments with air filtration if available.",
            }
        else:
            return {
                "outdoor": "Air quality status is currently being verified.",
                "sensitive": "Consult local advisory guidelines for your area.",
            }

    def evaluate_trend(self, hourly_values: List[Optional[float]]) -> Dict[str, str]:
        """
        Calculate whether air quality / PM2.5 is IMPROVING, STABLE, WORSENING, or UNKNOWN.
        """
        valid_vals = [v for v in hourly_values if v is not None]
        if len(valid_vals) < 4:
            return {"trend": "UNKNOWN", "description": "Insufficient continuous observations to determine trend."}

        # Compare average of first 3 hours vs next 3-6 hours
        current_window = valid_vals[:3]
        future_window = valid_vals[3:7] if len(valid_vals) >= 7 else valid_vals[3:]

        if not future_window:
            return {"trend": "STABLE", "description": "Air quality levels are expected to remain steady."}

        avg_current = sum(current_window) / len(current_window)
        avg_future = sum(future_window) / len(future_window)
        diff_pct = (avg_future - avg_current) / (avg_current + 1e-6)

        if diff_pct < -0.15:
            return {"trend": "IMPROVING", "description": "Air quality is expected to improve over the next several hours."}
        elif diff_pct > 0.15:
            return {"trend": "WORSENING", "description": "Pollutant concentration is expected to increase in the coming hours."}
        else:
            return {"trend": "STABLE", "description": "Pollutant concentrations are projected to remain relatively steady."}

    def combine_weather_and_air_quality(
        self,
        aqi_category: str,
        primary_pollutant: Optional[str],
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        condition: Optional[str] = None,
    ) -> Optional[str]:
        """
        Synthesize synergistic weather + air quality intelligence notes.
        Only generates combinations factually supported by observations.
        """
        notes = []

        if temperature and temperature > 34:
            if aqi_category in ["MODERATE", "POOR", "VERY_POOR", "EXTREMELY_POOR"]:
                notes.append("High ambient temperatures combined with elevated pollutants can increase heat stress; stay hydrated and take indoor breaks.")
        elif temperature and temperature < 16:
            if aqi_category in ["POOR", "VERY_POOR", "EXTREMELY_POOR"]:
                notes.append("Cool morning temperatures and low thermal inversion may trap surface particulate matter near the ground.")

        if humidity and humidity > 75:
            if aqi_category in ["MODERATE", "POOR"]:
                notes.append("High humidity and moist air may make particulate pollution feel heavier during morning and evening walks.")

        if condition and ("rain" in condition.lower() or "shower" in condition.lower()):
            notes.append("Ongoing rainfall will help wash out atmospheric particulates and gradually cleanse local air quality.")

        return " ".join(notes) if notes else None

    def process_current_air_quality(
        self,
        raw: Dict[str, Any],
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        condition: Optional[str] = None,
        hourly_pm25: Optional[List[Optional[float]]] = None,
    ) -> Dict[str, Any]:
        """
        Process raw provider data into normalized, validated AirQualityCurrentResponse payload.
        """
        aqi_val = raw.get("european_aqi")
        aqi_cat_info = self.evaluate_aqi_category(aqi_val)

        pollutants_map = {
            "pm2_5": raw.get("pm2_5"),
            "pm10": raw.get("pm10"),
            "no2": raw.get("no2"),
            "o3": raw.get("o3"),
            "so2": raw.get("so2"),
            "co": raw.get("co"),
        }

        primary_code = self.determine_primary_pollutant(pollutants_map)
        primary_name = self.POLLUTANT_NAMES.get(primary_code or "", None)

        pollutant_items = []
        for code, val in pollutants_map.items():
            cat = self.evaluate_pollutant_category(code, val)
            pollutant_items.append({
                "code": code,
                "name": self.POLLUTANT_NAMES.get(code, code.upper()),
                "value": val,
                "unit": "μg/m³",
                "category": cat["category"],
                "category_label": cat["label"],
                "is_primary": (code == primary_code),
                "description": self.POLLUTANT_DESCRIPTIONS.get(code, ""),
            })

        advisories = self.generate_citizen_advisory(aqi_cat_info["category"], primary_code)
        trend_info = self.evaluate_trend(hourly_pm25 or [])
        combined_note = self.combine_weather_and_air_quality(
            aqi_cat_info["category"], primary_code, temperature, humidity, condition
        )

        return {
            "aqi": aqi_val,
            "aqi_scale": "European AQI (CAMS)",
            "category": aqi_cat_info["category"],
            "category_label": aqi_cat_info["label"],
            "primary_pollutant": primary_code,
            "primary_pollutant_name": primary_name,
            "pm2_5": raw.get("pm2_5"),
            "pm10": raw.get("pm10"),
            "co": raw.get("co"),
            "no2": raw.get("no2"),
            "so2": raw.get("so2"),
            "o3": raw.get("o3"),
            "timestamp": raw.get("timestamp"),
            "pollutants": pollutant_items,
            "interpretation": {
                "category": aqi_cat_info["category"],
                "category_label": aqi_cat_info["label"],
                "primary_pollutant": primary_code,
                "primary_pollutant_name": primary_name,
                "outdoor_advisory": advisories["outdoor"],
                "sensitive_group_advisory": advisories["sensitive"],
                "combined_weather_note": combined_note,
                "trend": trend_info["trend"],
                "trend_description": trend_info["description"],
                "confidence": "HIGH" if aqi_val is not None else "MEDIUM",
                "data_timestamp": raw.get("timestamp"),
            },
        }

air_quality_engine = AirQualityEngine()
