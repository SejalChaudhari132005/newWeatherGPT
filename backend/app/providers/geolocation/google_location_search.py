import httpx
import unicodedata
from typing import List, Dict, Any
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.providers.geolocation.base import LocationSearchProvider

INDIAN_STATES_UTS: Dict[str, Dict[str, Any]] = {
    "andhra pradesh": {"name": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480, "capital": "Amaravati", "district": "Amaravati"},
    "arunachal pradesh": {"name": "Arunachal Pradesh", "lat": 27.0844, "lon": 93.6053, "capital": "Itanagar", "district": "Papum Pare"},
    "assam": {"name": "Assam", "lat": 26.1445, "lon": 91.7362, "capital": "Guwahati", "district": "Kamrup Metropolitan"},
    "bihar": {"name": "Bihar", "lat": 25.5941, "lon": 85.1376, "capital": "Patna", "district": "Patna"},
    "chhattisgarh": {"name": "Chhattisgarh", "lat": 21.2514, "lon": 81.6296, "capital": "Raipur", "district": "Raipur"},
    "goa": {"name": "Goa", "lat": 15.4909, "lon": 73.8278, "capital": "Panaji", "district": "North Goa"},
    "gujarat": {"name": "Gujarat", "lat": 23.2156, "lon": 72.6369, "capital": "Gandhinagar", "district": "Gandhinagar"},
    "haryana": {"name": "Haryana", "lat": 30.7333, "lon": 76.7794, "capital": "Chandigarh", "district": "Chandigarh"},
    "himachal pradesh": {"name": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734, "capital": "Shimla", "district": "Shimla"},
    "jharkhand": {"name": "Jharkhand", "lat": 23.3441, "lon": 85.3096, "capital": "Ranchi", "district": "Ranchi"},
    "karnataka": {"name": "Karnataka", "lat": 12.9716, "lon": 77.5946, "capital": "Bengaluru", "district": "Bengaluru Urban"},
    "kerala": {"name": "Kerala", "lat": 8.5241, "lon": 76.9366, "capital": "Thiruvananthapuram", "district": "Thiruvananthapuram"},
    "madhya pradesh": {"name": "Madhya Pradesh", "lat": 23.2599, "lon": 77.4126, "capital": "Bhopal", "district": "Bhopal"},
    "maharashtra": {"name": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "capital": "Mumbai", "district": "Mumbai City"},
    "manipur": {"name": "Manipur", "lat": 24.8170, "lon": 93.9368, "capital": "Imphal", "district": "Imphal West"},
    "meghalaya": {"name": "Meghalaya", "lat": 25.5788, "lon": 91.8933, "capital": "Shillong", "district": "East Khasi Hills"},
    "mizoram": {"name": "Mizoram", "lat": 23.7271, "lon": 92.7176, "capital": "Aizawl", "district": "Aizawl"},
    "nagaland": {"name": "Nagaland", "lat": 25.6751, "lon": 94.1086, "capital": "Kohima", "district": "Kohima"},
    "odisha": {"name": "Odisha", "lat": 20.2961, "lon": 85.8245, "capital": "Bhubaneswar", "district": "Khurda"},
    "punjab": {"name": "Punjab", "lat": 30.7333, "lon": 76.7794, "capital": "Chandigarh", "district": "Chandigarh"},
    "rajasthan": {"name": "Rajasthan", "lat": 26.9124, "lon": 75.7873, "capital": "Jaipur", "district": "Jaipur"},
    "sikkim": {"name": "Sikkim", "lat": 27.3389, "lon": 88.6065, "capital": "Gangtok", "district": "East Sikkim"},
    "tamil nadu": {"name": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "capital": "Chennai", "district": "Chennai"},
    "telangana": {"name": "Telangana", "lat": 17.3850, "lon": 78.4867, "capital": "Hyderabad", "district": "Hyderabad"},
    "tripura": {"name": "Tripura", "lat": 23.8315, "lon": 91.2868, "capital": "Agartala", "district": "West Tripura"},
    "uttar pradesh": {"name": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462, "capital": "Lucknow", "district": "Lucknow"},
    "uttarakhand": {"name": "Uttarakhand", "lat": 30.3165, "lon": 78.0322, "capital": "Dehradun", "district": "Dehradun"},
    "west bengal": {"name": "West Bengal", "lat": 22.5726, "lon": 88.3639, "capital": "Kolkata", "district": "Kolkata"},
    "delhi": {"name": "Delhi", "lat": 28.6139, "lon": 77.2090, "capital": "New Delhi", "district": "New Delhi"},
    "jammu and kashmir": {"name": "Jammu and Kashmir", "lat": 34.0837, "lon": 74.7973, "capital": "Srinagar", "district": "Srinagar"},
    "ladakh": {"name": "Ladakh", "lat": 34.1526, "lon": 77.5771, "capital": "Leh", "district": "Leh"},
    "chandigarh": {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "capital": "Chandigarh", "district": "Chandigarh"},
    "puducherry": {"name": "Puducherry", "lat": 11.9416, "lon": 79.8083, "capital": "Puducherry", "district": "Puducherry"},
    "andaman and nicobar": {"name": "Andaman and Nicobar Islands", "lat": 11.6234, "lon": 92.7265, "capital": "Port Blair", "district": "South Andaman"},
    "lakshadweep": {"name": "Lakshadweep", "lat": 10.5667, "lon": 72.6417, "capital": "Kavaratti", "district": "Lakshadweep"},
    "daman and diu": {"name": "Dadra & Nagar Haveli and Daman & Diu", "lat": 20.3974, "lon": 72.8328, "capital": "Daman", "district": "Daman"}
}

