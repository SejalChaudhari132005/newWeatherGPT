"""
FarmerAgent for WeatherGPT Phase 2.
Translates verified meteorological telemetry, soil state, and crop phenology
into actionable agricultural advisories, spraying windows, and pest management.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.role_router import RoleAgent, role_router
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.services.agri_weather_service import agri_weather_service
from backend.app.agents.weather_chat_agent import weather_chat_agent

logger = logging.getLogger("farmer_agent")

FARMER_SYSTEM_INSTRUCTION = """You are WeatherGPT's Agricultural Weather Intelligence Agent (🌾 MY FARM).

Your role is to guide farmers with practical, actionable crop-management decisions:
1. Chemical Spraying Decision (Wash-off risk within 4 hours, wind drift risk >12-15 km/h, rainfastness buffer).
2. Best Farming Windows (Exact times for foliar spraying, early morning irrigation, harvesting/field operations).
3. Soil Moisture & Evapotranspiration (Surface 0-7cm vs root zone 7-28cm, FAO-56 ET0 water loss, deficit vs saturation).
4. Pest & Disease Propensity (Relative humidity, leaf wetness, temperature thresholds for fungal blights, caterpillars, sucking pests).
5. Vernacular delivery (Support regional languages like Marathi, Hindi, Telugu, Gujarati when requested).

