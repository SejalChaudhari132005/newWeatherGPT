from typing import Generator
from backend.app.services.supabase_service import supabase_service, SupabaseService

def get_supabase_service() -> SupabaseService:
    """Dependency injection helper for Supabase service."""
    return supabase_service