def clean_unicode(text: Any) -> str:
    if not text:
        return ""
    try:
        normalized = unicodedata.normalize('NFKD', str(text))
        return normalized.encode('ascii', 'ignore').decode('ascii').strip()
    except Exception:
        return str(text).strip()

class GoogleLocationSearchProvider(LocationSearchProvider):
    @property
    def provider_name(self) -> str:
        return "GoogleLocationSearch"

    async def _search_open_meteo(self, query: str) -> List[Dict[str, Any]]:
        """
        Ultra-fast Open-Meteo Geocoding for any global city, village, town, district, state.
        """
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": query,
            "count": 12,
            "language": "en",
            "format": "json"
        }
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for item in data.get("results", []):
                        name = clean_unicode(item.get("name"))
                        admin1 = clean_unicode(item.get("admin1"))
                        admin2 = clean_unicode(item.get("admin2"))
                        country = clean_unicode(item.get("country", "India"))
                        lat = float(item.get("latitude", 0.0))
                        lon = float(item.get("longitude", 0.0))

                        display_parts = [name]
                        if admin2 and admin2 != name:
                            display_parts.append(admin2)
                        if admin1 and admin1 != admin2:
                            display_parts.append(admin1)
                        if country and country != admin1:
                            display_parts.append(country)

                        display_name = ", ".join(display_parts)
                        city = name
                        district = admin2 or admin1 or name
                        state = admin1 or ""

                        results.append({
                            "display_name": display_name,
                            "latitude": lat,
                            "longitude": lon,
                            "city": city,
                            "district": district,
                            "state": state,
                            "country": country,
                            "postal_code": None,
                            "source": "manual"
                        })
                    return results
        except Exception as e:
            logger.warning(f"[OpenMeteoGeocoding] Search warning for '{query}': {e}")
        return []

    async def _search_nominatim(self, query: str) -> List[Dict[str, Any]]:
        """
        OpenStreetMap Nominatim place search fallback.
        """
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "limit": 8,
            "countrycodes": "in"
        }
        headers = {"User-Agent": "WeatherGPT/1.0 (weathergpt-platform)"}

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    results = []
                    for item in data:
                        lat = float(item["lat"])
                        lon = float(item["lon"])
                        address = item.get("address", {})
                        
                        city = (
                            address.get("city") or
                            address.get("town") or
                            address.get("village") or
                            address.get("suburb") or
                            address.get("municipality") or
                            address.get("state") or
                            query.capitalize()
                        )
                        district = address.get("state_district") or address.get("county") or address.get("state") or city
                        state = address.get("state") or ""
                        country = address.get("country") or "India"
                        postal_code = address.get("postcode")
                        display_name = item.get("display_name", "")

                        results.append({
                            "display_name": display_name,
                            "latitude": lat,
                            "longitude": lon,
                            "city": clean_unicode(city),
                            "district": clean_unicode(district),
                            "state": clean_unicode(state),
                            "country": clean_unicode(country),
                            "postal_code": postal_code,
                            "source": "manual"
                        })
                    return results
        except Exception as err:
            logger.warning(f"[NominatimSearchFallback] Exception during search: {type(err).__name__}: {str(err)}")
            return []

    async def search_location(self, query: str) -> List[Dict[str, Any]]:
        """
        Search location/city/town/village/state/PIN code via State Resolver, Open-Meteo, Google Geocoding, and Nominatim.
        """
        q = query.strip()
        if not q:
            return []

        results: List[Dict[str, Any]] = []
        seen_coords = set()

        def add_result(res: Dict[str, Any], prioritize: bool = False):
            key = (round(res["latitude"], 3), round(res["longitude"], 3))
            if key not in seen_coords:
                seen_coords.add(key)
                if prioritize:
                    results.insert(0, res)
                else:
                    results.append(res)

        # 1. State / Union Territory Pre-indexed Match (Instant)
        q_lower = q.lower()
        for state_key, state_data in INDIAN_STATES_UTS.items():
            if state_key == q_lower or state_key.startswith(q_lower):
                add_result({
                    "display_name": f"{state_data['name']}, India",
                    "latitude": state_data["lat"],
                    "longitude": state_data["lon"],
                    "city": state_data["name"],
                    "district": state_data["district"],
                    "state": state_data["name"],
                    "country": "India",
                    "postal_code": None,
                    "source": "manual"
                }, prioritize=True)

        # 2. Google Maps API if key configured
        api_key = settings.GOOGLE_MAPS_API_KEY.strip()
        if api_key:
            try:
                search_query = q if "india" in q.lower() else f"{q}, India"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": search_query, "key": api_key})
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == "OK" and data.get("results"):
                            for res in data["results"][:8]:
                                geometry = res.get("geometry", {}).get("location", {})
                                lat = geometry.get("lat")
                                lng = geometry.get("lng")
                                if lat is not None and lng is not None:
                                    components = res.get("address_components", [])
                                    comp_map = {t: c["long_name"] for c in components for t in c.get("types", [])}
                                    city = (
                                        comp_map.get("locality") or
                                        comp_map.get("postal_town") or
                                        comp_map.get("sublocality_level_1") or
                                        comp_map.get("administrative_area_level_1") or
                                        q.capitalize()
                                    )
                                    district = comp_map.get("administrative_area_level_2") or comp_map.get("administrative_area_level_1") or city
                                    state = comp_map.get("administrative_area_level_1") or ""
                                    country = comp_map.get("country") or "India"
                                    postal_code = comp_map.get("postal_code")
                                    add_result({
                                        "display_name": res.get("formatted_address", f"{city}, {state}"),
                                        "latitude": lat,
                                        "longitude": lng,
                                        "city": clean_unicode(city),
                                        "district": clean_unicode(district),
                                        "state": clean_unicode(state),
                                        "country": clean_unicode(country),
                                        "postal_code": postal_code,
                                        "source": "manual"
                                    })
            except Exception as err:
                logger.warning(f"[GoogleLocationSearchProvider] Google Geocode error: {err}")

        # 3. Open-Meteo Global Geocoding (Lightning fast <100ms)
        om_results = await self._search_open_meteo(q)
        for r in om_results:
            add_result(r)

        # 4. If still no results, fallback to Nominatim
        if not results:
            nom_results = await self._search_nominatim(q)
            for r in nom_results:
                add_result(r)

        return results[:15]

google_location_search_provider = GoogleLocationSearchProvider()
