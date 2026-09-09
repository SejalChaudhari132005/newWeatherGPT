from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from backend.app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatMessagePayload,
    ConversationsListResponse,
    MessagesListResponse,
)
from backend.app.agents.orchestrator_agent import orchestrator_agent
from backend.app.services.conversation_service import conversation_service
from backend.app.core.logging import logger

router = APIRouter(prefix="/chat", tags=["Chat & Conversational AI"])

@router.post("", response_model=ChatResponse, summary="Send user message and receive verified conversational weather response")
@router.post("/message", response_model=ChatResponse, summary="Send user message alias")
async def send_chat_message(payload: ChatRequest):
    """
    Main conversational endpoint:
    1. Classifies intent & detects time/location overrides.
    2. Retrieves verified Weather Intelligence from Open-Meteo & IMD.
    3. Formats compact meteorological context.
    4. Generates natural language answer using configured Groq/LLM engine.
    5. Validates against hallucinated values or warnings.
    6. Persists conversation and message history.
    """
    try:
        loc_dict = payload.location.model_dump() if payload.location else {}
        context = {
            "conversation_id": payload.conversation_id,
            "user_id": payload.user_id or "anonymous",
            "role": payload.role or "citizen",
            "language": payload.language,
            "location": loc_dict,
        }

        result = await orchestrator_agent.execute(
            query=payload.message,
            context=context
        )

        msg_data = result["message"]
        if isinstance(msg_data, dict):
            msg_payload = ChatMessagePayload(
                id=msg_data.get("id"),
                role=msg_data.get("role", "assistant"),
                content=msg_data.get("content", ""),
                created_at=msg_data.get("created_at"),
            )
        else:
            msg_payload = ChatMessagePayload(
                role="assistant",
                content=str(msg_data),
            )

        return ChatResponse(
            success=True,
            conversation_id=result["conversation_id"],
            message=msg_payload,
            intent=result.get("intent"),
            location=result.get("location"),
            weather_used=result.get("weather_used", True),
            sources=result.get("sources", []),
            official_warning=result.get("official_warning", False),
            metadata=result.get("metadata", {}),
            updated_title=result.get("updated_title"),
        )
    except Exception as e:
        logger.error(f"[ChatAPI] Error processing message: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversational service encountered an error: {str(e)}"
        )

@router.get("/conversations", response_model=ConversationsListResponse, summary="List active conversations for user")
async def list_conversations(user_id: str = Query("anonymous", description="User UUID")):
    try:
        convs = await conversation_service.list_conversations(user_id)
        return ConversationsListResponse(success=True, data=convs)
    except Exception as e:
        logger.error(f"[ChatAPI] Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/search", response_model=ConversationsListResponse, summary="Search conversations by title/content")
async def search_conversations(
    q: str = Query(..., min_length=1, description="Search term"),
    user_id: str = Query("anonymous", description="User UUID")
):
    try:
        convs = await conversation_service.search_conversations(user_id, q)
        return ConversationsListResponse(success=True, data=convs)
    except Exception as e:
        logger.error(f"[ChatAPI] Error searching conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages", response_model=MessagesListResponse, summary="Get message history for a conversation")
async def get_conversation_messages(conversation_id: str):
    try:
        msgs = await conversation_service.get_messages(conversation_id, limit=50)
        return MessagesListResponse(success=True, data=msgs)
    except Exception as e:
        logger.error(f"[ChatAPI] Error getting messages for {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversations/{conversation_id}", summary="Delete a conversation")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Query("anonymous", description="User UUID")
):
    try:
        success = await conversation_service.delete_conversation(conversation_id, user_id)
        return {"success": success, "message": f"Conversation {conversation_id} deleted."}
    except Exception as e:
        logger.error(f"[ChatAPI] Error deleting conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
