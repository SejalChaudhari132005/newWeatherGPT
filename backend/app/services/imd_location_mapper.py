import math
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class IMDLocationMapping:
    station_code: str
    station_name: str
    district: str
    subdivision: str
    state: str
    distance_km: float
    original_latitude: float
    original_longitude: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# Official Major IMD Weather Stations across Indian States & Union Territories
OFFICIAL_IMD_STATIONS: List[Dict[str, Any]] = [
    # Maharashtra
    {"code": "43003", "name": "Mumbai (Santacruz)", "lat": 19.1176, "lon": 72.8561, "district": "Mumbai Suburban", "subdivision": "Konkan & Goa", "state": "Maharashtra"},
    {"code": "43057", "name": "Mumbai (Colaba)", "lat": 18.8987, "lon": 72.8093, "district": "Mumbai City", "subdivision": "Konkan & Goa", "state": "Maharashtra"},
    {"code": "43004", "name": "Thane", "lat": 19.2183, "lon": 72.9781, "district": "Thane", "subdivision": "Konkan & Goa", "state": "Maharashtra"},
    {"code": "43063", "name": "Pune (Shivajinagar)", "lat": 18.5308, "lon": 73.8475, "district": "Pune", "subdivision": "Madhya Maharashtra", "state": "Maharashtra"},
    {"code": "43041", "name": "Ratnagiri", "lat": 16.9902, "lon": 73.3120, "district": "Ratnagiri", "subdivision": "Konkan & Goa", "state": "Maharashtra"},
    {"code": "43150", "name": "Nagpur (Sonegaon)", "lat": 21.0922, "lon": 79.0560, "district": "Nagpur", "subdivision": "Vidarbha", "state": "Maharashtra"},
    {"code": "43087", "name": "Aurangabad (Chhatrapati Sambhajinagar)", "lat": 19.8636, "lon": 75.3980, "district": "Aurangabad", "subdivision": "Marathwada", "state": "Maharashtra"},
    {"code": "43075", "name": "Nashik", "lat": 19.9635, "lon": 73.8055, "district": "Nashik", "subdivision": "Madhya Maharashtra", "state": "Maharashtra"},
    {"code": "43110", "name": "Kolhapur", "lat": 16.6975, "lon": 74.2255, "district": "Kolhapur", "subdivision": "Madhya Maharashtra", "state": "Maharashtra"},
    {"code": "43111", "name": "Solapur", "lat": 17.6599, "lon": 75.9064, "district": "Solapur", "subdivision": "Madhya Maharashtra", "state": "Maharashtra"},
    {"code": "43014", "name": "Panaji (Goa)", "lat": 15.4909, "lon": 73.8278, "district": "North Goa", "subdivision": "Konkan & Goa", "state": "Goa"},

    # Delhi NCR & North
    {"code": "42182", "name": "New Delhi (Safdarjung)", "lat": 28.5840, "lon": 77.2060, "district": "New Delhi", "subdivision": "Haryana Chandigarh & Delhi", "state": "Delhi"},
    {"code": "42181", "name": "New Delhi (Palam)", "lat": 28.5630, "lon": 77.1190, "district": "South West Delhi", "subdivision": "Haryana Chandigarh & Delhi", "state": "Delhi"},
    {"code": "42140", "name": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "district": "Chandigarh", "subdivision": "Punjab", "state": "Chandigarh"},
    {"code": "42101", "name": "Shimla", "lat": 31.1048, "lon": 77.1734, "district": "Shimla", "subdivision": "Himachal Pradesh", "state": "Himachal Pradesh"},
    {"code": "42027", "name": "Srinagar", "lat": 34.0837, "lon": 74.7973, "district": "Srinagar", "subdivision": "Jammu & Kashmir and Ladakh", "state": "Jammu and Kashmir"},
    {"code": "42054", "name": "Jammu", "lat": 32.7266, "lon": 74.8570, "district": "Jammu", "subdivision": "Jammu & Kashmir and Ladakh", "state": "Jammu and Kashmir"},
    {"code": "42111", "name": "Dehradun", "lat": 30.3165, "lon": 78.0322, "district": "Dehradun", "subdivision": "Uttarakhand", "state": "Uttarakhand"},
    {"code": "42131", "name": "Amritsar", "lat": 31.6340, "lon": 74.8723, "district": "Amritsar", "subdivision": "Punjab", "state": "Punjab"},
    {"code": "42170", "name": "Ambala", "lat": 30.3782, "lon": 76.7767, "district": "Ambala", "subdivision": "Haryana Chandigarh & Delhi", "state": "Haryana"},

    # Uttar Pradesh & Bihar
    {"code": "42189", "name": "Lucknow (Amausi)", "lat": 26.7606, "lon": 80.8893, "district": "Lucknow", "subdivision": "East Uttar Pradesh", "state": "Uttar Pradesh"},
    {"code": "42754", "name": "Varanasi (Babatpur)", "lat": 25.4516, "lon": 82.8593, "district": "Varanasi", "subdivision": "East Uttar Pradesh", "state": "Uttar Pradesh"},
    {"code": "42369", "name": "Agra", "lat": 27.1767, "lon": 78.0081, "district": "Agra", "subdivision": "West Uttar Pradesh", "state": "Uttar Pradesh"},
    {"code": "42475", "name": "Prayagraj (Allahabad)", "lat": 25.4358, "lon": 81.8463, "district": "Prayagraj", "subdivision": "East Uttar Pradesh", "state": "Uttar Pradesh"},
    {"code": "42492", "name": "Patna", "lat": 25.5941, "lon": 85.1376, "district": "Patna", "subdivision": "Bihar", "state": "Bihar"},
    {"code": "42591", "name": "Gaya", "lat": 24.7955, "lon": 85.0002, "district": "Gaya", "subdivision": "Bihar", "state": "Bihar"},

    # West Bengal & East & Northeast
    {"code": "42809", "name": "Kolkata (Alipore)", "lat": 22.5326, "lon": 88.3262, "district": "Kolkata", "subdivision": "Gangetic West Bengal", "state": "West Bengal"},
    {"code": "42807", "name": "Kolkata (Dum Dum)", "lat": 22.6547, "lon": 88.4467, "district": "North 24 Parganas", "subdivision": "Gangetic West Bengal", "state": "West Bengal"},
    {"code": "42701", "name": "Ranchi", "lat": 23.3441, "lon": 85.3096, "district": "Ranchi", "subdivision": "Jharkhand", "state": "Jharkhand"},
    {"code": "42909", "name": "Bhubaneswar", "lat": 20.2961, "lon": 85.8245, "district": "Khurda", "subdivision": "Odisha", "state": "Odisha"},
    {"code": "42410", "name": "Guwahati (Borjhar)", "lat": 26.1061, "lon": 91.5859, "district": "Kamrup Metropolitan", "subdivision": "Assam & Meghalaya", "state": "Assam"},
    {"code": "42406", "name": "Shillong", "lat": 25.5788, "lon": 91.8933, "district": "East Khasi Hills", "subdivision": "Assam & Meghalaya", "state": "Meghalaya"},
    {"code": "42308", "name": "Siliguri", "lat": 26.7271, "lon": 88.3953, "district": "Darjeeling", "subdivision": "Sub-Himalayan West Bengal & Sikkim", "state": "West Bengal"},

    # Gujarat & Rajasthan & Central
    {"code": "42647", "name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "district": "Ahmedabad", "subdivision": "Gujarat Region", "state": "Gujarat"},
    {"code": "42821", "name": "Surat", "lat": 21.1702, "lon": 72.8311, "district": "Surat", "subdivision": "Gujarat Region", "state": "Gujarat"},
    {"code": "42737", "name": "Rajkot", "lat": 22.3039, "lon": 70.8022, "district": "Rajkot", "subdivision": "Saurashtra & Kutch", "state": "Gujarat"},
    {"code": "42348", "name": "Jaipur (Sanganer)", "lat": 26.8242, "lon": 75.8122, "district": "Jaipur", "subdivision": "East Rajasthan", "state": "Rajasthan"},
    {"code": "42339", "name": "Jodhpur", "lat": 26.2389, "lon": 73.0243, "district": "Jodhpur", "subdivision": "West Rajasthan", "state": "Rajasthan"},
    {"code": "42671", "name": "Bhopal (Bairagarh)", "lat": 23.2872, "lon": 77.3486, "district": "Bhopal", "subdivision": "West Madhya Pradesh", "state": "Madhya Pradesh"},
    {"code": "42782", "name": "Indore", "lat": 22.7196, "lon": 75.8577, "district": "Indore", "subdivision": "West Madhya Pradesh", "state": "Madhya Pradesh"},
    {"code": "42898", "name": "Raipur", "lat": 21.2514, "lon": 81.6296, "district": "Raipur", "subdivision": "Chhattisgarh", "state": "Chhattisgarh"},

    # South India
    {"code": "43295", "name": "Bengaluru (HAL Airport)", "lat": 12.9498, "lon": 77.6681, "district": "Bengaluru Urban", "subdivision": "South Interior Karnataka", "state": "Karnataka"},
    {"code": "43279", "name": "Chennai (Meenambakkam)", "lat": 12.9941, "lon": 80.1809, "district": "Chennai", "subdivision": "Tamil Nadu Puducherry & Karaikal", "state": "Tamil Nadu"},
    {"code": "43285", "name": "Chennai (Nungambakkam)", "lat": 13.0626, "lon": 80.2443, "district": "Chennai", "subdivision": "Tamil Nadu Puducherry & Karaikal", "state": "Tamil Nadu"},
    {"code": "43128", "name": "Hyderabad (Begumpet)", "lat": 17.4531, "lon": 78.4677, "district": "Hyderabad", "subdivision": "Telangana", "state": "Telangana"},
    {"code": "43189", "name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185, "district": "Visakhapatnam", "subdivision": "Coastal Andhra Pradesh & Yanam", "state": "Andhra Pradesh"},
    {"code": "43245", "name": "Vijayawada (Gannavaram)", "lat": 16.5304, "lon": 80.7968, "district": "Krishna", "subdivision": "Coastal Andhra Pradesh & Yanam", "state": "Andhra Pradesh"},
    {"code": "43353", "name": "Thiruvananthapuram", "lat": 8.5241, "lon": 76.9366, "district": "Thiruvananthapuram", "subdivision": "Kerala & Mahe", "state": "Kerala"},
    {"code": "43314", "name": "Kochi (Nedumbassery)", "lat": 10.1556, "lon": 76.3905, "district": "Ernakulam", "subdivision": "Kerala & Mahe", "state": "Kerala"},
    {"code": "43241", "name": "Mangaluru (Bajpe)", "lat": 12.9612, "lon": 74.8900, "district": "Dakshina Kannada", "subdivision": "Coastal Karnataka", "state": "Karnataka"},
    {"code": "43371", "name": "Coimbatore", "lat": 11.0168, "lon": 76.9558, "district": "Coimbatore", "subdivision": "Tamil Nadu Puducherry & Karaikal", "state": "Tamil Nadu"},
    {"code": "43333", "name": "Madurai", "lat": 9.9252, "lon": 78.1198, "district": "Madurai", "subdivision": "Tamil Nadu Puducherry & Karaikal", "state": "Tamil Nadu"},

    # Island Territories
    {"code": "43330", "name": "Port Blair", "lat": 11.6234, "lon": 92.7265, "district": "South Andaman", "subdivision": "Andaman & Nicobar Islands", "state": "Andaman and Nicobar Islands"},
    {"code": "43369", "name": "Minicoy", "lat": 8.2833, "lon": 73.0500, "district": "Lakshadweep", "subdivision": "Lakshadweep", "state": "Lakshadweep"},
]

class IMDLocationMapper:
    """
    Service to map exact GPS coordinates (latitude, longitude)
    to the nearest official IMD weather station, administrative district,
    and meteorological subdivision.
    
    Coordinates remain the source of truth for all calculations.
    """

    def map_coordinates_to_imd(
        self,
        latitude: float,
        longitude: float,
        city_hint: Optional[str] = None,
        district_hint: Optional[str] = None,
        state_hint: Optional[str] = None
    ) -> IMDLocationMapping:
        """
        Find nearest IMD station by calculating Haversine distance,
        leveraging location hints when available for administrative boundary precision.
        """
        best_station: Optional[Dict[str, Any]] = None
        min_distance = float("inf")

        for station in OFFICIAL_IMD_STATIONS:
            dist = haversine_distance_km(latitude, longitude, station["lat"], station["lon"])
            if dist < min_distance:
                min_distance = dist
                best_station = station

        # Fallback if no station found (default safe fallback)
        if not best_station:
            best_station = OFFICIAL_IMD_STATIONS[0]
            min_distance = haversine_distance_km(latitude, longitude, best_station["lat"], best_station["lon"])

        # Determine district and state, prioritizing user metadata if valid
        effective_district = district_hint or city_hint or best_station["district"]
        effective_state = state_hint or best_station["state"]
        effective_subdivision = best_station["subdivision"]

        return IMDLocationMapping(
            station_code=best_station["code"],
            station_name=best_station["name"],
            district=effective_district,
            subdivision=effective_subdivision,
            state=effective_state,
            distance_km=round(min_distance, 2),
            original_latitude=latitude,
            original_longitude=longitude
        )

imd_location_mapper = IMDLocationMapper()
