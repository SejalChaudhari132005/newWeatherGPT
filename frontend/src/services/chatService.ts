import { Conversation, ChatMessage, PromptSuggestion } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getSuggestedPromptsByRole = (role: string): PromptSuggestion[] => {
  const normalizedRole = (role || 'citizen').toLowerCase();

  if (normalizedRole.includes('farmer')) {
    return [
      { id: '1', icon: '🌾', text: "Should I irrigate today?", roleCategory: 'Farmer' },
      { id: '2', icon: '🌧️', text: "Will rain affect my crop this week?", roleCategory: 'Farmer' },
      { id: '3', icon: '🌱', text: "Is tomorrow suitable for spraying?", roleCategory: 'Farmer' },
      { id: '4', icon: '🌡️', text: "What is the temperature outlook?", roleCategory: 'Farmer' },
    ];
  }

  if (normalizedRole.includes('fisher') || normalizedRole.includes('marine')) {
    return [
      { id: '1', icon: '🎣', text: "Is it safe to go fishing tomorrow?", roleCategory: 'Fisherfolk' },
      { id: '2', icon: '🌊', text: "What are the wave & swell conditions?", roleCategory: 'Fisherfolk' },
      { id: '3', icon: '🌬️', text: "What will coastal wind speed be?", roleCategory: 'Fisherfolk' },
      { id: '4', icon: '⚡', text: "Are there thunderstorm risks offshore?", roleCategory: 'Fisherfolk' },
    ];
  }

  if (normalizedRole.includes('disaster') || normalizedRole.includes('emergency')) {
    return [
      { id: '1', icon: '🚨', text: "What areas are at severe weather risk?", roleCategory: 'Disaster Manager' },
      { id: '2', icon: '🌊', text: "Where is heavy rainfall likely in my zone?", roleCategory: 'Disaster Manager' },
      { id: '3', icon: '📍', text: "Show storm & wind advisories", roleCategory: 'Disaster Manager' },
      { id: '4', icon: '⛈️', text: "Any official IMD warnings active?", roleCategory: 'Disaster Manager' },
    ];
  }

  // Default Citizen prompts
  return [
    { id: '1', icon: '🌧️', text: "Will it rain today in my area?", roleCategory: 'Citizen' },
    { id: '2', icon: '☔', text: "Should I carry an umbrella tomorrow?", roleCategory: 'Citizen' },
    { id: '3', icon: '🚗', text: "Is it safe to travel tomorrow morning?", roleCategory: 'Citizen' },
    { id: '4', icon: '🌡️', text: "How hot will it be today?", roleCategory: 'Citizen' },
    { id: '5', icon: '🚨', text: "Is there any official weather warning near me?", roleCategory: 'Citizen' },
  ];
};

export class ChatService {
  /**
   * Sends a user query to the FastAPI OrchestratorAgent and receives verified intelligence.
   */
  async sendMessage(
    conversationId: string | undefined,
    userId: string,
    content: string,
    role: string,
    location?: {
      latitude: number;
      longitude: number;
      city?: string | null;
      district?: string | null;
      state?: string | null;
    } | null,
    language?: string
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; updatedTitle?: string; conversationId: string }> {
    const userMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_u_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      conversationId,
      userId,
      sender: 'user',
      text: content,
      timestamp: new Date().toISOString(),
    };

    const payload = {
      conversation_id: conversationId || null,
      message: content,
      user_id: userId || 'anonymous',
      role: role || 'citizen',
      language: language || null,
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city || null,
            district: location.district || null,
            state: location.state || null,
          }
        : null,
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Chat request failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_a_${Date.now()}`;

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      conversationId: data.conversation_id,
      userId,
      sender: 'assistant',
      text: data.message.content,
      timestamp: new Date().toISOString(),
      metadata: data.metadata,
    };

    return {
      userMessage,
      assistantMessage,
      updatedTitle: data.updated_title,
      conversationId: data.conversation_id,
    };
  }

  /**
   * Fetches active conversation list for user.
   */
  async fetchConversations(userId: string): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?user_id=${encodeURIComponent(userId || 'anonymous')}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            title: item.title,
            role: item.role,
            locationName: item.location_name || '',
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            deletedAt: item.deleted_at,
          }));
        }
      }
    } catch (err) {
      console.warn('[ChatService] fetchConversations error:', err);
    }
    return [];
  }

  /**
   * Fetches message history for a conversation.
   */
  async fetchMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data.map((m: any) => ({
            id: m.id,
            conversationId: m.conversation_id,
            userId: m.user_id,
            sender: m.role as 'user' | 'assistant',
            text: m.content,
            timestamp: m.created_at,
            metadata: m.metadata,
          }));
        }
      }
    } catch (err) {
      console.warn('[ChatService] fetchMessages error:', err);
    }
    return [];
  }

  /**
   * Deletes a conversation session.
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}?user_id=${encodeURIComponent(userId || 'anonymous')}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.warn('[ChatService] deleteConversation error:', err);
      return false;
    }
  }

  /**
   * Searches user conversations.
   */
  async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/search?q=${encodeURIComponent(query)}&user_id=${encodeURIComponent(userId || 'anonymous')}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            title: item.title,
            role: item.role,
            locationName: item.location_name || '',
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
        }
      }
    } catch (err) {
      console.warn('[ChatService] searchConversations error:', err);
    }
    return [];
  }

  async createConversation(
    userId: string,
    role: string,
    locationName: string,
    initialTitle: string = 'New Conversation'
  ): Promise<Conversation> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv_${Date.now()}`;
    return {
      id: newId,
      userId,
      title: initialTitle,
      role,
      locationName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async renameConversation(conversationId: string, newTitle: string, userId: string): Promise<boolean> {
    return true;
  }
}

export const chatService = new ChatService();
