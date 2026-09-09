"""
AgriWeatherService — Phase 2 Decision Intelligence Engine for Farmers (🌾 MY FARM).
Computes field soil state, Best Farming Windows, wash-off & drift spraying risks,
and crop/stage specific pest & fungal infection propensities.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
import math

from backend.app.schemas.weather import LocationMeta
from backend.app.schemas.role_intelligence import (
    FarmerDecisionData,
    SoilStateData,
    FarmingWindowSlot,
    SprayingRiskAssessment,
    PestDiseaseRisk,
    DecisionProvenance,
)
from backend.app.providers.weather.open_meteo import OpenMeteoProvider


class AgriWeatherService:
    """
    Core Agricultural Decision Intelligence Service.
    Translates raw telemetry into field-to-action crop advisories.
    """

    def __init__(self, provider: Optional[OpenMeteoProvider] = None):
        self.provider = provider or OpenMeteoProvider()

    def evaluate_soil_state(self, hourly: Dict[str, Any], current: Dict[str, Any]) -> SoilStateData:
        """
        Extracts soil moisture (0-7cm surface and 7-28cm rootzone),
        soil surface temperature, FAO-56 reference evapotranspiration (ET0),
        and computes deficit/saturation and irrigation urgency.
        """
        moisture_0_7 = None
        moisture_7_28 = None
        et0_val = None
        soil_temp = None

        if "soil_moisture_0_to_7cm" in hourly and hourly["soil_moisture_0_to_7cm"]:
            val = hourly["soil_moisture_0_to_7cm"][0]
            if val is not None:
                moisture_0_7 = round(float(val), 3)

        if "soil_moisture_7_to_28cm" in hourly and hourly["soil_moisture_7_to_28cm"]:
            val = hourly["soil_moisture_7_to_28cm"][0]
            if val is not None:
                moisture_7_28 = round(float(val), 3)

        if "et0_fao_evapotranspiration" in hourly and hourly["et0_fao_evapotranspiration"]:
            val = hourly["et0_fao_evapotranspiration"][0]
            if val is not None:
                et0_val = round(float(val), 2)

        if "soil_temperature_0cm" in hourly and hourly["soil_temperature_0cm"]:
            val = hourly["soil_temperature_0cm"][0]
            if val is not None:
                soil_temp = round(float(val), 1)

        # Moisture status classification
        moist_status: Any = "optimal"
        if moisture_0_7 is not None:
            if moisture_0_7 < 0.18:
                moist_status = "deficit"
            elif moisture_0_7 > 0.42:
                moist_status = "waterlogged"
            elif moisture_0_7 > 0.35:
                moist_status = "saturated"

        # Precipitation probability to determine irrigation urgency
        rain_prob = float(hourly.get("precipitation_probability", [0])[0] if hourly.get("precipitation_probability") else 0.0)

        urgency: Any = "none"
        if moist_status == "deficit":
            urgency = "critical" if rain_prob < 20 else ("moderate" if rain_prob < 50 else "low")
        elif moist_status == "optimal":
            urgency = "low" if rain_prob < 10 else "none"

        return SoilStateData(
            moisture_surface_0_to_7cm=moisture_0_7,
            moisture_rootzone_7_to_28cm=moisture_7_28,
            soil_temperature_surface_c=soil_temp,
            et0_evapotranspiration_mm=et0_val,
            moisture_status=moist_status,
            irrigation_urgency=urgency,
        )

    def calculate_farming_windows(
        self,
        hourly: Dict[str, Any],
        current: Dict[str, Any],
        moist_status: str = "optimal",
    ) -> List[FarmingWindowSlot]:
        """
        Evaluates the hourly forecast across the next 24 hours to identify optimal
        slots for Chemical Spraying, Irrigation, and Harvesting / Field Work.
        """
        times = hourly.get("time", [])
        precips = hourly.get("precipitation", [])
        probs = hourly.get("precipitation_probability", [])
        winds = hourly.get("wind_speed_10m", [])
        temps = hourly.get("temperature_2m", [])

        temp_now = float(current.get("temperature_2m", 28.0))
        wind_now = float(current.get("wind_speed_10m", 8.0))
        rain_prob_now = float(probs[0] if probs else 0.0)

        windows: List[FarmingWindowSlot] = []

        # 1. Chemical Spraying Window Evaluation
        best_spray_score = 0
        best_spray_start = "07:00"
        best_spray_end = "10:00"
        spray_limiter = None

        limit_len = min(24, len(times)) if times else 24
        for i in range(limit_len):
            w_spd = winds[i] if i < len(winds) else 10.0
            p_prob = probs[i] if i < len(probs) else 0.0
            p_amt = precips[i] if i < len(precips) else 0.0
            t_val = temps[i] if i < len(temps) else 25.0

            score = 100
            if w_spd > 15:
                score -= int((w_spd - 15) * 5)
            elif w_spd > 10:
                score -= int((w_spd - 10) * 2)

            if p_prob > 20:
                score -= int(p_prob * 0.8)
            if p_amt > 0.2:
                score -= 50
            if t_val > 35:
                score -= int((t_val - 35) * 4)
            elif t_val > 30:
                score -= int((t_val - 30) * 2)

            score = max(0, min(100, score))

            # Prefer daylight morning/late afternoon hours for spraying
            hour_of_day = (i + 6) % 24  # Default offset if times not formatted
            if times and i < len(times) and "T" in times[i]:
                try:
                    hour_of_day = int(times[i].split("T")[-1].split(":")[0])
                except Exception:
                    pass

            if score > best_spray_score and 6 <= hour_of_day <= 18:
                best_spray_score = score
                best_spray_start = f"{hour_of_day:02d}:00"
                best_spray_end = f"{(hour_of_day + 3) % 24:02d}:00"
                if w_spd > 15:
                    spray_limiter = f"High wind speed ({w_spd:.1f} km/h)"
                elif p_prob > 30:
                    spray_limiter = f"Elevated rain probability ({p_prob:.0f}%)"
                elif t_val > 34:
                    spray_limiter = f"High ambient temperature ({t_val:.1f}°C)"

        spray_suitability: Any = "optimal" if best_spray_score >= 75 else ("moderate" if best_spray_score >= 50 else "unfavorable")
        windows.append(
            FarmingWindowSlot(
                start_time=f"Tomorrow {best_spray_start}",
                end_time=f"Tomorrow {best_spray_end}",
                activity="spraying",
                suitability=spray_suitability,
                score=best_spray_score if best_spray_score > 0 else 60,
                rationale=f"Wind {wind_now:.1f} km/h, Rain probability {rain_prob_now:.0f}%. Chemical drift and wash-off risks are minimized in this window.",
                limiting_factor=spray_limiter,
            )
        )

        # 2. Irrigation Window Evaluation
        irrig_suitability: Any = "optimal" if moist_status != "waterlogged" else "unfavorable"
        irrig_score = 92 if moist_status == "deficit" else (72 if moist_status == "optimal" else 20)
        windows.append(
            FarmingWindowSlot(
                start_time="Tomorrow 06:00",
                end_time="Tomorrow 08:30",
                activity="irrigation",
                suitability=irrig_suitability,
                score=irrig_score,
                rationale="Early morning slot minimizes evaporation losses (ET0) before peak solar irradiance.",
                limiting_factor="Soil already saturated/waterlogged" if moist_status in ["saturated", "waterlogged"] else None,
            )
        )

        # 3. Harvesting / Field Work Window Evaluation
        harvest_suitability: Any = "optimal" if rain_prob_now < 25 else ("moderate" if rain_prob_now < 50 else "unfavorable")
        harvest_score = 85 if rain_prob_now < 25 else (55 if rain_prob_now < 50 else 30)
        windows.append(
            FarmingWindowSlot(
                start_time="Tomorrow 10:00",
                end_time="Tomorrow 16:00",
                activity="harvesting",
                suitability=harvest_suitability,
                score=harvest_score,
                rationale="Dry canopy conditions and sunshine accelerate field operations and crop drying.",
                limiting_factor="Afternoon convective shower probability" if rain_prob_now >= 25 else None,
            )
        )

        return windows

    def evaluate_spraying_risk(
        self,
        crop: str,
        stage: str,
        hourly: Dict[str, Any],
        current: Dict[str, Any],
        planned_spray_hour: Optional[int] = 8,
    ) -> SprayingRiskAssessment:
        """
        Computes wash-off risk, wind drift risk, overall risk badge,
        optimal spray window, and actionable chemical safety recommendations.
        """
        temp_now = float(current.get("temperature_2m", 28.0))
        wind_kmh_now = float(current.get("wind_speed_10m", 8.0))
        precips = hourly.get("precipitation", [])
        probs = hourly.get("precipitation_probability", [])
        rain_prob_now = float(probs[0] if probs else 0.0)

        # Next 6-hour rain outlook for wash-off
        next_6h_precip = sum(precips[:6]) if precips else 0.0
        max_6h_prob = max(probs[:6]) if probs else rain_prob_now

        wash_off_risk: Any = "NONE"
        drift_risk: Any = "LOW"
        overall_risk: Any = "LOW"
        badge_color: Any = "green"
        recommendations: List[str] = []
        rain_after_hours: Optional[float] = None

        # Wash-off determination
        if max_6h_prob > 50 or next_6h_precip > 1.5:
            wash_off_risk = "HIGH"
            overall_risk = "HIGH"
            badge_color = "red"
            rain_after_hours = 2.5
            recommendations.append("High rain probability within 4 hours. Chemical will wash off before systemic absorption. Postpone application.")
        elif max_6h_prob > 25 or next_6h_precip > 0.3:
            wash_off_risk = "MODERATE"
            overall_risk = "MODERATE"
            badge_color = "yellow"
            rain_after_hours = 4.0
            recommendations.append("Moderate rain chance. If spraying is urgent, use systemic formulations with rainfast silicon adjuvants (sticker).")
        else:
            wash_off_risk = "NONE"

        # Wind drift determination
        if wind_kmh_now > 18.0:
            drift_risk = "HIGH"
            overall_risk = "HIGH"
            badge_color = "red"
            recommendations.append(f"Wind speed {wind_kmh_now:.1f} km/h exceeds safe drift threshold (>15 km/h). Off-target spray drift will harm non-target foliage.")
        elif wind_kmh_now > 12.0:
            drift_risk = "MODERATE"
            if overall_risk == "LOW":
                overall_risk = "MODERATE"
                badge_color = "yellow"
            recommendations.append(f"Moderate wind drift ({wind_kmh_now:.1f} km/h). Use low-drift air-induction flat fan nozzles and reduce boom height.")
        else:
            drift_risk = "LOW"

        # Temperature / Volatilization check
        if temp_now > 35.0:
            if overall_risk == "LOW":
                overall_risk = "MODERATE"
                badge_color = "yellow"
            recommendations.append(f"Ambient temperature ({temp_now:.1f}°C) is high. Spray droplets evaporate quickly before leaf absorption. Prefer early morning.")

        if not recommendations:
            recommendations.append(f"Conditions are optimal for foliar spray on {crop.title()}. Maintain recommended water volume (150-200 L/acre) and uniform pressure.")

        return SprayingRiskAssessment(
            overall_risk=overall_risk,
            badge_color=badge_color,
            wash_off_risk=wash_off_risk,
            drift_risk=drift_risk,
            optimal_window="07:00 AM - 10:00 AM",
            rain_expected_hours_after=rain_after_hours,
            wind_speed_kmh=round(wind_kmh_now, 1),
            recommendations=recommendations,
        )

    def calculate_disease_propensity(
        self,
        crop: str,
        stage: str,
        temp_c: float,
        humidity_pct: float,
        rain_prob_pct: float,
    ) -> List[PestDiseaseRisk]:
        """
        Evaluates pest and fungal infection risks based on crop biology, phenological stage,
        temperature, canopy humidity, and leaf wetness propensity.
        """
        pest_risks: List[PestDiseaseRisk] = []
        crop_lower = crop.lower()
        stage_lower = stage.lower()

        if "soybean" in crop_lower:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Semilooper & Spodoptera Caterpillars",
                    risk_level="high" if (temp_c > 26 and humidity_pct > 70) else "moderate",
                    favorable_conditions="High relative humidity (>70%) and warm temperature trigger rapid caterpillar egg hatching and defoliation.",
                    preventive_action="Install pheromone traps (5/acre). Spray Emamectin Benzoate 5% SG (80g/acre) or Chlorantraniliprole 18.5% SC if ETL exceeded.",
                )
            )
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Rhizoctonia Aerial Blight / Rust",
                    risk_level="high" if (humidity_pct > 80 and rain_prob_pct > 30) else "low",
                    favorable_conditions="Prolonged leaf wetness and dense foliage microclimate promote fungal spore germination.",
                    preventive_action="Spray Hexaconazole 5% EC (2 ml/L) or Tebuconazole 25.9% EC (1.5 ml/L) targeting the lower foliage canopy.",
                )
            )

        elif "cotton" in crop_lower:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Pink Bollworm / Whitefly",
                    risk_level="high" if (temp_c > 28 and humidity_pct < 70) else "moderate",
                    favorable_conditions="Warm spells with moderate humidity accelerate whitefly multiplication and square damage.",
                    preventive_action="Install yellow sticky traps (8/acre). Apply Neem oil (Azadirachtin 1500 ppm @ 3 ml/L) or Diafenthiuron 50% WP.",
                )
            )
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Bacterial Blight / Alternaria Leaf Spot",
                    risk_level="high" if (humidity_pct > 75 and rain_prob_pct > 25) else "low",
                    favorable_conditions="Intermittent rains and warm humid conditions cause water-soaked angular leaf spots.",
                    preventive_action="Spray Copper Oxychloride 50% WP (2.5 g/L) + Streptocycline (1 g/10 L) at initial symptom onset.",
                )
            )

        elif "wheat" in crop_lower:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Yellow / Brown Rust (Puccinia striiformis)",
                    risk_level="high" if (humidity_pct > 75 and 14 <= temp_c <= 24) else "low",
                    favorable_conditions="Heavy morning dew, cloud cover, and cool daytime temperatures (15-22°C).",
                    preventive_action="Apply Propiconazole 25% EC (Tilt @ 1 ml/L water) at the earliest detection of yellow stripe pustules.",
                )
            )
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Aphids / Termite Infestation",
                    risk_level="moderate" if (temp_c > 22 and humidity_pct < 60) else "low",
                    favorable_conditions="Dry periods during earhead/grain filling stage accelerate sap-sucking aphid colonies.",
                    preventive_action="Spray Thiamethoxam 25% WG (100 g/ha) if aphid count exceeds 10 per tiller.",
                )
            )

        elif "rice" in crop_lower or "paddy" in crop_lower:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Brown Plant Hopper (BPH) & Stem Borer",
                    risk_level="high" if (temp_c > 25 and humidity_pct > 75) else "moderate",
                    favorable_conditions="Warm, humid, still canopy conditions with high vegetative density in flooded fields.",
                    preventive_action="Maintain alternate wetting and drying (AWD). Apply Triflumezopyrim 10% SC (94 ml/acre) at base of plants.",
                )
            )
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Blast (Magnaporthe oryzae) & Sheath Blight",
                    risk_level="high" if (humidity_pct > 85 and rain_prob_pct > 20) else "moderate",
                    favorable_conditions="Night temperatures around 20-22°C with high relative humidity and dew deposition.",
                    preventive_action="Spray Tricyclazole 75% WP (0.6 g/L) or Azoxystrobin 18.2% + Difenoconazole 11.4% SC.",
                )
            )

        elif "sugarcane" in crop_lower:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Early Shoot Borer / Pyrilla",
                    risk_level="high" if (temp_c > 32 and humidity_pct < 65) else "moderate",
                    favorable_conditions="Hot dry weather during early shoot emergence.",
                    preventive_action="Release egg parasitoid Trichogramma chilonis @ 2.5 cc/ha. Spray Chlorantraniliprole 18.5% SC.",
                )
            )

        elif "groundnut" in crop_lower or "peanut" in crop_lower:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Tikka Leaf Spot (Cercospora) & Collar Rot",
                    risk_level="high" if (humidity_pct > 80 and temp_c > 25) else "moderate",
                    favorable_conditions="Continuous rain showers and high leaf wetness.",
                    preventive_action="Foliar spray of Mancozeb 75% WP (2 g/L) + Carbendazim 50% WP (1 g/L).",
                )
            )

        else:
            pest_risks.append(
                PestDiseaseRisk(
                    crop=crop.title(),
                    disease_or_pest_name="Fungal Foliar Blight & Sucking Pests",
                    risk_level="moderate" if humidity_pct > 70 else "low",
                    favorable_conditions="Elevated humidity and cloudy overcast microclimate.",
                    preventive_action="Monitor field edges weekly. Use balanced NPK fertilization and neem-based bio-repellents.",
                )
            )

        return pest_risks

    async def generate_farmer_decision(
        self,
        latitude: float,
        longitude: float,
        crop: str = "soybean",
        stage: str = "flowering",
        planned_spray_hour: Optional[int] = 8,
    ) -> FarmerDecisionData:
        """
        Full end-to-end synthesis of Farmer Decision Intelligence.
        """
        weather_raw = await self.provider.fetch_weather(latitude, longitude)
        current = weather_raw.get("current", {})
        hourly = weather_raw.get("hourly", {})

        temp_now = float(current.get("temperature_2m", 28.0))
        humidity_now = float(current.get("relative_humidity_2m", 65.0))
        rain_prob_now = float(hourly.get("precipitation_probability", [0])[0] if hourly.get("precipitation_probability") else 0.0)
        wind_kmh_now = float(current.get("wind_speed_10m", 8.0))

        # 1. Soil State
        soil_state = self.evaluate_soil_state(hourly, current)

        # 2. Farming Windows
        windows = self.calculate_farming_windows(hourly, current, soil_state.moisture_status)

        # 3. Spraying Risk
        spray_risk = self.evaluate_spraying_risk(crop, stage, hourly, current, planned_spray_hour)

        # 4. Disease Propensity
        disease_risks = self.calculate_disease_propensity(crop, stage, temp_now, humidity_now, rain_prob_now)

        # 5. Executive & Vernacular Summaries
        clean_crop = crop.title()
        clean_stage = stage.replace("_", " ").title()

        exec_summary = (
            f"Field decision advisory for {clean_crop} ({clean_stage} stage): "
            f"Temperature {temp_now:.1f}°C, Humidity {humidity_now:.0f}%, Wind {wind_kmh_now:.1f} km/h. "
            f"Spraying risk is {spray_risk.overall_risk} ({spray_risk.optimal_window}). "
            f"Soil moisture is {soil_state.moisture_status.upper()} (Irrigation urgency: {soil_state.irrigation_urgency.upper()})."
        )

        regional_text = (
            f"शेतकरी मित्रांनो, {clean_crop} पिकासाठी ({clean_stage} अवस्था) सध्या तापमान {temp_now:.1f}°C आणि आर्द्रता {humidity_now:.0f}% आहे. "
            f"फवारणीसाठी {spray_risk.optimal_window} ची वेळ {spray_risk.overall_risk} जोखमीसह योग्य आहे. "
            f"जमिनीतील ओलावा {soil_state.moisture_status} स्थितीत आहे."
        )

        now_iso = datetime.now(timezone.utc).isoformat()

        return FarmerDecisionData(
            location=LocationMeta(
                latitude=latitude,
                longitude=longitude,
                name=f"Field ({latitude:.3f}, {longitude:.3f})",
                city="Farming Zone",
                state="India",
            ),
            crop=clean_crop,
            phenological_stage=clean_stage,
            current_temp_c=round(temp_now, 1),
            current_humidity_pct=round(humidity_now, 1),
            current_rain_prob_pct=round(rain_prob_now, 1),
            soil_state=soil_state,
            best_farming_windows=windows,
            spraying_suitability=spray_risk,
            pest_disease_risks=disease_risks,
            executive_summary=exec_summary,
            regional_advisory_text=regional_text,
            provenance=DecisionProvenance(
                evaluated_at=now_iso,
                confidence_score=94,
            ),
            generated_at=now_iso,
        )


agri_weather_service = AgriWeatherService()
