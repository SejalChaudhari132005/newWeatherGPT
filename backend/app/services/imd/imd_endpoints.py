"""
Official India Meteorological Department (IMD) API Endpoint Catalog.
Source of Truth: https://api.imd.gov.in/public/api_reference.html
Ministry of Earth Sciences, Government of India.
"""

from typing import Dict, List, Any

# Primary API Base URL
DEFAULT_IMD_BASE_URL = "https://api.imd.gov.in/api/v1"
PUBLIC_MAUSAM_BASE_URL = "https://mausam.imd.gov.in/api"

# Documented Official IMD API Endpoints
IMD_ENDPOINTS: Dict[str, Dict[str, Any]] = {
    "current_weather": {
        "id": "api-3",
        "name": "Current Weather API",
        "description": "Station-wise current surface weather observations recorded by IMD surface observatories and automatic weather stations (AWS).",
        "endpoints": [
            "/current_wx",
            "/current_wx?id={station_code}",
        ],
        "category": "Current Weather & Nowcast",
    },
    "lat_lon_weather": {
        "id": "api-2",
        "name": "City Weather Forecast with Latitude & Longitude",
        "description": "7-day city weather forecast mapped to geographic latitude and longitude coordinates.",
        "endpoints": [
            "/cityforecastloc",
            "/cityforecastloc?id={station_code}",
            "/sunmoon?lat={latitude}&lon={longitude}",
        ],
        "category": "Weather Forecast APIs",
    },
    "forecast": {
        "id": "api-1",
        "name": "City Weather Forecast (7 Days)",
        "description": "Official 7-day city weather forecast bulletin issued by IMD Regional Meteorological Centres (RMCs).",
        "endpoints": [
            "/cityforecast",
            "/cityforecast?id={station_code}",
            "/cityforecast_mapping",
        ],
        "category": "Weather Forecast APIs",
    },
    "nowcast": {
        "id": "api-4",
        "name": "District-wise & Station-wise Nowcast",
        "description": "Short-range (0-3 hours) high-resolution severe weather nowcasts for districts and stations.",
        "endpoints": [
            "/districtnowcast",
            "/districtnowcast?id={district_id}",
            "/stationnowcast",
            "/stationnowcast?id={station_name}",
        ],
        "category": "Current Weather & Nowcast",
    },
    "warnings": {
        "id": "api-6",
        "name": "District-wise & Subdivisional Warnings",
        "description": "Colour-coded (Green/Yellow/Orange/Red) official IMD severe weather warnings for 5 days.",
        "endpoints": [
            "/districtwarning",
            "/districtwarning?id={district_id}",
            "/subdivisionwarning",
        ],
        "category": "Warning APIs",
    },
    "rainfall": {
        "id": "api-5",
        "name": "District-wise & State-wise Rainfall",
        "description": "24-hour recorded cumulative rainfall, state statistics, and 5-day quantitative precipitation forecasts (QPF).",
        "endpoints": [
            "/districtrainfall",
            "/districtrainfall?id={district_id}",
            "/staterainfall",
            "/staterainfall?id={state_name}",
            "/basinqpf",
            "/state_district_rainfall_forecast",
            "/subdivision_rainfall_forecast",
        ],
        "category": "Rainfall APIs",
    },
    "cyclone": {
        "id": "api-18",
        "name": "Cyclone Track, Wind & Cone of Uncertainty",
        "description": "Tropical cyclone tracking, estimated gale/squally wind radii, and 120-hour cone of uncertainty bulletins.",
        "endpoints": [
            "/cyclone_track",
            "/cyclone_wind",
            "/cyclone_cou",
        ],
        "category": "Cyclone APIs",
    },
    "fishermen_warning": {
        "id": "api-23",
        "name": "Marine Bulletins & Fishermen Warnings",
        "description": "Port warnings, sea area bulletins, coastal bulletins, and high-sea squally weather advisories for deep-sea fishermen.",
        "endpoints": [
            "/portwarning",
            "/seabulletin",
            "/coastalbulletin",
            "/fishermenwarning",
        ],
        "category": "Marine APIs",
    },
    "radar": {
        "id": "api-25",
        "name": "Doppler Weather Radar (DWR) Image & Data",
        "description": "Max-Z composite reflectivity, plan position indicator (PPI), and precipitation accumulation images from 35+ Indian radar stations.",
        "endpoints": [
            "/radar",
            "/radar_image",
            "/radar_image?id={radar_station}",
            "/radar_data",
        ],
        "category": "RADAR & Lightning API",
    },
    "lightning": {
        "id": "api-26",
        "name": "Lightning Strike & Thunderstorm Data",
        "description": "Real-time cloud-to-ground lightning stroke count, strike density, and DAMINI lightning detection network data.",
        "endpoints": [
            "/lightning",
            "/lightning_data",
            "/lightning_api",
        ],
        "category": "RADAR & Lightning API",
    },
}
