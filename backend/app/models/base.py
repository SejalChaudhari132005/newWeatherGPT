"""
Database & Domain Models Placeholder
Clean interfaces for Supabase tables and internal entity mappings.
"""
from typing import Optional
from pydantic import BaseModel

class BaseModelEntity(BaseModel):
    id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
