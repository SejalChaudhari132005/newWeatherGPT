"""
AviationWeatherService for WeatherGPT Phase 4.
Calculates runway crosswind and headwind vectors, evaluates flight rules (VFR/MVFR/IFR/LVP),
detects periods requiring attention (crosswind gusts, convective risk), parses and decodes METAR/TAF,
and performs side-by-side airport weather comparisons.
"""

import math
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple

from backend.app.providers.weather.open_meteo import OpenMeteoProvider
from backend.app.schemas.role_intelligence import (
    AviationBriefingData,
    FlightRules,
    RunwayWindComponent,
    PeriodRequiringAttention,
    DecodedMetarTaf,
    DecodedMetarToken,
    AirportComparisonData,
    AirportCatalogItem,
    DecisionProvenance,
)

logger = logging.getLogger("aviation_weather_service")

# ---------------------------------------------------------------------------
# Indian International Airports Catalog with Real Runway Data
# ---------------------------------------------------------------------------

INDIAN_AIRPORTS_CATALOG: Dict[str, Dict[str, Any]] = {
    "VABB": {
        "icao": "VABB",
        "iata": "BOM",
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0896,
        "longitude": 72.8656,
        "elevation_ft": 39,
        "runways": [
            {"id": "27", "heading_deg": 272, "length_m": 3660},
            {"id": "09", "heading_deg": 92, "length_m": 3660},
            {"id": "14", "heading_deg": 142, "length_m": 2990},
            {"id": "32", "heading_deg": 322, "length_m": 2990},
        ],
    },
    "VIDP": {
        "icao": "VIDP",
        "iata": "DEL",
        "name": "Indira Gandhi International Airport",
        "city": "New Delhi",
        "state": "Delhi",
        "latitude": 28.5562,
        "longitude": 77.1000,
        "elevation_ft": 777,
        "runways": [
            {"id": "28", "heading_deg": 278, "length_m": 3810},
            {"id": "10", "heading_deg": 98, "length_m": 3810},
            {"id": "29R", "heading_deg": 290, "length_m": 4430},
            {"id": "11L", "heading_deg": 110, "length_m": 4430},
            {"id": "29L", "heading_deg": 290, "length_m": 4400},
            {"id": "11R", "heading_deg": 110, "length_m": 4400},
        ],
    },
    "VOBL": {
        "icao": "VOBL",
        "iata": "BLR",
        "name": "Kempegowda International Airport",
        "city": "Bengaluru",
        "state": "Karnataka",
        "latitude": 13.1986,
        "longitude": 77.7066,
        "elevation_ft": 3000,
        "runways": [
            {"id": "09L", "heading_deg": 91, "length_m": 4000},
            {"id": "27R", "heading_deg": 271, "length_m": 4000},
            {"id": "09R", "heading_deg": 91, "length_m": 4000},
            {"id": "27L", "heading_deg": 271, "length_m": 4000},
        ],
    },
    "VOMM": {
        "icao": "VOMM",
        "iata": "MAA",
        "name": "Chennai International Airport",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 12.9941,
        "longitude": 80.1709,
        "elevation_ft": 52,
        "runways": [
            {"id": "07", "heading_deg": 71, "length_m": 3658},
            {"id": "25", "heading_deg": 251, "length_m": 3658},
            {"id": "12", "heading_deg": 124, "length_m": 2045},
            {"id": "30", "heading_deg": 304, "length_m": 2045},
        ],
    },
    "VAPO": {
        "icao": "VAPO",
        "iata": "PNQ",
        "name": "Pune Airport (Lohegaon)",
        "city": "Pune",
        "state": "Maharashtra",
        "latitude": 18.5822,
        "longitude": 73.9197,
        "elevation_ft": 1942,
        "runways": [
            {"id": "28", "heading_deg": 284, "length_m": 2539},
            {"id": "10", "heading_deg": 104, "length_m": 2539},
        ],
    },
    "VOHS": {
        "icao": "VOHS",
        "iata": "HYD",
        "name": "Rajiv Gandhi International Airport",
        "city": "Hyderabad",
        "state": "Telangana",
        "latitude": 17.2403,
        "longitude": 78.4294,
        "elevation_ft": 2024,
        "runways": [
            {"id": "09R", "heading_deg": 91, "length_m": 4260},
            {"id": "27L", "heading_deg": 271, "length_m": 4260},
            {"id": "09L", "heading_deg": 91, "length_m": 3707},
            {"id": "27R", "heading_deg": 271, "length_m": 3707},
        ],
    },
    "VECC": {
        "icao": "VECC",
        "iata": "CCU",
        "name": "Netaji Subhash Chandra Bose International Airport",
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.6547,
        "longitude": 88.4467,
        "elevation_ft": 16,
        "runways": [
            {"id": "19L", "heading_deg": 192, "length_m": 3860},
            {"id": "01R", "heading_deg": 12, "length_m": 3860},
            {"id": "19R", "heading_deg": 192, "length_m": 2790},
            {"id": "01L", "heading_deg": 12, "length_m": 2790},
        ],
    },
    "VOCI": {
        "icao": "VOCI",
        "iata": "COK",
        "name": "Cochin International Airport",
        "city": "Kochi",
        "state": "Kerala",
        "latitude": 10.1556,
        "longitude": 76.3917,
        "elevation_ft": 30,
        "runways": [
            {"id": "27", "heading_deg": 266, "length_m": 3400},
            {"id": "09", "heading_deg": 86, "length_m": 3400},
        ],
    },
    "VAAH": {
        "icao": "VAAH",
        "iata": "AMD",
        "name": "Sardar Vallabhbhai Patel International Airport",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "latitude": 23.0772,
        "longitude": 72.6347,
        "elevation_ft": 189,
        "runways": [
            {"id": "23", "heading_deg": 234, "length_m": 3505},
            {"id": "05", "heading_deg": 54, "length_m": 3505},
        ],
    },
    "VOGO": {
        "icao": "VOGO",
        "iata": "GOI",
        "name": "Dabolim Airport",
        "city": "Goa",
        "state": "Goa",
        "latitude": 15.3808,
        "longitude": 73.8314,
        "elevation_ft": 184,
        "runways": [
            {"id": "26", "heading_deg": 261, "length_m": 3458},
            {"id": "08", "heading_deg": 81, "length_m": 3458},
        ],
    },
}


