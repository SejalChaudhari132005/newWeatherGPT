"""
DisasterAgent for WeatherGPT Phase 1 (Theme 8).
Translates verified meteorological telemetry, rainfall intensities, flood hazards,
and lightning storm metrics into actionable situational intelligence for disaster responders and EOCs.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.role_router import RoleAgent, role_router
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.services.disaster_weather_service import disaster_weather_service
from backend.app.agents.weather_chat_agent import weather_chat_agent

logger = logging.getLogger("disaster_agent")

DISASTER_SYSTEM_INSTRUCTION = """You are WeatherGPT's Disaster Management Situational Intelligence Agent (🚨 DISASTER MANAGER).

Your role is to guide disaster managers, emergency responders, and district emergency operations centers (DEOCs) with critical situational weather intelligence:
1. Situational Risk Triage (Active alert status: RED / ORANGE / YELLOW, primary hazard category).
2. Rainfall Intensity & Flood Risk (Current precipitation mm/h, 24h accumulation, river basin overflow score, cloudburst threshold detection).
3. Wind, Squall & Lightning Tracking (Convective CAPE index, strike frequency per 10km radius, high crosswind gust hazards).
4. Vulnerable Infrastructure & Taluka Triage (Mapping risk to hospitals, bridges, power substations, metro subways, and low-lying settlements).
5. Standard Emergency Protocols (NDRF/SDRF mobilization guidelines, boat rescue staging, evacuation alerts, helpline references).

