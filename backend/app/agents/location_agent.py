from typing import Dict, Any, Optional
from backend.app.agents.base_agent import BaseAgent
from backend.app.services.location_service import location_service

class LocationAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "LocationAgent"

    @property
    def description(self) -> str:
        return "Handles geolocation resolution, reverse geocoding, and place search."

    async def resolve_location(self, latitude: float, longitude: float, source: str = "gps") -> Dict[str, Any]:
        """Resolve exact coordinates into normalized location."""
        return await location_service.reverse_geocode(latitude, longitude, source=source)

    async def search_location(self, query: str) -> Dict[str, Any]:
        """Search location results by text query."""
        results = await location_service.search_location(query)
        return {"query": query, "results": results}

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ctx = context or {}
        if "latitude" in ctx and "longitude" in ctx:
            return await self.resolve_location(
                latitude=float(ctx["latitude"]),
                longitude=float(ctx["longitude"]),
                source=ctx.get("source", "gps")
            )
        return await self.search_location(query)

location_agent = LocationAgent()