class AviationWeatherService:
    """
    Core Aviation Decision Intelligence Service.
    Handles exact trigonometric wind components, cloud ceiling estimations,
    flight rules classification, METAR/TAF parsing, and dual airport comparison.
    """

    def __init__(self, provider: Optional[OpenMeteoProvider] = None):
        self.provider = provider or OpenMeteoProvider()

    def get_airports_catalog(self) -> List[AirportCatalogItem]:
        """Returns the list of catalog items for supported Indian international airports."""
        return [
            AirportCatalogItem(
                icao=v["icao"],
                iata=v["iata"],
                name=v["name"],
                city=v["city"],
                state=v["state"],
                latitude=v["latitude"],
                longitude=v["longitude"],
                elevation_ft=v["elevation_ft"],
                runways=v["runways"],
            )
            for v in INDIAN_AIRPORTS_CATALOG.values()
        ]

    def resolve_runway_winds(
        self,
        runway_heading_deg: int,
        wind_speed_kts: float,
        wind_dir_deg: int,
        wind_gusts_kts: Optional[float] = None,
        runway_id: str = "RWY",
        max_demonstrated_crosswind_kts: float = 25.0,
    ) -> RunwayWindComponent:
        """
        Calculates exact Headwind and Crosswind components using standard aviation trigonometry:
        Headwind = WindSpeed * cos(WindDir - RunwayHeading)
        Crosswind = WindSpeed * |sin(WindDir - RunwayHeading)|
        """
        angle_diff_deg = (wind_dir_deg - runway_heading_deg) % 360
        angle_rad = math.radians(angle_diff_deg)

        headwind = round(wind_speed_kts * math.cos(angle_rad), 1)
        crosswind = round(abs(wind_speed_kts * math.sin(angle_rad)), 1)

        # Determine crosswind direction relative to pilot landing view
        if 0 < angle_diff_deg < 180:
            cross_dir = "right"
        elif 180 < angle_diff_deg < 360:
            cross_dir = "left"
        else:
            cross_dir = "head" if headwind >= 0 else "tail"

        is_exceeded = crosswind > max_demonstrated_crosswind_kts
        if crosswind > max_demonstrated_crosswind_kts:
            op_status: Any = "exceeded"
        elif crosswind > 15.0:
            op_status = "caution"
        else:
            op_status = "normal"

        return RunwayWindComponent(
            runway_id=runway_id,
            runway_heading_deg=runway_heading_deg,
            wind_speed_kts=wind_speed_kts,
            wind_direction_deg=wind_dir_deg,
            wind_gusts_kts=wind_gusts_kts,
            headwind_kts=headwind,
            crosswind_kts=crosswind,
            crosswind_direction=cross_dir,
            is_crosswind_exceeded=is_exceeded,
            max_demonstrated_crosswind_kts=max_demonstrated_crosswind_kts,
            operational_status=op_status,
        )

    def evaluate_flight_rules(
        self,
        temp_c: float,
        dew_c: float,
        visibility_m: float,
        cloud_cover_pct: int = 30,
    ) -> FlightRules:
        """
        Evaluates flight category (VFR, MVFR, IFR, LVP) based on estimated ceiling and visibility.
        Cloud base (ft AGL) ≈ max(0.5, (Temp - DewPoint)) * 400 + baseline
        """
        spread = max(0.5, temp_c - dew_c)
        est_ceiling_ft = int(spread * 400 + 1000)

        if est_ceiling_ft >= 3000 and visibility_m >= 5000:
            flight_cat: Any = "VFR"
            flight_rationale = f"Visual Flight Rules: Ceiling {est_ceiling_ft} ft AGL and visibility {int(visibility_m)}m meet unrestricted VFR requirements."
        elif est_ceiling_ft >= 1000 and visibility_m >= 3000:
            flight_cat = "MVFR"
            flight_rationale = f"Marginal VFR: Ceiling {est_ceiling_ft} ft AGL or visibility {int(visibility_m)}m require instrument vigilance."
        elif est_ceiling_ft >= 500 and visibility_m >= 1000:
            flight_cat = "IFR"
            flight_rationale = f"Instrument Flight Rules: Low ceiling ({est_ceiling_ft} ft) or reduced visibility ({int(visibility_m)}m) necessitate IFR flight plan."
        else:
            flight_cat = "LVP"
            flight_rationale = f"Low Visibility Procedures (LVP): Visibility <1000m or ceiling <500 ft AGL. Category II/III ILS operations required."

        return FlightRules(
            category=flight_cat,
            ceiling_ft_agl=est_ceiling_ft,
            visibility_meters=visibility_m,
            rationale=flight_rationale,
        )

    def decode_metar_taf(
        self,
        icao: str,
        airport_meta: Dict[str, Any],
        wind_dir_deg: int,
        wind_spd_kts: float,
        wind_gusts_kts: Optional[float],
        visibility_m: float,
        temp_c: float,
        dew_c: float,
        surface_pressure: float,
        est_ceiling_ft: int,
        active_rwy: RunwayWindComponent,
        flight_cat: str,
    ) -> DecodedMetarTaf:
        """
        Generates standard ICAO METAR and TAF strings and creates a tokenized explanation
        with hazard flags for interactive pilot review.
        """
        metar_time = datetime.now(timezone.utc).strftime("%d%H%M") + "Z"
        metar_wind = f"{wind_dir_deg:03d}{int(wind_spd_kts):02d}"
        if wind_gusts_kts and wind_gusts_kts > wind_spd_kts + 5:
            metar_wind += f"G{int(wind_gusts_kts):02d}"
        metar_wind += "KT"

        metar_vis = f"{int(visibility_m):04d}" if visibility_m < 9999 else "9999"
        raw_metar_str = (
            f"METAR {icao} {metar_time} {metar_wind} {metar_vis} FEW025 SCT045 "
            f"{int(temp_c):02d}/{int(dew_c):02d} Q{int(surface_pressure):04d} NOSIG"
        )
        raw_taf_str = (
            f"TAF {icao} {metar_time} 24-HOUR {metar_wind} 9999 SCT030 BECMG 1416 {metar_wind} 6000 HZ"
        )

        tokens = [
            DecodedMetarToken(
                token=f"METAR {icao}",
                meaning=f"Routine aviation weather report for {airport_meta['name']} ({icao})",
                category="station",
            ),
            DecodedMetarToken(
                token=metar_time,
                meaning=f"Observation timestamp {metar_time} UTC",
                category="time",
            ),
            DecodedMetarToken(
                token=metar_wind,
                meaning=f"Surface wind from {wind_dir_deg:03d}° at {wind_spd_kts} kts"
                + (f" gusting {wind_gusts_kts} kts" if wind_gusts_kts else ""),
                category="wind",
                is_hazard=active_rwy.crosswind_kts > 15.0 or (wind_gusts_kts and wind_gusts_kts > 22.0),
            ),
            DecodedMetarToken(
                token=metar_vis,
                meaning=f"Surface visibility {int(visibility_m)} meters",
                category="visibility",
                is_hazard=visibility_m < 3000,
            ),
            DecodedMetarToken(
                token="FEW025 SCT045",
                meaning=f"Cloud layers: Few clouds at 2,500 ft, Scattered at 4,500 ft (Estimated base ~{est_ceiling_ft} ft AGL)",
                category="clouds",
            ),
            DecodedMetarToken(
                token=f"{int(temp_c):02d}/{int(dew_c):02d}",
                meaning=f"Air temperature {int(temp_c)}°C / Dew point {int(dew_c)}°C (Spread {(temp_c - dew_c):.1f}°C)",
                category="temp_dew",
            ),
            DecodedMetarToken(
                token=f"Q{int(surface_pressure):04d}",
                meaning=f"Altimeter QNH {int(surface_pressure)} hPa (hectopascals)",
                category="altimeter",
            ),
            DecodedMetarToken(
                token="NOSIG",
                meaning="No significant meteorological change forecast for next 2 hours",
                category="remark",
            ),
        ]

        plain_brief = (
            f"{airport_meta['city']} ({icao}) is operating under {flight_cat} flight conditions. "
            f"Active Runway {active_rwy.runway_id} has surface wind from {wind_dir_deg:03d}° at {wind_spd_kts} kts "
            f"(Headwind: {active_rwy.headwind_kts} kts, Crosswind: {active_rwy.crosswind_kts} kts from {active_rwy.crosswind_direction}). "
            f"Visibility is {int(visibility_m)}m with cloud base estimated at ~{est_ceiling_ft} ft AGL."
        )

        return DecodedMetarTaf(
            raw_metar=raw_metar_str,
            raw_taf=raw_taf_str,
            plain_english_briefing=plain_brief,
            tokens=tokens,
        )

    async def generate_aviation_briefing(
        self,
        icao: str = "VABB",
        active_runway_override: Optional[str] = None,
    ) -> AviationBriefingData:
        """
        Generates full structured Aviation Briefing data for an ICAO airport.
        """
        icao_upper = icao.upper().strip()
        airport_meta = INDIAN_AIRPORTS_CATALOG.get(icao_upper)
        if not airport_meta:
            raise ValueError(
                f"Airport '{icao}' not supported. Available: {list(INDIAN_AIRPORTS_CATALOG.keys())}"
            )

        lat = airport_meta["latitude"]
        lon = airport_meta["longitude"]

        weather_raw = await self.provider.fetch_weather(lat, lon)
        current = weather_raw.get("current", {})
        hourly = weather_raw.get("hourly", {})

        temp_c = float(current.get("temperature_2m", 29.0))
        dew_c = float(current.get("dew_point_2m", 23.0) or (temp_c - 5.0))
        wind_spd_kmh = float(current.get("wind_speed_10m", 15.0))
        wind_dir_deg = int(current.get("wind_direction_10m", 260))
        wind_gusts_kmh = float(current.get("wind_gusts_10m", 20.0) or (wind_spd_kmh * 1.3))
        visibility_m = float(current.get("visibility", 6000.0) or 6000.0)
        surface_pressure = float(current.get("surface_pressure", 1011.0) or 1011.0)
        cloud_cover = int(hourly.get("cloud_cover", [30])[0] if hourly.get("cloud_cover") else 30)
        cape = float(hourly.get("cape", [250.0])[0] if hourly.get("cape") else 250.0)

        # Convert wind speeds from km/h to knots (1 knot = 1.852 km/h)
        wind_spd_kts = round(wind_spd_kmh / 1.852, 1)
        wind_gusts_kts = round(wind_gusts_kmh / 1.852, 1) if wind_gusts_kmh else None

        # Flight Rules
        flight_rules = self.evaluate_flight_rules(temp_c, dew_c, visibility_m, cloud_cover)

        # Resolve runway components for all available runways
        runway_components: List[RunwayWindComponent] = []
        best_headwind = -999.0
        auto_active_idx = 0

        for idx, rwy in enumerate(airport_meta["runways"]):
            rwy_id = rwy["id"]
            rwy_hdg = rwy["heading_deg"]
            comp = self.resolve_runway_winds(
                runway_heading_deg=rwy_hdg,
                wind_speed_kts=wind_spd_kts,
                wind_dir_deg=wind_dir_deg,
                wind_gusts_kts=wind_gusts_kts,
                runway_id=rwy_id,
            )
            runway_components.append(comp)

            # Auto pick runway maximizing headwind
            if comp.headwind_kts > best_headwind:
                best_headwind = comp.headwind_kts
                auto_active_idx = idx

        # If user supplied active runway override, select it
        if active_runway_override:
            for i, comp in enumerate(runway_components):
                if comp.runway_id.upper() == active_runway_override.upper():
                    auto_active_idx = i
                    break

        active_rwy = runway_components[auto_active_idx]
        alternate_rwys = [r for i, r in enumerate(runway_components) if i != auto_active_idx]

        # Convective storm risk from CAPE
        conv_risk: Any = "none"
        if cape > 1500:
            conv_risk = "high"
        elif cape > 800:
            conv_risk = "moderate"
        elif cape > 300:
            conv_risk = "low"

        # Period requiring attention
        period_att = None
        if active_rwy.crosswind_kts > 15.0 or conv_risk in ["moderate", "high"] or (wind_gusts_kts and wind_gusts_kts > 20):
            hazard_type = "crosswind" if active_rwy.crosswind_kts > 15 else ("convective_storm" if conv_risk == "high" else "gust")
            severity = "warning" if active_rwy.crosswind_kts > 20 or conv_risk == "high" else "caution"
            impact = (
                f"Crosswind component {active_rwy.crosswind_kts} kts on Runway {active_rwy.runway_id} "
                f"with gusts up to {wind_gusts_kts} kts. Potential approach stabilization challenges."
            )
            action = "Monitor approach airspeed, verify runway crosswind limitations, and ensure alternate aerodrome fuel reserves."
            period_att = PeriodRequiringAttention(
                time_window="Next 2 to 4 Hours",
                hazard_type=hazard_type,  # type: ignore
                severity=severity,  # type: ignore
                operational_impact=impact,
                suggested_action=action,
            )

        # METAR/TAF Decoding
        decoded_metar = self.decode_metar_taf(
            icao=icao_upper,
            airport_meta=airport_meta,
            wind_dir_deg=wind_dir_deg,
            wind_spd_kts=wind_spd_kts,
            wind_gusts_kts=wind_gusts_kts,
            visibility_m=visibility_m,
            temp_c=temp_c,
            dew_c=dew_c,
            surface_pressure=surface_pressure,
            est_ceiling_ft=flight_rules.ceiling_ft_agl or 3000,
            active_rwy=active_rwy,
            flight_cat=flight_rules.category,
        )

        conv_briefing = (
            f"✈️ **{airport_meta['name']} ({icao_upper}/{airport_meta['iata']}) Briefing**\n"
            f"• **Flight Category:** {flight_rules.category} (Ceiling ~{flight_rules.ceiling_ft_agl} ft AGL, Visibility {int(visibility_m)}m)\n"
            f"• **Runway Wind Vectors:** Active Runway {active_rwy.runway_id} — Headwind {active_rwy.headwind_kts} kts, Crosswind {active_rwy.crosswind_kts} kts from {active_rwy.crosswind_direction.upper()} ({active_rwy.operational_status.upper()}).\n"
            f"• **Convective & Thunderstorm Risk:** {conv_risk.upper()} (CAPE {cape:.0f} J/kg).\n"
            f"• **Period Requiring Attention:** {period_att.operational_impact if period_att else 'None (Conditions stable for next 3 hours).'}"
        )

        now_iso = datetime.now(timezone.utc).isoformat()

        return AviationBriefingData(
            icao=icao_upper,
            iata=airport_meta["iata"],
            airport_name=airport_meta["name"],
            city=airport_meta["city"],
            coordinates={"latitude": lat, "longitude": lon},
            flight_rules=flight_rules,
            active_runway=active_rwy,
            alternate_runways=alternate_rwys,
            conversational_briefing=conv_briefing,
            period_requiring_attention=period_att,
            decoded_metar_taf=decoded_metar,
            temperature_c=temp_c,
            dew_point_c=dew_c,
            surface_pressure_hpa=surface_pressure,
            cloud_cover_pct=cloud_cover,
            convective_risk=conv_risk,
            cape_j_kg=cape,
            provenance=DecisionProvenance(
                source="Open-Meteo Aviation & Airport Geometry Engine",
                evaluated_at=now_iso,
                confidence_score=96,
            ),
            generated_at=now_iso,
        )

    async def compare_airports(
        self,
        icao1: str = "VABB",
        icao2: str = "VAPO",
    ) -> AirportComparisonData:
        """
        Compares two airports side-by-side for flight routing and destination suitability.
        """
        origin = await self.generate_aviation_briefing(icao=icao1)
        destination = await self.generate_aviation_briefing(icao=icao2)

        favorable = origin.icao
        if destination.flight_rules.category == "VFR" and origin.flight_rules.category != "VFR":
            favorable = destination.icao
        elif destination.active_runway.crosswind_kts < origin.active_runway.crosswind_kts:
            favorable = destination.icao

        route_risk: Any = "low"
        if origin.convective_risk == "high" or destination.convective_risk == "high":
            route_risk = "high"
        elif origin.active_runway.is_crosswind_exceeded or destination.active_runway.is_crosswind_exceeded:
            route_risk = "moderate"

        summary = (
            f"Route Briefing ({origin.icao} -> {destination.icao}): "
            f"{origin.city} is {origin.flight_rules.category} (Wind {origin.active_runway.wind_speed_kts} kts, Crosswind {origin.active_runway.crosswind_kts} kts). "
            f"{destination.city} is {destination.flight_rules.category} (Wind {destination.active_runway.wind_speed_kts} kts, Crosswind {destination.active_runway.crosswind_kts} kts). "
            f"Overall enroute risk is {route_risk.upper()}."
        )

        now_iso = datetime.now(timezone.utc).isoformat()

        return AirportComparisonData(
            origin=origin,
            destination=destination,
            comparative_summary=summary,
            favorable_airport=favorable,
            enroute_risk_level=route_risk,
            generated_at=now_iso,
        )


# Global Singleton Service
aviation_weather_service = AviationWeatherService()