Rules:
- Base all advisory statements strictly on verified meteorological telemetry.
- Clearly emphasize active critical risks without inducing panic; maintain authoritative, precise emergency management tone.
- Always highlight emergency helplines (NDRF 1078, SDMA 1070, DEOC 1077) during severe or high hazard situations.
"""


class DisasterAgent(RoleAgent):
    """
    Dedicated Disaster Management Situational Intelligence Agent.
    Specializes in real-time severe hazard triage, flood risk modeling, lightning tracking,
    and municipal emergency management operations.
    """

    @property
    def role_name(self) -> str:
        return "disaster_manager"

    @property
    def description(self) -> str:
        return "Provides real-time situational weather intelligence, active IMD warning triage, flood risk analysis, and emergency EOC decision support."

    async def get_role_context(self) -> Dict[str, Any]:
        return {
            "role": "disaster_manager",
            "focus_areas": [
                "situational_risk_triage",
                "active_imd_warnings",
                "rainfall_intensity_and_cloudburst",
                "flood_vulnerability_scoring",
                "lightning_and_squall_tracking",
                "vulnerable_infrastructure_exposure",
                "emergency_helpline_coordination",
            ],
            "visual_theme": "dark_blue_with_amber_red_accents",
            "environment": "emergency_operations_center",
        }

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes structured situational risk assessment from live telemetry.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or intelligence.location.district or "Current Location"

        situational = await disaster_weather_service.get_situational_risk(lat, lon, city)
        alerts = await disaster_weather_service.get_active_alerts_stream(lat, lon, city)
        zones = await disaster_weather_service.get_vulnerable_zones(city, situational.flood_risk_score)

        return {
            "role": "disaster_manager",
            "status": "ready",
            "situational_risk": situational.model_dump(),
            "active_alerts": [a.model_dump() for a in alerts],
            "vulnerable_zones": [z.model_dump() for z in zones],
            "summary_recommendation": f"Risk Level: {situational.risk_level}. Primary Hazard: {situational.primary_hazard}. Flood Score: {situational.flood_risk_score}/100.",
        }

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
    ) -> Dict[str, Any]:
        """
        Generates structured cards for the live dashboard.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or intelligence.location.district or "Current Location"

        situational = await disaster_weather_service.get_situational_risk(lat, lon, city)
        alerts = await disaster_weather_service.get_active_alerts_stream(lat, lon, city)

        return {
            "role": "disaster_manager",
            "status": "ready",
            "hero": {
                "title": "🚨 SITUATIONAL WEATHER INTELLIGENCE",
                "risk_level": situational.risk_level,
                "headline": situational.risk_headline,
                "affected_area": situational.affected_area_summary,
                "rainfall_intensity": f"{situational.rainfall_intensity_mmh} mm/h",
                "flood_risk": situational.flood_risk_level,
                "wind_gust": f"{situational.wind_gust_kmh} km/h",
                "lightning": f"{situational.lightning_strike_density} strikes/10km",
                "updated_at": situational.updated_at,
            },
            "alerts_count": len(alerts),
            "is_emergency": situational.is_emergency_active,
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
        Synthesizes conversational responses grounded in verified situational disaster telemetry.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        city = intelligence.location.city or intelligence.location.district or "Current Location"

        situational = await disaster_weather_service.get_situational_risk(lat, lon, city)
        alerts = await disaster_weather_service.get_active_alerts_stream(lat, lon, city)

        grounded_context = f"""
[VERIFIED SITUATIONAL DISASTER INTELLIGENCE]
Location: {city} (Lat: {lat}, Lon: {lon})
Situational Risk Level: {situational.risk_level}
Primary Hazard: {situational.primary_hazard}
Active Headline: {situational.risk_headline}
Current Rain Rate: {situational.rainfall_intensity_mmh} mm/h
Projected 24-Hour Rainfall: {situational.rainfall_24h_mm} mm
Flood Risk Score: {situational.flood_risk_score}/100 ({situational.flood_risk_level})
Wind Speed & Gusts: {situational.wind_speed_kmh} km/h (Gusts: {situational.wind_gust_kmh} km/h)
Lightning Strike Density: {situational.lightning_strike_density} strikes per 10km radius
Convective CAPE: {situational.convective_cape_index} J/kg
Active Warnings: {len(alerts)} issued
Emergency Helplines: NDRF (1078), SDMA (1070), DEOC (1077)
"""

        try:
            llm_response = await weather_chat_agent.generate_response(
                query=query,
                context_str=grounded_context,
                system_instruction=DISASTER_SYSTEM_INSTRUCTION,
                chat_history=chat_history or [],
                language=language or "en",
            )
            return {
                "role": "disaster_manager",
                "content": llm_response.get("content", ""),
                "sources": ["IMD Official Bulletins", "Open-Meteo High-Resolution Ensemble"],
                "situational_risk": situational.model_dump(),
            }
        except Exception as e:
            logger.warning(f"DisasterAgent LLM synthesis failed, using deterministic template: {e}")
            fallback_text = (
                f"🚨 **Disaster Operations Briefing for {city}:**\n\n"
                f"- **Risk Level:** {situational.risk_level} ({situational.primary_hazard})\n"
                f"- **Precipitation Intensity:** {situational.rainfall_intensity_mmh} mm/h (24h Total: {situational.rainfall_24h_mm} mm)\n"
                f"- **Flood Vulnerability:** {situational.flood_risk_score}/100 ({situational.flood_risk_level})\n"
                f"- **Wind & Gusts:** {situational.wind_speed_kmh} km/h (Peak: {situational.wind_gust_kmh} km/h)\n"
                f"- **Lightning Activity:** {situational.lightning_strike_density} strikes / 10km radius\n\n"
                f"{'⚠️ Emergency protocols active. Coordinate with DEOC at 1077.' if situational.is_emergency_active else '✅ All river catchment flows within normal baseline bounds.'}"
            )
            return {
                "role": "disaster_manager",
                "content": fallback_text,
                "sources": ["IMD Official Telemetry", "Open-Meteo"],
                "situational_risk": situational.model_dump(),
            }


disaster_agent = DisasterAgent()
role_router.register("disaster_manager", disaster_agent)
role_router.register("disaster", disaster_agent)
role_router.register("emergency", disaster_agent)
