"""
FishermanAgent for WeatherGPT Phase 3.
Translates marine hydrodynamic telemetry, wave heights, swell period, wind knots,
and IMD/INCOIS coastal warnings into actionable safe-to-sail decisions and return-time intelligence.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.agents.role_router import RoleAgent, role_router
from backend.app.schemas.weather_intelligence import WeatherIntelligenceData
from backend.app.services.marine_weather_service import marine_weather_service
from backend.app.agents.weather_chat_agent import weather_chat_agent

logger = logging.getLogger("fisherman_agent")

FISHERMAN_SYSTEM_INSTRUCTION = """You are WeatherGPT's Marine Decision Intelligence Agent (🎣 MY SEA).

Your role is to guide Indian coastal fishermen and boat operators with safe-to-sail decisions:
1. Safe Departure Clearance (🟢 Favorable: Wave <1.4m, Wind <16 kts | 🟡 Caution: 1.4-2.5m, 16-24 kts | 🔴 No Departure: >2.5m, >24 kts, squall).
2. Return-Time Intelligence (Calculate exact cutoff hour when conditions deteriorate and safe return deadlines).
3. Sea State & Hydrodynamics (Significant wave height Hs, swell height/period, Beaufort scale, ocean currents, surface temp).
4. Zone-Tiered Risks (Near-Shore 0-5 nm, Coastal 5-20 nm, Deep-Sea >20 nm suitable craft advisories).
5. Semi-Diurnal Tides (High/Low tide times and amplitudes in meters).
6. Emergency Marine Broadcasts (Coast Guard SOS 1554, Marine Police 1093, VHF Ch 16).
7. Vernacular delivery (Support regional coastal languages: Marathi, Tamil, Telugu, Bengali, Gujarati, Hindi).

