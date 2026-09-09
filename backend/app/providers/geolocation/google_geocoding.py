import httpx
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.providers.geolocation.base import GeocodingProvider

class GoogleGeocodingProvider(GeocodingProvider):
    @property
    def provider_name(self) -> str:
        return "GoogleGeocoding"

    async def _reverse_geocode_nominatim(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        OpenStreetMap Nominatim reverse geocoding fallback when Google API Key is not configured.
        Returns real city, district, state, country metadata for any GPS coordinates.
        """
        url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json"
        headers = {"User-Agent": "WeatherGPT/1.0 (weathergpt-platform)"}
        
        fallback_payload = {
            "latitude": latitude,
            "longitude": longitude,
            "city": None,
            "district": None,
            "state": None,
            "country": None,
            "postal_code": None,
            "formatted_address": None,
            "provider": "NominatimFallback",
            "status": "fallback"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                logger.info(f"[NominatimFallback] Querying Nominatim Reverse Geocoding for lat={latitude}, lng={longitude}")
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    address = data.get("address", {})
                    
                    city = (
                        address.get("city") or
                        address.get("town") or
                        address.get("village") or
                        address.get("suburb") or
                        address.get("municipality") or
                        address.get("county")
                    )
                    district = address.get("state_district") or address.get("county") or city
                    state = address.get("state")
                    country = address.get("country")
                    postal_code = address.get("postcode")
                    formatted_address = data.get("display_name")

                    logger.info(f"[NominatimFallback] Resolved location: city={city}, district={district}, state={state}")

                    return {
                        "latitude": latitude,
                        "longitude": longitude,
                        "city": city,
                        "district": district,
                        "state": state,
                        "country": country,
                        "postal_code": postal_code,
                        "formatted_address": formatted_address,
                        "provider": "NominatimFallback",
                        "status": "success"
                    }
        except Exception as err:
            logger.error(f"[NominatimFallback] Exception during reverse geocoding: {type(err).__name__}: {str(err)}")

        return fallback_payload

    async def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Reverse geocode latitude & longitude via Google Maps Geocoding API.
        If GOOGLE_MAPS_API_KEY is not configured or Google fails, fallback to Nominatim reverse geocode.
        """
        api_key = settings.GOOGLE_MAPS_API_KEY.strip()
        
        if not api_key:
            logger.info("[GoogleGeocodingProvider] GOOGLE_MAPS_API_KEY missing. Using Nominatim reverse geocoding fallback.")
            return await self._reverse_geocode_nominatim(latitude, longitude)

        url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                logger.info(f"[GoogleGeocodingProvider] Querying Google Reverse Geocoding for lat={latitude}, lng={longitude}")
                response = await client.get(url)
                
                if response.status_code != 200:
                    logger.error(f"[GoogleGeocodingProvider] HTTP {response.status_code} from Google API. Falling back to Nominatim.")
                    return await self._reverse_geocode_nominatim(latitude, longitude)

                data = response.json()
                if data.get("status") != "OK" or not data.get("results"):
                    logger.warning(f"[GoogleGeocodingProvider] Google API returned status: {data.get('status')}. Falling back to Nominatim.")
                    return await self._reverse_geocode_nominatim(latitude, longitude)

                # Parse top result
                result = data["results"][0]
                formatted_address = result.get("formatted_address")
                address_components = result.get("address_components", [])

                # Indian Address Component Parsing
                component_map = {}
                for comp in address_components:
                    types = comp.get("types", [])
                    long_name = comp.get("long_name")
                    for t in types:
                        component_map[t] = long_name

                city = (
                    component_map.get("locality") or
                    component_map.get("postal_town") or
                    component_map.get("sublocality_level_1") or
                    component_map.get("administrative_area_level_3")
                )
                district = component_map.get("administrative_area_level_2") or city
                state = component_map.get("administrative_area_level_1")
                country = component_map.get("country")
                postal_code = component_map.get("postal_code")

                normalized = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": city,
                    "district": district,
                    "state": state,
                    "country": country,
                    "postal_code": postal_code,
                    "formatted_address": formatted_address,
                    "provider": self.provider_name,
                    "status": "success"
                }

                logger.info(f"[GoogleGeocodingProvider] Successfully normalized location: city={city}, district={district}, state={state}")
                return normalized

        except Exception as err:
            logger.error(f"[GoogleGeocodingProvider] Exception during reverse geocoding: {type(err).__name__}: {str(err)}")
            return await self._reverse_geocode_nominatim(latitude, longitude)

google_geocoding_provider = GoogleGeocodingProvider()
