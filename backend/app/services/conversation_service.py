import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.services.supabase_service import get_supabase_client
from backend.app.core.logging import logger

class ConversationService:
    """
    Manages conversations and messages persistence in Supabase with in-memory fallback.
    """
    def __init__(self):
        # In-memory storage fallback for local testing & resilience
        self._mem_conversations: Dict[str, Dict[str, Any]] = {}
        self._mem_messages: Dict[str, List[Dict[str, Any]]] = {}

    def _generate_title(self, query: str, location_name: Optional[str] = None) -> str:
        import re
        q = query.strip()
        loc = (location_name or "").split(",")[0].strip()
        loc_suffix = f" – {loc}" if loc else ""

        q_lower = q.lower()
        if "umbrella" in q_lower:
            if "evening" in q_lower:
                return "Umbrella for evening"
            return f"Umbrella advisory{loc_suffix}"
        if "rain" in q_lower:
            if "tomorrow" in q_lower:
                return "Rain forecast tomorrow"
            if "today" in q_lower and loc:
                return f"Rain forecast – {loc}"
            if "today" in q_lower:
                return "Rain forecast today"
            return f"Rain forecast{loc_suffix}"
        if "tomorrow" in q_lower:
            return "Weather tomorrow"
        if "travel" in q_lower:
            if loc:
                return f"{loc} travel weather"
            return "Travel weather"
        if "temp" in q_lower or "hot" in q_lower or "cold" in q_lower:
            return f"Temperature{loc_suffix}"
        if "warning" in q_lower or "alert" in q_lower:
            return f"Weather warning{loc_suffix}"
        if "walk" in q_lower or "outside" in q_lower:
            return "Outdoor weather"

        # Clean title from query
        cleaned = re.sub(r"^(?:what is the|how is the|what's the|tell me the|check the)\s+", "", q, flags=re.IGNORECASE).strip(" ?.")
        if cleaned:
            words = cleaned.split()
            title = " ".join(words[:5]).capitalize()
            return title[:32]
        return f"Weather{loc_suffix}"

    async def get_or_create_conversation(
        self,
        conversation_id: Optional[str],
        user_id: str,
        initial_query: Optional[str] = None,
        location_name: Optional[str] = None,
        role: str = "citizen"
    ) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        sb = get_supabase_client()

        if conversation_id:
            # Try fetching existing
            if sb:
                try:
                    res = sb.table("conversations").select("*").eq("id", conversation_id).execute()
                    if res.data and len(res.data) > 0:
                        return res.data[0]
                except Exception as e:
                    logger.warning(f"[ConversationService] Supabase get error: {e}")

            if conversation_id in self._mem_conversations:
                return self._mem_conversations[conversation_id]

        # Create new
        new_id = conversation_id or str(uuid.uuid4())
        title = self._generate_title(initial_query or "New Chat", location_name)

        new_record = {
            "id": new_id,
            "user_id": user_id,
            "title": title,
            "role": role,
            "location_name": location_name or "",
            "created_at": now_iso,
            "updated_at": now_iso,
            "deleted_at": None,
        }

        if sb:
            try:
                sb.table("conversations").insert(new_record).execute()
            except Exception as e:
                logger.warning(f"[ConversationService] Supabase insert error: {e}")

        self._mem_conversations[new_id] = new_record
        if new_id not in self._mem_messages:
            self._mem_messages[new_id] = []

        return new_record

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        msg_record = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id or "anonymous",
            "role": role,
            "content": content,
            "metadata": metadata or {},
            "created_at": now_iso,
        }

        sb = get_supabase_client()
        if sb:
            try:
                sb.table("messages").insert(msg_record).execute()
                sb.table("conversations").update({"updated_at": now_iso}).eq("id", conversation_id).execute()
            except Exception as e:
                logger.warning(f"[ConversationService] Supabase message insert error: {e}")

        if conversation_id not in self._mem_messages:
            self._mem_messages[conversation_id] = []
        self._mem_messages[conversation_id].append(msg_record)

        if conversation_id in self._mem_conversations:
            self._mem_conversations[conversation_id]["updated_at"] = now_iso

        return msg_record

    async def get_messages(self, conversation_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(limit).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"[ConversationService] Supabase get_messages error: {e}")

        return self._mem_messages.get(conversation_id, [])

    async def list_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("conversations").select("*").eq("user_id", user_id).is_("deleted_at", "null").order("updated_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"[ConversationService] Supabase list_conversations error: {e}")

        user_convs = [c for c in self._mem_conversations.values() if c.get("user_id") == user_id and not c.get("deleted_at")]
        return sorted(user_convs, key=lambda x: x.get("updated_at", ""), reverse=True)

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        now_iso = datetime.now(timezone.utc).isoformat()
        sb = get_supabase_client()
        if sb:
            try:
                sb.table("conversations").update({"deleted_at": now_iso}).eq("id", conversation_id).execute()
            except Exception as e:
                logger.warning(f"[ConversationService] Supabase delete error: {e}")

        if conversation_id in self._mem_conversations:
            self._mem_conversations[conversation_id]["deleted_at"] = now_iso
        return True

    async def search_conversations(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        all_convs = await self.list_conversations(user_id)
        if not query.strip():
            return all_convs
        q = query.lower()
        return [c for c in all_convs if q in c.get("title", "").lower()]

conversation_service = ConversationService()
