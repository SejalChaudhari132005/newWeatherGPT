from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ChatLocationInput(BaseModel):
    latitude: Optional[float] = Field(None, description="Exact GPS latitude")
    longitude: Optional[float] = Field(None, description="Exact GPS longitude")
    city: Optional[str] = Field(None, description="City name from geocoding")
    district: Optional[str] = Field(None, description="District name")
    state: Optional[str] = Field(None, description="State name")
    country: Optional[str] = Field("India", description="Country name")

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Active conversation UUID if continuing a thread")
    message: str = Field(..., min_length=1, description="User prompt or question")
    user_id: Optional[str] = Field("anonymous", description="User ID from auth")
    role: Optional[str] = Field("citizen", description="User role, e.g. citizen")
    language: Optional[str] = Field(None, description="User preferred language (e.g. Marathi, Hindi, English)")
    location: Optional[ChatLocationInput] = Field(None, description="Exact GPS coordinates and geocoding context")

class ChatMessagePayload(BaseModel):
    id: Optional[str] = Field(None, description="Unique message UUID")
    role: str = Field(..., description="'assistant' or 'user'")
    content: str = Field(..., description="Message text")
    created_at: Optional[str] = Field(None, description="Message timestamp")

class ChatResponse(BaseModel):
    success: bool = Field(True, description="Whether the chat request completed successfully")
    conversation_id: str = Field(..., description="Conversation UUID")
    message: ChatMessagePayload = Field(..., description="Assistant reply")
    intent: Optional[str] = Field(None, description="Classified intent (e.g. WEATHER_ADVISORY, CURRENT_WEATHER)")
    location: Optional[Dict[str, Any]] = Field(None, description="City, state and coordinates used")
    weather_used: bool = Field(True, description="Whether real-time verified weather context was used")
    sources: List[Any] = Field(default_factory=list, description="Authoritative data sources utilized")
    official_warning: bool = Field(False, description="Whether an active official IMD warning is present")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Intent, sources, confidence, latencies, alerts")
    updated_title: Optional[str] = Field(None, description="Auto-generated title if newly created or renamed")

class ConversationSummary(BaseModel):
    id: str
    user_id: str
    title: str
    role: str
    location_name: Optional[str] = None
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None

class ConversationsListResponse(BaseModel):
    success: bool = True
    data: List[ConversationSummary] = []
    message: Optional[str] = None

class MessageItem(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: str

class MessagesListResponse(BaseModel):
    success: bool = True
    data: List[MessageItem] = []
    message: Optional[str] = None
