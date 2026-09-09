from typing import Dict, Any

WMO_CODE_MAP: Dict[int, Dict[str, str]] = {
    0: {"condition": "Clear Sky", "icon": "sun"},
    1: {"condition": "Mainly Clear", "icon": "sun-cloud"},
    2: {"condition": "Partly Cloudy", "icon": "cloud-sun"},
    3: {"condition": "Overcast", "icon": "cloud"},
    45: {"condition": "Fog", "icon": "fog"},
    48: {"condition": "Depositing Rime Fog", "icon": "fog"},
    51: {"condition": "Light Drizzle", "icon": "drizzle"},
    53: {"condition": "Moderate Drizzle", "icon": "drizzle"},
    55: {"condition": "Dense Drizzle", "icon": "drizzle"},
    56: {"condition": "Light Freezing Drizzle", "icon": "drizzle"},
    57: {"condition": "Dense Freezing Drizzle", "icon": "drizzle"},
    61: {"condition": "Slight Rain", "icon": "rain"},
    63: {"condition": "Moderate Rain", "icon": "rain"},
    65: {"condition": "Heavy Rain", "icon": "rain-heavy"},
    66: {"condition": "Freezing Rain", "icon": "rain"},
    67: {"condition": "Heavy Freezing Rain", "icon": "rain-heavy"},
    71: {"condition": "Slight Snow Fall", "icon": "snow"},
    73: {"condition": "Moderate Snow Fall", "icon": "snow"},
    75: {"condition": "Heavy Snow Fall", "icon": "snow"},
    77: {"condition": "Snow Grains", "icon": "snow"},
    80: {"condition": "Slight Rain Showers", "icon": "showers"},
    81: {"condition": "Moderate Rain Showers", "icon": "showers"},
    82: {"condition": "Violent Rain Showers", "icon": "showers"},
    85: {"condition": "Slight Snow Showers", "icon": "snow"},
    86: {"condition": "Heavy Snow Showers", "icon": "snow"},
    95: {"condition": "Thunderstorm", "icon": "thunderstorm"},
    96: {"condition": "Thunderstorm with Hail", "icon": "thunderstorm"},
    99: {"condition": "Heavy Thunderstorm with Hail", "icon": "thunderstorm"},
}

def decode_weather_code(code: int) -> Dict[str, str]:
    """
    Returns condition description and icon identifier for a WMO weather code.
    Fallback to Clear Sky if unknown.
    """
    if code in WMO_CODE_MAP:
        return WMO_CODE_MAP[code]

    # Range fallback matching
    if 51 <= code <= 57:
        return {"condition": "Drizzle", "icon": "drizzle"}
    elif 61 <= code <= 67:
        return {"condition": "Rain", "icon": "rain"}
    elif 71 <= code <= 77:
        return {"condition": "Snow", "icon": "snow"}
    elif 80 <= code <= 82:
        return {"condition": "Rain Showers", "icon": "showers"}
    elif 85 <= code <= 86:
        return {"condition": "Snow Showers", "icon": "snow"}
    elif 95 <= code <= 99:
        return {"condition": "Thunderstorm", "icon": "thunderstorm"}

    return {"condition": "Clear Sky", "icon": "sun"}
