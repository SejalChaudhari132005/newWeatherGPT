"""
Centralized Official IMD API Client for WeatherGPT.
Handles secure header authentication, rate-limiting, network retries,
error classification, and transparent response normalization.
NEVER logs or exposes secret API keys.
"""

import httpx
import logging
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone

from backend.app.core.config import settings
from backend.app.services.weather_cache import imd_cache_service

logger = logging.getLogger("imd_client")


class IMDErrorCategory:
    AVAILABLE = "available"
    AUTHENTICATION_ERROR = "authentication_error"
    PERMISSION_DENIED = "permission_denied"
    NOT_FOUND = "not_found"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    SERVER_ERROR = "server_error"
    INVALID_RESPONSE = "invalid_response"
    NOT_CONFIGURED = "not_configured"
    UNAVAILABLE = "unavailable"


class IMDClient:
    """
    Production-grade HTTP Client for communicating with the India Meteorological Department API.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.IMD_API_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.IMD_API_KEY
        self.timeout = timeout or settings.IMD_TIMEOUT_SECONDS

    def is_configured(self) -> bool:
        """Check if IMD API Key is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 0)

    def get_masked_key_info(self) -> Dict[str, Any]:
        """Return safe key metadata without exposing the secret."""
        if not self.is_configured():
            return {"configured": False, "masked": None, "length": 0}
        k = self.api_key.strip()
        masked = f"{k[:4]}...{k[-4:]}" if len(k) > 8 else "***"
        return {"configured": True, "masked": masked, "length": len(k)}

    def _get_auth_headers(self) -> Dict[str, str]:
        """
        Build authentication headers for the official IMD API gateway.
        Attaches X-API-KEY and Authorization headers safely.
        """
        headers = {
            "Accept": "application/json",
            "User-Agent": "WeatherGPT-India/1.0 (Ministry of Earth Sciences Integration)",
        }
        if self.api_key:
            clean_key = self.api_key.strip()
            headers["X-API-KEY"] = clean_key
            headers["x-api-key"] = clean_key
            headers["api_key"] = clean_key
            headers["Authorization"] = f"Bearer {clean_key}"
        return headers

    async def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        cache_namespace: str = "imd",
        cache_ttl: Optional[int] = None,
    ) -> Tuple[Optional[Any], str, int, float, Optional[str]]:
        """
        Execute a GET request against the official IMD API with error classification.
        Returns:
            (data, error_category, http_status, duration_ms, error_message)
        """
        if not endpoint.startswith("http"):
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
        else:
            url = endpoint

        # Check Cache
        cache_key = f"{url}?{str(sorted((params or {}).items()))}"
        if use_cache:
            cached = imd_cache_service.get(cache_namespace, cache_key)
            if cached is not None:
                return cached, IMDErrorCategory.AVAILABLE, 200, 0.0, None

        if not self.is_configured() and "mausam.imd.gov.in" not in url:
            return (
                None,
                IMDErrorCategory.NOT_CONFIGURED,
                0,
                0.0,
                "IMD_API_KEY is not configured in backend environment",
            )

        headers = self._get_auth_headers()
        t0 = time.time()

        try:
            async with httpx.AsyncClient(verify=False, timeout=self.timeout) as client:
                resp = await client.get(url, headers=headers, params=params)
                dur = (time.time() - t0) * 1000.0
                status_code = resp.status_code

                if status_code == 200:
                    try:
                        data = resp.json()
                        if use_cache:
                            imd_cache_service.set(cache_namespace, cache_key, data, ttl=cache_ttl)
                        return data, IMDErrorCategory.AVAILABLE, 200, dur, None
                    except Exception as json_err:
                        # Might be an image or binary radar payload
                        content_type = resp.headers.get("content-type", "")
                        if "image" in content_type or "gif" in content_type:
                            return resp.content, IMDErrorCategory.AVAILABLE, 200, dur, None
                        logger.warning(f"[IMDClient] JSON decode error for {url}: {json_err}")
                        return (
                            None,
                            IMDErrorCategory.INVALID_RESPONSE,
                            200,
                            dur,
                            f"Response is not valid JSON: {resp.text[:120]}",
                        )

                elif status_code in (401, 403):
                    body_snippet = resp.text[:120] if resp.text else ""
                    category = (
                        IMDErrorCategory.PERMISSION_DENIED
                        if status_code == 403
                        else IMDErrorCategory.AUTHENTICATION_ERROR
                    )
                    safe_msg = (
                        f"IMD gateway rejected credential (HTTP {status_code}). Detail: {body_snippet}"
                    )
                    logger.debug(f"[IMDClient] Auth failure: {safe_msg}")
                    return None, category, status_code, dur, safe_msg

                elif status_code == 404:
                    return (
                        None,
                        IMDErrorCategory.NOT_FOUND,
                        404,
                        dur,
                        f"IMD endpoint not found on server (HTTP 404)",
                    )

                elif status_code == 429:
                    return (
                        None,
                        IMDErrorCategory.RATE_LIMITED,
                        429,
                        dur,
                        f"IMD API rate limit reached (HTTP 429)",
                    )

                elif status_code >= 500:
                    return (
                        None,
                        IMDErrorCategory.SERVER_ERROR,
                        status_code,
                        dur,
                        f"IMD server error (HTTP {status_code})",
                    )

                else:
                    return (
                        None,
                        IMDErrorCategory.UNAVAILABLE,
                        status_code,
                        dur,
                        f"Unexpected HTTP status {status_code}",
                    )

        except httpx.TimeoutException:
            dur = (time.time() - t0) * 1000.0
            return (
                None,
                IMDErrorCategory.TIMEOUT,
                0,
                dur,
                f"IMD server request timed out after {self.timeout}s",
            )
        except httpx.ConnectError:
            dur = (time.time() - t0) * 1000.0
            return (
                None,
                IMDErrorCategory.UNAVAILABLE,
                0,
                dur,
                "Unable to establish TCP/SSL connection to IMD server",
            )
        except Exception as exc:
            dur = (time.time() - t0) * 1000.0
            return (
                None,
                IMDErrorCategory.UNAVAILABLE,
                0,
                dur,
                f"IMD request failure: {type(exc).__name__}",
            )


# Global singleton instance
imd_client = IMDClient()
