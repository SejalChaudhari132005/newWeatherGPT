from typing import Optional, List
from pydantic import BaseModel, Field

class LocationResolveRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    source: Optional[str] = "gps"

class NormalizedLocationResponse(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    formatted_address: Optional[str] = None
    source: Optional[str] = "gps"
    provider: Optional[str] = None

class LocationResolveResponse(BaseModel):
    success: bool = True
    location: NormalizedLocationResponse

class LocationSearchResult(BaseModel):
    display_name: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    source: Optional[str] = "manual"

class LocationSearchResponse(BaseModel):
    success: bool = True
    results: List[LocationSearchResult]
