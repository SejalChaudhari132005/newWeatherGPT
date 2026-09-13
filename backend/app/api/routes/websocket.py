"""
WebSocket and Real-Time Event Ingestion API Routes
Provides WebSocket live alert endpoint, demo event publisher, and real-time health checks.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from typing import Optional, List, Dict, Any
import logging

from backend.app.schemas.weather_events import (
    BaseWeatherEvent,
    DemoPublishEventRequest,
    RealtimeHealthStatus,
    EventType,
)
from backend.app.services.websocket_manager import websocket_manager
from backend.app.services.event_bus import event_bus

logger = logging.getLogger("websocket_route")

router = APIRouter()


@router.websocket("/ws/live-alerts")
async def websocket_live_alerts(websocket: WebSocket, client_id: str = "web-client"):
    """
    WebSocket endpoint for real-time weather event ingestion & push notifications.
    Clients connect to ws://localhost:8000/ws/live-alerts (or /api/ws/live-alerts).
    """
    await websocket_manager.connect(websocket, client_id=client_id)
    try:
        while True:
            # Keep connection alive and listen for optional client heartbeat/ping
            data = await websocket.receive_text()
            logger.debug(f"[WEBSOCKET] Received client message: {data}")
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket, client_id=client_id)
    except Exception as e:
        logger.warning(f"[WEBSOCKET] Unexpected connection error with {client_id}: {e}")
        await websocket_manager.disconnect(websocket, client_id=client_id)


@router.post("/demo/publish-event", summary="Publish Demonstration Weather Event")
async def publish_demo_event(request: DemoPublishEventRequest):
    """
    Development/Demo endpoint to trigger structured real-time weather events.
    Broadcasts the event across WebSocket to all connected clients.
    """
    published_event = await event_bus.publish_demo_event(request)
    return {
        "status": "success",
        "message": "Demo event validated and published to real-time bus",
        "event": published_event,
        "active_clients": len(websocket_manager.active_connections),
    }


@router.get("/realtime/history", summary="Get Recent Event History")
async def get_realtime_history(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    role: Optional[str] = Query(None, description="Filter by stakeholder role"),
    limit: int = Query(50, ge=1, le=100, description="Max number of events to return"),
):
    """
    Retrieve in-memory buffer of recent normalized real-time weather events.
    """
    events = event_bus.get_recent_events(limit=limit, event_type=event_type, role=role)
    return {
        "total": len(events),
        "events": events,
    }


@router.get("/realtime/health", response_model=RealtimeHealthStatus, summary="Real-time WebSocket & Ingestion Health")
async def get_realtime_health():
    """
    Returns the real-time event pipeline health, connection count, and broadcast statistics.
    """
    stats = websocket_manager.get_stats()
    return RealtimeHealthStatus(
        websocket=stats["websocket"],
        connected_clients=stats["connected_clients"],
        total_events_broadcast=stats["total_events_broadcast"],
        last_event_timestamp=stats["last_event_timestamp"],
        uptime_seconds=stats["uptime_seconds"],
        status=stats["status"],
        event_bus="active" if event_bus.is_demo_stream_active else "idle",
    )


@router.post("/demo/toggle-stream", summary="Toggle Automatic Background Demo Event Stream")
async def toggle_demo_stream(enable: Optional[bool] = Query(None, description="Set explicit stream status")):
    """
    Start or stop the 30-60 second automated demonstration event generator.
    """
    if enable is None:
        new_state = not event_bus.is_demo_stream_active
    else:
        new_state = enable

    if new_state:
        await event_bus.start_demo_stream(interval_seconds=30)
    else:
        await event_bus.stop_demo_stream()

    return {
        "is_demo_stream_active": event_bus.is_demo_stream_active,
        "message": "Demo stream started (30s interval)" if event_bus.is_demo_stream_active else "Demo stream stopped",
    }
