"""
WebSocket Connection Manager for Real-Time Weather Event Pipeline
"""

import asyncio
import json
import logging
from typing import Set, Dict, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("websocket_manager")


class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.total_events_broadcast: int = 0
        self.last_event_timestamp: Optional[str] = None
        self.started_at: datetime = datetime.now()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, client_id: str = "anonymous"):
        """Accept incoming client WebSocket connection and register."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"[WEBSOCKET] Client connected: {client_id} (Total Active: {len(self.active_connections)})")

        # Send initial handshake event
        handshake = {
            "eventType": "SYSTEM_STATUS",
            "eventId": f"sys-handshake-{int(datetime.now().timestamp())}",
            "source": "WEATHERGPT_SERVER",
            "timestamp": datetime.now().isoformat(),
            "severity": "INFO",
            "title": "Real-Time Pipeline Connected",
            "message": "Connected to WeatherGPT Real-Time Event Pipeline (WIS2.0-Compatible Ingestion).",
            "data": {
                "activeClients": len(self.active_connections),
                "connectedAt": datetime.now().isoformat(),
            },
        }
        try:
            await websocket.send_text(json.dumps(handshake))
        except Exception as e:
            logger.warning(f"[WEBSOCKET] Failed to send handshake to client {client_id}: {e}")

    async def disconnect(self, websocket: WebSocket, client_id: str = "anonymous"):
        """Gracefully remove disconnected client."""
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(f"[WEBSOCKET] Client disconnected: {client_id} (Remaining Active: {len(self.active_connections)})")

    async def broadcast(self, event_data: Dict[str, Any]) -> int:
        """
        Broadcast structured weather event payload to all connected clients asynchronously.
        Handles dropped sockets gracefully and returns the count of successful deliveries.
        """
        if not self.active_connections:
            logger.debug("[WEBSOCKET] Broadcast skipped: 0 connected clients")
            return 0

        message_str = json.dumps(event_data)
        logger.info(f"[EVENT] Broadcasting event [{event_data.get('eventType')}] - ID: {event_data.get('eventId')} to {len(self.active_connections)} clients")

        dead_connections = set()
        delivered_count = 0

        async with self._lock:
            connections = list(self.active_connections)

        for ws in connections:
            try:
                await ws.send_text(message_str)
                delivered_count += 1
            except Exception as e:
                logger.warning(f"[WEBSOCKET] Error sending to client, queuing for removal: {e}")
                dead_connections.add(ws)

        # Cleanup dead sockets
        if dead_connections:
            async with self._lock:
                for ws in dead_connections:
                    self.active_connections.discard(ws)

        self.total_events_broadcast += 1
        self.last_event_timestamp = datetime.now().isoformat()
        logger.info(f"[EVENT] Broadcast completed: {delivered_count}/{len(connections)} clients delivered successfully")
        return delivered_count

    def get_stats(self) -> Dict[str, Any]:
        """Return live WebSocket statistics."""
        uptime = (datetime.now() - self.started_at).total_seconds()
        return {
            "websocket": "available",
            "connected_clients": len(self.active_connections),
            "total_events_broadcast": self.total_events_broadcast,
            "last_event_timestamp": self.last_event_timestamp,
            "uptime_seconds": round(uptime, 2),
            "status": "healthy",
            "event_bus": "active",
        }


# Global singleton instance
websocket_manager = WebSocketManager()