Rules:
- Base all recommendations strictly on verified weather telemetry provided in context.
- Never hallucinate soil moisture, rainfall, wind velocity, or official IMD agromet advisories.
- Clearly differentiate between current field observations, short-term forecasts, and AI agronomic guidance.
- When spraying conditions are poor (high wind drift or imminent rain), clearly advise postponement and suggest the next optimal slot.
- Provide integrated pest management (IPM) measures (chemical active ingredients with dosage, organic/pheromone alternatives).
"""


class FarmerAgent(RoleAgent):
    """
    Dedicated Agricultural Weather Intelligence Agent.
    Specializes in crop-specific field advisories, best farming windows,
    chemical spraying risk, soil moisture, and pest/disease warnings.
    """

    @property
    def role_name(self) -> str:
        return "farmer"

    @property
    def description(self) -> str:
        return "Generates agricultural weather advisories, irrigation guidance, chemical spraying risk assessments, and crop protection intelligence."

    async def get_role_context(self) -> Dict[str, Any]:
        return {
            "role": "farmer",
            "focus_areas": [
                "spraying_suitability",
                "farming_windows",
                "soil_moisture_rootzone",
                "evapotranspiration_et0",
                "pest_disease_propensity",
                "harvesting_risk",
                "vernacular_voice_delivery"
            ],
            "theme": "emerald",
            "environment": "agricultural"
        }

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate structured farmer-specific intelligence and recommendations."""
        return await self.generate_dashboard_insights(intelligence, context)

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes dynamic Farmer dashboard intelligence cards:
        - Spraying Risk & Optimal Window
        - Best Farming Windows (Spraying, Irrigation, Harvesting)
        - Soil Moisture & Irrigation Urgency
        - Crop Pest & Disease Alerts
        - Regional Vernacular Briefing
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or "Farming Field"

        crop = (context or {}).get("crop", "soybean")
        stage = (context or {}).get("stage", "flowering")
        planned_spray = (context or {}).get("planned_spray_hour", 8)

        # Call AgriWeatherService
        decision_data = await agri_weather_service.generate_farmer_decision(
            latitude=lat,
            longitude=lon,
            crop=crop,
            stage=stage,
            planned_spray_hour=planned_spray,
        )

        cards = []

        # 1. Spraying Suitability Hero Card
        spray = decision_data.spraying_suitability
        cards.append({
            "id": "spraying_suitability",
            "category": "Chemical Spraying Decision",
            "icon": "Spray",
            "status": "critical" if spray.overall_risk == "HIGH" else ("warning" if spray.overall_risk == "MODERATE" else "good"),
            "title": f"Spraying Risk: {spray.overall_risk}",
            "message": spray.recommendations[0] if spray.recommendations else f"Optimal spray window: {spray.optimal_window}",
            "optimal_window": spray.optimal_window,
            "wash_off_risk": spray.wash_off_risk,
            "drift_risk": spray.drift_risk,
            "wind_speed_kmh": spray.wind_speed_kmh,
            "priority": 1,
        })

        # 2. Best Farming Windows Card
        cards.append({
            "id": "farming_windows",
            "category": "Farming Windows",
            "icon": "CalendarClock",
            "status": "good",
            "title": "Best Farming Windows",
            "message": f"Optimal spray window: {spray.optimal_window}. Morning irrigation recommended between 06:00 - 08:30.",
            "windows": [w.model_dump() for w in decision_data.best_farming_windows],
            "priority": 2,
        })

        # 3. Soil State & Irrigation Urgency Card
        soil = decision_data.soil_state
        cards.append({
            "id": "soil_state",
            "category": "Soil Moisture & ET0",
            "icon": "Droplet",
            "status": "critical" if soil.irrigation_urgency == "critical" else ("warning" if soil.irrigation_urgency == "moderate" else "good"),
            "title": f"Soil Moisture: {soil.moisture_status.upper()}",
            "message": f"Surface (0-7cm): {soil.moisture_surface_0_to_7cm or 'N/A'} m³/m³, Rootzone (7-28cm): {soil.moisture_rootzone_7_to_28cm or 'N/A'} m³/m³. ET0: {soil.et0_evapotranspiration_mm or 'N/A'} mm.",
            "urgency": soil.irrigation_urgency,
            "priority": 3,
        })

        # 4. Pest & Disease Propensity Card
        if decision_data.pest_disease_risks:
            top_pest = decision_data.pest_disease_risks[0]
            cards.append({
                "id": "pest_disease_risks",
                "category": "Crop Protection Alert",
                "icon": "ShieldAlert",
                "status": "warning" if top_pest.risk_level == "high" else "good",
                "title": f"Pest Alert: {top_pest.disease_or_pest_name}",
                "message": top_pest.preventive_action,
                "risks": [r.model_dump() for r in decision_data.pest_disease_risks],
                "priority": 4,
            })

        return {
            "role": "farmer",
            "summary": decision_data.executive_summary,
            "regional_summary": decision_data.regional_advisory_text,
            "cards": cards,
            "farmer_decision_data": decision_data.model_dump(),
            "sources": ["Open-Meteo Agri Telemetry", "IMD Agromet Bulletins"],
            "updated_at": decision_data.generated_at,
        }

    async def generate_chat_context(
        self,
        intelligence: WeatherIntelligenceData,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        time_range: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Invokes WeatherChatAgent with Farmer system instructions and agricultural grounding.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude

        # Fetch synthesized agronomic state
        farmer_data = await agri_weather_service.generate_farmer_decision(
            latitude=lat,
            longitude=lon,
        )

        agri_context_guidance = (
            f"\nVERIFIED AGRICULTURAL CONTEXT FOR FIELD ({lat:.3f}, {lon:.3f}):\n"
            f"- Crop: {farmer_data.crop} ({farmer_data.phenological_stage})\n"
            f"- Current Temp: {farmer_data.current_temp_c}°C, Humidity: {farmer_data.current_humidity_pct}%, Wind: {farmer_data.spraying_suitability.wind_speed_kmh} km/h\n"
            f"- Spraying Overall Risk: {farmer_data.spraying_suitability.overall_risk} (Optimal Window: {farmer_data.spraying_suitability.optimal_window})\n"
            f"- Wash-off Risk: {farmer_data.spraying_suitability.wash_off_risk}, Drift Risk: {farmer_data.spraying_suitability.drift_risk}\n"
            f"- Soil Moisture Status: {farmer_data.soil_state.moisture_status} (Irrigation Urgency: {farmer_data.soil_state.irrigation_urgency})\n"
            f"- Disease Risks: {', '.join([p.disease_or_pest_name + ' (' + p.risk_level + ')' for p in farmer_data.pest_disease_risks])}\n"
        )

        enhanced_query = f"{query} {agri_context_guidance}"

        return await weather_chat_agent.generate_response(
            query=enhanced_query,
            intelligence=intelligence,
            chat_history=chat_history,
            user_role="farmer",
            time_range=time_range,
            language=language,
        )


# Singleton Instance
farmer_agent = FarmerAgent()

# Register in global RoleRouter
role_router.register("farmer", farmer_agent)
