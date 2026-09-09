import time
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from fastapi import HTTPException

from backend.app.agents.base_agent import BaseAgent
from backend.app.agents.weather_agent import weather_agent, WeatherAgent
from backend.app.agents.alert_agent import alert_agent, AlertAgent
from backend.app.providers.weather.imd import imd_weather_provider, IMDWeatherProvider
from backend.app.services.imd_location_mapper import imd_location_mapper
from backend.app.services.weather_risk_service import weather_risk_service, WeatherRiskService
from backend.app.services.weather_insight_service import weather_insight_service, WeatherInsightService
from backend.app.services.confidence_service import confidence_service, ConfidenceService
from backend.app.schemas.weather_intelligence import (
    WeatherIntelligenceData,
    CurrentIntelligence,
    ForecastIntelligence,
    OfficialIntelligence,
    OfficialObservation,
    ProvenanceValue,
    ProviderStatusItem,
    DataFreshness,
    RiskAssessment,
    ConfidenceAssessment,
)
from backend.app.schemas.weather import LocationMeta, HourlyForecastItem, DailyForecastItem
from backend.app.schemas.alerts import IMDAlert

logger = logging.getLogger("fusion_agent")

class WeatherFusionAgent(BaseAgent):
    """
    Core Weather Fusion Agent.
    Transforms raw meteorological provider feeds (Open-Meteo & IMD) into
    a verified, structured, source-aware Weather Intelligence object.
    """

    def __init__(
        self,
        weather_agent_inst: Optional[WeatherAgent] = None,
        alert_agent_inst: Optional[AlertAgent] = None,
        imd_provider_inst: Optional[IMDWeatherProvider] = None,
        risk_service_inst: Optional[WeatherRiskService] = None,
        insight_service_inst: Optional[WeatherInsightService] = None,
        confidence_service_inst: Optional[ConfidenceService] = None,
    ):
        self.weather_agent = weather_agent_inst or weather_agent
        self.alert_agent = alert_agent_inst or alert_agent
        self.imd_provider = imd_provider_inst or imd_weather_provider
        self.risk_service = risk_service_inst or weather_risk_service
        self.insight_service = insight_service_inst or weather_insight_service
        self.confidence_service = confidence_service_inst or confidence_service

    @property
    def name(self) -> str:
        return "WeatherFusionAgent"

    @property
    def description(self) -> str:
        return "Synthesizes multi-provider telemetry into verified, source-aware weather intelligence."

    async def build_weather_intelligence(
        self,
        latitude: float,
        longitude: float,
        location_meta: Optional[Dict[str, Any]] = None,
    ) -> WeatherIntelligenceData:
        """
        Primary entry point: executes concurrent provider queries,
        evaluates risk & insight engines, calculates data confidence,
        and constructs the complete verified WeatherIntelligenceData.
        """
        # 1. Coordinate Bounds Validation
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Latitude and longitude parameters are required.")
        if not (-90.0 <= latitude <= 90.0):
            raise HTTPException(status_code=400, detail=f"Latitude out of bounds [-90, 90]: {latitude}")
        if not (-180.0 <= longitude <= 180.0):
            raise HTTPException(status_code=400, detail=f"Longitude out of bounds [-180, 180]: {longitude}")

        start_time = time.time()
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()

        # 2. Map coordinates to official IMD station & district
        imd_mapping = imd_location_mapper.map_coordinates_to_imd(
            latitude=latitude,
            longitude=longitude,
            city_hint=(location_meta or {}).get("city"),
            district_hint=(location_meta or {}).get("district"),
            state_hint=(location_meta or {}).get("state"),
        )

        # 3. Concurrent Multi-Provider Retrieval
        om_task = self._fetch_open_meteo(latitude, longitude, location_meta)
        imd_obs_task = self._fetch_imd_obs(latitude, longitude, location_meta)
        alerts_task = self._fetch_imd_alerts(latitude, longitude, location_meta)

        (om_res, om_lat_ms, om_err), (imd_obs, imd_lat_ms, imd_err), (alerts_raw, alerts_lat_ms, alerts_err) = (
            await asyncio.gather(om_task, imd_obs_task, alerts_task)
        )

        # 4. Total Outage Check
        if not om_res and not imd_obs and not alerts_raw:
            raise HTTPException(
                status_code=503,
                detail="Weather information is temporarily unavailable from all meteorological providers. Please retry shortly."
            )

        # 5. Build Provider Status Tracking
        source_status: Dict[str, ProviderStatusItem] = {
            "open_meteo": ProviderStatusItem(
                provider="Open-Meteo",
                status="available" if om_res else "unavailable",
                latency_ms=round(om_lat_ms, 1),
                last_success=now_iso if om_res else None,
                error=om_err,
            ),
            "imd": ProviderStatusItem(
                provider="India Meteorological Department",
                status="available" if (imd_obs or alerts_raw) else "degraded" if not imd_err else "unavailable",
                latency_ms=round(imd_lat_ms, 1),
                last_success=now_iso if (imd_obs or alerts_raw) else None,
                error=imd_err,
            ),
        }

        # 6. Normalize Current Conditions with Strict Provenance
        current_raw = (om_res or {}).get("current", {})
        hourly_raw = (om_res or {}).get("hourly", [])
        daily_raw = (om_res or {}).get("daily", [])
        is_cached = (om_res or {}).get("source", {}).get("is_cached", False)

        def make_prov(val: Any, unit: str, src: str = "Open-Meteo") -> ProvenanceValue:
            return ProvenanceValue(
                value=val,
                unit=unit,
                source=src,
                observed_at=current_raw.get("observed_at") or now_iso,
                retrieved_at=now_iso,
            )

        current_intel = CurrentIntelligence(
            temperature=make_prov(current_raw.get("temperature"), "°C"),
            feels_like=make_prov(current_raw.get("feels_like"), "°C"),
            humidity=make_prov(current_raw.get("humidity"), "%"),
            wind_speed=make_prov(current_raw.get("wind_speed"), "km/h"),
            wind_direction=make_prov(current_raw.get("wind_direction"), "dir"),
            pressure=make_prov(current_raw.get("pressure"), "hPa"),
            visibility=make_prov(current_raw.get("visibility"), "km"),
            uv_index=make_prov(current_raw.get("uv_index"), "index"),
            precipitation=make_prov(current_raw.get("precipitation"), "mm"),
            rain_probability=make_prov(current_raw.get("rain_probability"), "%"),
            condition=current_raw.get("condition") or "Clear Sky",
            icon=current_raw.get("icon") or "sun",
            weather_code=current_raw.get("weather_code") or 0,
            observed_at=current_raw.get("observed_at") or now_iso,
        )

        forecast_intel = ForecastIntelligence(
            hourly=[HourlyForecastItem(**h) for h in hourly_raw],
            daily=[DailyForecastItem(**d) for d in daily_raw],
            source="Open-Meteo",
        )

        # 7. Build Official IMD Information Block
        observations_list: List[OfficialObservation] = []
        if imd_obs:
            observations_list.append(OfficialObservation(
                source="India Meteorological Department",
                station_name=imd_obs.get("station_name", imd_mapping.station_name),
                station_code=imd_obs.get("station_code", imd_mapping.station_code),
                district=imd_obs.get("district", imd_mapping.district),
                subdivision=imd_obs.get("subdivision", imd_mapping.subdivision),
                state=imd_obs.get("state", imd_mapping.state),
                temperature=imd_obs.get("temperature"),
                humidity=imd_obs.get("humidity"),
                rainfall_past_24h=imd_obs.get("rainfall_past_24h"),
                forecast_summary=imd_obs.get("forecast_summary"),
                observed_at=imd_obs.get("observed_at"),
                attribution="Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
            ))

        official_intel = OfficialIntelligence(
            status="available" if observations_list else "unavailable",
            observations=observations_list,
            advisories=[],
            message=None if observations_list else "Official IMD observation bulletin is currently unavailable for this station.",
            attribution="Official Data Source: India Meteorological Department, Ministry of Earth Sciences, Govt. of India",
        )

        # 8. Normalized Alerts List
        normalized_alerts: List[IMDAlert] = [
            IMDAlert(**a) if isinstance(a, dict) else a for a in alerts_raw
        ]

        # 9. Location Metadata Assembly
        city_name = (location_meta or {}).get("city") or imd_mapping.district
        district_name = (location_meta or {}).get("district") or imd_mapping.district
        state_name = (location_meta or {}).get("state") or imd_mapping.state

        location_obj = LocationMeta(
            latitude=latitude,
            longitude=longitude,
            city=city_name,
            district=district_name,
            state=state_name,
            country="India",
            imd_station=imd_mapping.station_name,
            imd_subdivision=imd_mapping.subdivision,
        )

        # 10. Execute Deterministic Risk Engine
        risk_assessment = self.risk_service.evaluate_risks(
            current=current_raw,
            hourly=hourly_raw,
            daily=daily_raw,
        )

        # 11. Execute Deterministic Insight Engine
        insights = self.insight_service.generate_insights(
            current=current_raw,
            hourly=hourly_raw,
            daily=daily_raw,
            city_name=city_name,
        )

        # 12. Execute Confidence Engine & Conflict Detection
        freshness_age_minutes = 5 if is_cached else 1
        confidence_assessment = self.confidence_service.evaluate_confidence(
            open_meteo_current=current_raw if om_res else None,
            imd_observation=imd_obs,
            open_meteo_available=bool(om_res),
            imd_available=bool(imd_obs or alerts_raw),
            is_cached=is_cached,
            age_minutes=freshness_age_minutes,
        )

        data_freshness = DataFreshness(
            observed_at=current_raw.get("observed_at") or now_iso,
            retrieved_at=now_iso,
            status="fresh" if freshness_age_minutes <= 30 else "recent",
            age_minutes=freshness_age_minutes,
        )

        return WeatherIntelligenceData(
            location=location_obj,
            current=current_intel,
            forecast=forecast_intel,
            official_information=official_intel,
            alerts=normalized_alerts,
            risks=risk_assessment,
            insights=insights,
            confidence=confidence_assessment,
            source_status=source_status,
            data_freshness=data_freshness,
            generated_at=now_iso,
        )

    # --------------------------------------------------------------------------
    # Internal Asynchronous Provider Fetch Helpers
    # --------------------------------------------------------------------------

    async def _fetch_open_meteo(
        self,
        lat: float,
        lon: float,
        meta: Optional[Dict[str, Any]],
    ) -> tuple[Optional[Dict[str, Any]], float, Optional[str]]:
        t0 = time.time()
        try:
            res = await self.weather_agent.get_weather(lat, lon, meta)
            lat_ms = (time.time() - t0) * 1000.0
            return res, lat_ms, None
        except Exception as exc:
            lat_ms = (time.time() - t0) * 1000.0
            logger.debug(f"[FusionAgent] Open-Meteo fetch failed: {exc}")
            return None, lat_ms, str(exc)

    async def _fetch_imd_obs(
        self,
        lat: float,
        lon: float,
        meta: Optional[Dict[str, Any]],
    ) -> tuple[Optional[Dict[str, Any]], float, Optional[str]]:
        t0 = time.time()
        try:
            res = await self.imd_provider.get_current_observation(lat, lon, meta)
            lat_ms = (time.time() - t0) * 1000.0
            return res, lat_ms, None
        except Exception as exc:
            lat_ms = (time.time() - t0) * 1000.0
            logger.debug(f"[FusionAgent] IMD observation fetch failed: {exc}")
            return None, lat_ms, str(exc)

    async def _fetch_imd_alerts(
        self,
        lat: float,
        lon: float,
        meta: Optional[Dict[str, Any]],
    ) -> tuple[List[Dict[str, Any]], float, Optional[str]]:
        t0 = time.time()
        try:
            res = await self.alert_agent.get_active_alerts(lat, lon, meta)
            lat_ms = (time.time() - t0) * 1000.0
            return res, lat_ms, None
        except Exception as exc:
            lat_ms = (time.time() - t0) * 1000.0
            logger.debug(f"[FusionAgent] IMD alerts fetch failed: {exc}")
            return [], lat_ms, str(exc)

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ctx = context or {}
        lat = ctx.get("latitude")
        lon = ctx.get("longitude")
        if lat is not None and lon is not None:
            data = await self.build_weather_intelligence(lat, lon, ctx.get("location_meta"))
            return {"agent": self.name, "status": "success", "data": data.model_dump()}
        return {"agent": self.name, "status": "error", "message": "Latitude and longitude required"}

weather_fusion_agent = WeatherFusionAgent()