Rules:
- Base all recommendations strictly on verified marine telemetry provided in context.
- Never hallucinate wave heights, swell periods, wind knots, or official IMD/INCOIS cyclone bulletins.
- Differentiate between non-motorized country crafts, motorized mechanized boats, and deep-sea trawlers.
- When conditions are rough or squalls are forecast, advise against sailing or provide an immediate return window.
"""


class FishermanAgent(RoleAgent):
    """
    Dedicated Marine Weather Intelligence Agent.
    Specializes in safe-to-sail clearances, return-time cutoffs,
    hydrodynamic sea states, tide predictions, and coastal zone risks.
    """

    @property
    def role_name(self) -> str:
        return "fisher"

    @property
    def description(self) -> str:
        return "Generates marine weather advisories, sailing clearances, return-time intelligence, wave/swell conditions, and coastal emergency guidance."

    async def get_role_context(self) -> Dict[str, Any]:
        return {
            "role": "fisher",
            "focus_areas": [
                "sailing_clearance",
                "return_time_intelligence",
                "wave_height_swell",
                "beaufort_scale",
                "tide_schedule",
                "zone_risks",
                "coast_guard_sos",
                "vernacular_audio_delivery"
            ],
            "theme": "blue",
            "environment": "marine"
        }

    async def generate_advice(
        self,
        intelligence: WeatherIntelligenceData,
        query: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate structured fisher-specific intelligence and recommendations."""
        return await self.generate_dashboard_insights(intelligence, context)

    async def generate_dashboard_insights(
        self,
        intelligence: WeatherIntelligenceData,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes dynamic Fisher dashboard intelligence cards:
        - Sailing Clearance Hero Card
        - Return-Time Intelligence Timeline
        - Hydrodynamic Sea State & Swell
        - Tide Schedule & Zone Risks
        - Vernacular Audio Summary
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude
        departure_time = (context or {}).get("departure_time", "05:30")

        # Call MarineWeatherService
        decision_data = await marine_weather_service.generate_marine_decision(
            latitude=lat,
            longitude=lon,
            departure_time=departure_time,
        )

        cards = []

        # 1. Sailing Clearance Hero Card
        clearance = decision_data.sailing_clearance
        clearance_status = "critical" if clearance.status == "no_departure" else ("warning" if clearance.status == "caution" else "good")
        cards.append({
            "id": "sailing_clearance",
            "category": "Sailing Decision",
            "icon": "Anchor",
            "status": clearance_status,
            "title": f"Clearance: {clearance.status.upper().replace('_', ' ')}",
            "message": clearance.primary_reason,
            "max_wave_height_m": clearance.max_wave_height_m,
            "max_wind_speed_kts": clearance.max_wind_speed_kts,
            "clearance_window": clearance.clearance_window,
            "squall_risk": clearance.squall_risk,
            "priority": 1,
        })

        # 2. Return-Time Intelligence Card
        ret_intel = decision_data.return_time_intelligence
        cards.append({
            "id": "return_time_intelligence",
            "category": "Return-Time Intelligence",
            "icon": "Clock",
            "status": "warning" if ret_intel.alert_level == "warning" else ("critical" if ret_intel.alert_level == "critical" else "good"),
            "title": f"Return by: {ret_intel.recommended_return_time}",
            "message": f"Deterioration cutoff: {ret_intel.cutoff_hour}. Safe fishing duration: {ret_intel.safe_duration_hours}h. {ret_intel.deterioration_reason}",
            "cutoff_hour": ret_intel.cutoff_hour,
            "safe_duration_hours": ret_intel.safe_duration_hours,
            "departure_time": ret_intel.departure_time,
            "priority": 2,
        })

        # 3. Sea State & Hydrodynamics Card
        sea = decision_data.sea_state
        cards.append({
            "id": "sea_state",
            "category": "Hydrodynamic Sea State",
            "icon": "Waves",
            "status": "warning" if sea.wave_height_m >= 1.5 else "good",
            "title": f"Wave: {sea.wave_height_m}m | Swell: {sea.swell_height_m}m ({sea.swell_period_s}s)",
            "message": f"Beaufort {sea.beaufort_scale}: {sea.beaufort_description}. Sea surface temperature: {sea.sea_surface_temp_c}°C.",
            "beaufort_scale": sea.beaufort_scale,
            "sea_temp_c": sea.sea_surface_temp_c,
            "priority": 3,
        })

        # 4. Tide Schedule & Coastal Zones Card
        cards.append({
            "id": "tide_and_zones",
            "category": "Tides & Zone Danger",
            "icon": "Compass",
            "status": "good",
            "title": "Tides & Safe Zones",
            "message": f"High tide at {decision_data.tide_schedule[0].time} ({decision_data.tide_schedule[0].height_m}m). Near-shore wave: {decision_data.zone_risks[0].max_wave_height_m}m.",
            "tides": [t.model_dump() for t in decision_data.tide_schedule],
            "zones": [z.model_dump() for z in decision_data.zone_risks],
            "priority": 4,
        })

        return {
            "role": "fisher",
            "summary": f"Marine status: {clearance.status.upper()}. Wave height {sea.wave_height_m}m. Recommended return time: {ret_intel.recommended_return_time}.",
            "regional_summary": decision_data.vernacular_advisory_text,
            "cards": cards,
            "marine_decision_data": decision_data.model_dump(),
            "sources": ["Open-Meteo Marine Hydrodynamics", "IMD / INCOIS Coastal Advisories"],
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
        Invokes WeatherChatAgent with Fisherman system instructions and marine grounding.
        """
        lat = intelligence.location.latitude
        lon = intelligence.location.longitude

        # Fetch synthesized marine state
        marine_data = await marine_weather_service.generate_marine_decision(
            latitude=lat,
            longitude=lon,
        )

        marine_context_guidance = (
            f"\nVERIFIED MARINE CONTEXT FOR HARBOR / SEA ({lat:.3f}, {lon:.3f}):\n"
            f"- Sailing Status: {marine_data.sailing_clearance.status.upper()} (Reason: {marine_data.sailing_clearance.primary_reason})\n"
            f"- Wave Height: {marine_data.sea_state.wave_height_m}m, Swell: {marine_data.sea_state.swell_height_m}m @ {marine_data.sea_state.swell_period_s}s\n"
            f"- Wind Speed: {marine_data.sailing_clearance.max_wind_speed_kts} kts (Beaufort {marine_data.sea_state.beaufort_scale}: {marine_data.sea_state.beaufort_description})\n"
            f"- Recommended Return Time: {marine_data.return_time_intelligence.recommended_return_time} (Cutoff: {marine_data.return_time_intelligence.cutoff_hour})\n"
            f"- Tide Schedule: {', '.join([f'{t.tide_type.upper()} at {t.time} ({t.height_m}m)' for t in marine_data.tide_schedule])}\n"
            f"- Zone Risks: {', '.join([f'{z.zone_name}: {z.risk_level.upper()} ({z.max_wave_height_m}m)' for z in marine_data.zone_risks])}\n"
            f"- Emergency SOS: {marine_data.sos_emergency_contact}\n"
        )

        enhanced_query = f"{query} {marine_context_guidance}"

        return await weather_chat_agent.generate_response(
            query=enhanced_query,
            intelligence=intelligence,
            chat_history=chat_history,
            user_role="fisher",
            time_range=time_range,
            language=language,
        )


# Singleton Instance
fisherman_agent = FishermanAgent()

# Register in global RoleRouter under both aliases
role_router.register("fisher", fisherman_agent)
role_router.register("fisherman", fisherman_agent)
