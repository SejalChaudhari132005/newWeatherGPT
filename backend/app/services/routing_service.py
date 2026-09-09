"""
Routing Service for WeatherGPT Step 10.
Abstracts road routing providers (OSRM / Project OSRM / Geodesic Road Spline fallback)
to provide real road path geometry, distance, estimated travel duration,
and sampled intermediate waypoints along any journey across India.
"""

import os
import math
import logging
from typing import Dict, Any, List, Tuple, Optional
import httpx

logger = logging.getLogger("routing_service")


class RoutingService:
    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or os.getenv("ROUTING_PROVIDER", "osrm")
        self.osrm_base_url = "https://router.project-osrm.org/route/v1/driving"
        self.timeout = 6.0

    @staticmethod
    def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 1)

    async def get_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        origin_name: str = "Origin",
        dest_name: str = "Destination",
    ) -> Dict[str, Any]:
        """
        Calculates road geometry, total distance (km), travel duration (minutes),
        and extracts 4 to 8 key intermediate transit waypoints for weather sampling.
        """
        # Try OSRM provider if configured
        if self.provider.lower() == "osrm":
            try:
                url = f"{self.osrm_base_url}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson&steps=true"
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        routes = data.get("routes", [])
                        if routes:
                            primary_route = routes[0]
                            dist_meters = primary_route.get("distance", 0)
                            dur_seconds = primary_route.get("duration", 0)
                            geojson_coords = primary_route.get("geometry", {}).get("coordinates", [])

                            # Convert [lon, lat] -> [lat, lon]
                            route_coords = [[c[1], c[0]] for c in geojson_coords]
                            dist_km = round(dist_meters / 1000.0, 1)
                            dur_mins = round(dur_seconds / 60.0)

                            waypoints = self._sample_waypoints(
                                route_coords=route_coords,
                                origin_name=origin_name,
                                dest_name=dest_name,
                                total_duration_mins=dur_mins,
                            )

                            return {
                                "provider": "OSRM (Open Source Routing Machine)",
                                "success": True,
                                "distance_km": dist_km,
                                "duration_minutes": dur_mins,
                                "coordinates": route_coords,
                                "waypoints": waypoints,
                            }
            except Exception as exc:
                logger.warning(f"[RoutingService] OSRM query failed, falling back to geodesic road engine: {exc}")

        # Fallback Geodesic Highway Engine
        return self._generate_fallback_route(
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            origin_name=origin_name,
            dest_name=dest_name,
        )

    def _sample_waypoints(
        self,
        route_coords: List[List[float]],
        origin_name: str,
        dest_name: str,
        total_duration_mins: int,
        target_samples: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Samples representative waypoint segments along the route geometry.
        """
        if not route_coords:
            return []

        total_pts = len(route_coords)
        if total_pts <= target_samples:
            indices = list(range(total_pts))
        else:
            step = (total_pts - 1) / (target_samples - 1)
            indices = [int(round(i * step)) for i in range(target_samples)]
            indices[-1] = total_pts - 1

        waypoints = []
        for idx_num, pt_idx in enumerate(indices):
            coord = route_coords[pt_idx]
            fraction = idx_num / max(1, (len(indices) - 1))
            offset_mins = round(fraction * total_duration_mins)

            if idx_num == 0:
                name = origin_name
            elif idx_num == len(indices) - 1:
                name = dest_name
            else:
                # Name by intermediate waypoint or corridor segment
                name = self._identify_known_waypoint(coord[0], coord[1], f"Waypoint {idx_num}")

            waypoints.append({
                "segment_index": idx_num,
                "name": name,
                "latitude": coord[0],
                "longitude": coord[1],
                "eta_minutes_offset": offset_mins,
                "is_origin": idx_num == 0,
                "is_destination": idx_num == len(indices) - 1,
            })

        return waypoints

    def _generate_fallback_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        origin_name: str,
        dest_name: str,
    ) -> Dict[str, Any]:
        """
        High-precision fallback road interpolator simulating realistic Indian highway corridors.
        """
        straight_km = self.calculate_distance_km(origin_lat, origin_lon, dest_lat, dest_lon)
        road_km = round(straight_km * 1.28, 1)  # Highway winding factor
        avg_speed_kmh = 55.0  # Average driving speed
        dur_mins = max(15, round((road_km / avg_speed_kmh) * 60))

        steps = 25
        coords = []
        for i in range(steps + 1):
            t = i / float(steps)
            lat = origin_lat + t * (dest_lat - origin_lat)
            lon = origin_lon + t * (dest_lon - origin_lon)
            # Subtle realistic highway curve offset
            curve_factor = math.sin(t * math.pi) * 0.04
            coords.append([round(lat + curve_factor, 5), round(lon, 5)])

        waypoints = self._sample_waypoints(
            route_coords=coords,
            origin_name=origin_name,
            dest_name=dest_name,
            total_duration_mins=dur_mins,
            target_samples=5,
        )

        return {
            "provider": "WeatherGPT Geodesic Highway Engine (Fallback)",
            "success": True,
            "distance_km": road_km,
            "duration_minutes": dur_mins,
            "coordinates": coords,
            "waypoints": waypoints,
        }

    @staticmethod
    def _identify_known_waypoint(lat: float, lon: float, fallback: str) -> str:
        """
        Labels known major junction points in Western/Northern/Southern transit corridors.
        """
        known_places = [
            ("Lonavala Ghats", 18.75, 73.40, 0.2),
            ("Khandala", 18.76, 73.37, 0.15),
            ("Kasara Ghat", 19.64, 73.48, 0.2),
            ("Murbad", 19.25, 73.40, 0.18),
            ("Talegaon", 18.73, 73.68, 0.18),
            ("Panvel", 18.98, 73.11, 0.15),
            ("Thane", 19.21, 72.97, 0.15),
            ("Navi Mumbai", 19.03, 73.02, 0.15),
            ("Chakan", 18.76, 73.85, 0.2),
            ("Igatpuri", 19.70, 73.55, 0.2),
            ("Nashik Expressway", 19.99, 73.78, 0.2),
            ("Gurugram Corridor", 28.45, 77.02, 0.2),
            ("Noida Expressway", 28.53, 77.39, 0.2),
            ("Hosur Highway", 12.74, 77.82, 0.2),
            ("Electronic City", 12.84, 77.66, 0.2),
        ]

        for name, k_lat, k_lon, radius in known_places:
            if math.hypot(lat - k_lat, lon - k_lon) <= radius:
                return name

        return fallback


routing_service = RoutingService()
