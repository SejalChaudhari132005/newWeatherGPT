"""
Lightweight Internal Event Bus & Ingestion Pipeline for WeatherGPT
WIS2.0-Compatible Event Processing & Normalization Layer
"""

import asyncio
import logging
import random
from collections import deque
from datetime import datetime
from typing import Callable, List, Dict, Any, Optional, Set

from backend.app.schemas.weather_events import (
    BaseWeatherEvent,
    EventType,
    EventSeverity,
    EventLocation,
    DemoPublishEventRequest,
)
from backend.app.services.websocket_manager import websocket_manager

logger = logging.getLogger("event_bus")


class EventBus:
    def __init__(self, max_history: int = 100):
        self.subscribers: List[Callable[[Dict[str, Any]], Any]] = []
        self.recent_events: deque = deque(maxlen=max_history)
        self.processed_event_ids: Set[str] = set()
        self._demo_task: Optional[asyncio.Task] = None
        self.is_demo_stream_active: bool = False

        # Register default WebSocket broadcast subscriber
        self.subscribe(websocket_manager.broadcast)

    def subscribe(self, callback: Callable[[Dict[str, Any]], Any]):
        """Subscribe a handler callback to the event bus."""
        if callback not in self.subscribers:
            self.subscribers.append(callback)
            logger.info(f"[EVENT_BUS] Registered subscriber: {callback}")

    def is_duplicate(self, event_id: str) -> bool:
        """Check if event has already been processed to prevent duplicate alerts."""
        return event_id in self.processed_event_ids

    async def publish(self, event: BaseWeatherEvent) -> bool:
        """
        Ingest, validate, normalize, and broadcast a weather event.
        """
        if self.is_duplicate(event.eventId):
            logger.warning(f"[EVENT_BUS] Duplicate event ignored: {event.eventId}")
            return False

        # Record received timestamp for low-latency tracing
        event.receivedTimestamp = datetime.now().isoformat()
        self.processed_event_ids.add(event.eventId)

        # Cap processed IDs cache size to prevent unbounded memory growth
        if len(self.processed_event_ids) > 1000:
            self.processed_event_ids = set(list(self.processed_event_ids)[-500:])

        payload = event.model_dump()
        self.recent_events.appendleft(payload)

        logger.info(f"[EVENT_BUS] Published event: {event.eventType} - {event.title} (ID: {event.eventId})")

        # Deliver to all subscribers (WebSocket, notification workers, etc.)
        for subscriber in self.subscribers:
            try:
                res = subscriber(payload)
                if asyncio.iscoroutine(res):
                    await res
            except Exception as e:
                logger.error(f"[EVENT_BUS] Error executing subscriber {subscriber}: {e}")

        return True

    async def publish_demo_event(self, req: DemoPublishEventRequest) -> Dict[str, Any]:
        """Publish a structured demonstration event with appropriate role tags."""
        event_id = f"demo-{int(datetime.now().timestamp() * 1000)}"

        # Determine target personas based on event type if not provided
        roles = req.targetRoles
        if not roles:
            if req.eventType == EventType.MARINE_WARNING:
                roles = ["fisherman", "disaster_manager", "researcher"]
            elif req.eventType == EventType.AVIATION_ALERT:
                roles = ["aviation", "disaster_manager", "researcher"]
            elif req.eventType == EventType.AGRICULTURE_ALERT:
                roles = ["farmer", "citizen", "researcher"]
            elif req.eventType == EventType.NWP_UPDATE:
                roles = ["researcher"]
            elif req.eventType == EventType.RADAR_UPDATE:
                roles = ["researcher", "aviation", "disaster_manager", "citizen", "farmer"]
            else:
                roles = ["citizen", "farmer", "fisherman", "aviation", "disaster_manager", "urban_planner", "researcher"]

        event = BaseWeatherEvent(
            eventType=req.eventType,
            eventId=event_id,
            source=req.source or "DEMO_SIMULATOR",
            timestamp=datetime.now().isoformat(),
            is_demo=True,
            severity=req.severity,
            title=req.title,
            message=req.message,
            location=req.location or EventLocation(lat=19.0760, lon=72.8777, name="Mumbai", district="Mumbai", state="Maharashtra"),
            targetRoles=roles,
            data=req.data or {},
        )

        success = await self.publish(event)
        return {
            "success": success,
            "eventId": event.eventId,
            "eventType": event.eventType,
            "title": event.title,
            "targetRoles": event.targetRoles,
            "timestamp": event.timestamp,
        }

    def get_recent_events(
        self,
        limit: int = 50,
        event_type: Optional[str] = None,
        role: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve recent events with filtering options."""
        events = list(self.recent_events)

        if event_type:
            events = [e for e in events if e.get("eventType") == event_type]

        if role:
            role_norm = role.lower()
            events = [
                e for e in events
                if "targetRoles" not in e or not e["targetRoles"] or role_norm in [r.lower() for r in e["targetRoles"]]
            ]

        return events[:limit]

    # Automated Background Simulation Stream
    async def _run_demo_stream(self):
        """Background coroutine that periodically generates realistic meteorological demo events."""
        logger.info("[EVENT_BUS] Starting automatic background demonstration stream (35s interval)")
        sim_scenarios = [
            {
                "eventType": EventType.WEATHER_OBSERVATION,
                "severity": EventSeverity.INFO,
                "title": "Synoptic Met Observatory Observation",
                "message": "Mumbai AWS recorded 31.2°C, 82% Humidity, 1007.8 hPa pressure with 18 km/h SW wind vectors.",
                "location": EventLocation(lat=18.98, lon=72.83, name="Mumbai Colaba Met Station", district="Mumbai", state="Maharashtra"),
                "data": {"temp": 31.2, "humidity": 82, "windSpeed": 18, "pressure": 1007.8, "rain1h": 8.5},
            },
            {
                "eventType": EventType.RADAR_UPDATE,
                "severity": EventSeverity.YELLOW,
                "title": "IMD Doppler Radar Frame Refresh",
                "message": "Max-Z Reflectivity frame updated: 48 dBZ convective core tracking towards Mumbai Metropolitan Region.",
                "location": EventLocation(lat=18.98, lon=72.83, name="Mumbai Radar Station", district="Mumbai", state="Maharashtra"),
                "data": {"radarStation": "Mumbai DWR", "peakReflectivity": "48 dBZ", "scanMode": "Volume Scan VCP-21"},
            },
            {
                "eventType": EventType.WEATHER_ALERT,
                "severity": EventSeverity.ORANGE,
                "title": "Severe Rain & Convective Squall Alert",
                "message": "Intense thunderstorms with localized heavy rain (>50 mm/2h) and gusty winds up to 45 km/h expected.",
                "location": EventLocation(lat=18.98, lon=72.83, name="Mumbai Coastal Belt", district="Mumbai", state="Maharashtra"),
                "data": {"alertCode": "MET-RAIN-0913", "rainRateMmHr": 42.0},
            },
            {
                "eventType": EventType.MARINE_WARNING,
                "severity": EventSeverity.RED,
                "title": "High Wave & Rough Sea Advisory",
                "message": "INCOIS Bulletin: Squally wind speed reaching 45–55 km/h with swell wave height 3.2m. Fishermen advised not to venture into sea.",
                "location": EventLocation(lat=18.90, lon=72.75, name="Maharashtra Coastal Waters", district="Mumbai", state="Maharashtra"),
                "data": {"waveHeightM": 3.2, "swellPeriodS": 9.5, "windGustsKmh": 55},
            },
            {
                "eventType": EventType.NWP_UPDATE,
                "severity": EventSeverity.INFO,
                "title": "NWP Model Run Consensus Refresh",
                "message": "06:00 UTC IMD/WRF and GFS ensemble runs converged on 75% rainfall probability with 4% multi-model spread.",
                "location": EventLocation(lat=18.98, lon=72.83, name="West Coast Met Grid", district="Mumbai", state="Maharashtra"),
                "data": {"gfsRun": "06Z", "wrfRun": "06Z", "consensusScore": "High (94%)"},
            },
            {
                "eventType": EventType.AVIATION_ALERT,
                "severity": EventSeverity.YELLOW,
                "title": "Aviation Crosswind & Low Ceiling Advisory",
                "message": "VABB (Mumbai Airport): Convective clouds at 1800 ft AGL, crosswind gusts on RWY 27 reaching 22 knots.",
                "location": EventLocation(lat=19.0896, lon=72.8656, name="Chhatrapati Shivaji Maharaj Intl Airport (VABB)", district="Mumbai", state="Maharashtra"),
                "data": {"icao": "VABB", "runway": "27", "crosswindKts": 22, "rvrM": 2800},
            },
        ]

        try:
            while self.is_demo_stream_active:
                await asyncio.sleep(35)
                if not self.is_demo_stream_active:
                    break

                scenario = random.choice(sim_scenarios)
                req = DemoPublishEventRequest(
                    eventType=scenario["eventType"],
                    severity=scenario["severity"],
                    title=scenario["title"],
                    message=scenario["message"],
                    location=scenario["location"],
                    source="DEMO_STREAM",
                    is_demo=True,
                    data=scenario.get("data", {}),
                )
                await self.publish_demo_event(req)
        except asyncio.CancelledError:
            logger.info("[EVENT_BUS] Demo stream cancelled")
        except Exception as e:
            logger.error(f"[EVENT_BUS] Demo stream exception: {e}")
        finally:
            self.is_demo_stream_active = False

    def toggle_demo_stream(self, enable: bool) -> bool:
        """Enable or disable automated background demonstration stream."""
        if enable and not self.is_demo_stream_active:
            self.is_demo_stream_active = True
            self._demo_task = asyncio.create_task(self._run_demo_stream())
            return True
        elif not enable and self.is_demo_stream_active:
            self.is_demo_stream_active = False
            if self._demo_task:
                self._demo_task.cancel()
                self._demo_task = None
            return False
        return self.is_demo_stream_active


# Global singleton instance
event_bus = EventBus()
