from typing import Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.services.base_service import BaseService

class SupabaseService(BaseService):
    """
    Server-side Supabase Service wrapper.
    Reads environment settings cleanly without exposing credentials to frontend.
    """
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self._client = None
        
    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.service_role_key)

    def get_client(self):
        if not self.is_configured():
            return None
        if self._client is None:
            try:
                from supabase import create_client
                self._client = create_client(self.supabase_url, self.service_role_key)
            except Exception as e:
                logger.warning(f"[SupabaseService] Could not initialize Supabase client: {e}")
                return None
        return self._client

supabase_service = SupabaseService()

def get_supabase_client():
    return supabase_service.get_client()
