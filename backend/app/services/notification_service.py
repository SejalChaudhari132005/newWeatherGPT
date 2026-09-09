"""
NotificationService for WeatherGPT Step 9.
Abstracts multi-channel notification dispatch (in-app toasts, browser notifications,
and future mobile WebPush/FCM integrations).
"""

from typing import Dict, Any, Optional, List
from backend.app.schemas.alerts import CitizenAlert
from backend.app.core.logging import logger


class NotificationService:
    """
    Unified notification dispatch coordinator.
    """

    def __init__(self):
        self._notification_queue: List[Dict[str, Any]] = []

    async def dispatch_alert_notification(
        self,
        alert: CitizenAlert,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches a high-priority weather notification to the targeted user session or device.
        """
        payload = {
            "id": alert.id,
            "type": "WEATHER_ALERT",
            "severity": alert.severity,
            "title": f"⚠️ WeatherGPT Alert: {alert.title}",
            "body": alert.description,
            "location": alert.location_name,
            "recommended_action": alert.recommended_actions[0] if alert.recommended_actions else "",
            "valid_until": alert.valid_until,
            "user_id": user_id,
        }

        self._notification_queue.append(payload)
        logger.info(
            f"[NotificationService] Alert notification dispatched: type={alert.type} "
            f"severity={alert.severity} location='{alert.location_name}'"
        )
        return {"dispatched": True, "payload": payload}


notification_service = NotificationService()
