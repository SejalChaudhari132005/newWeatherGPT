import { Conversation, ChatMessage, PromptSuggestion } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getSuggestedPromptsByRole = (role: string, language: string = 'en'): PromptSuggestion[] => {
  const normalizedRole = (role || 'citizen').toLowerCase();
  const lang = (language || 'en').toLowerCase();

  if (normalizedRole.includes('farmer')) {
    if (lang === 'mr') {
      return [
        { id: '1', icon: '🌾', text: "आज पिकाला पाणी (सिंचन) द्यावे का?", roleCategory: 'Farmer' },
        { id: '2', icon: '🌧️', text: "या आठवड्यात पावसामुळे पिकांचे नुकसान होईल का?", roleCategory: 'Farmer' },
        { id: '3', icon: '🌱', text: "उद्या कीटकनाशक फवारणीसाठी हवामान अनुकूल आहे का?", roleCategory: 'Farmer' },
        { id: '4', icon: '🌡️', text: "आगामी दिवसांत तापमानाचा अंदाज काय आहे?", roleCategory: 'Farmer' },
      ];
    }
    if (lang === 'hi') {
      return [
        { id: '1', icon: '🌾', text: "क्या आज खेत में सिंचाई करनी चाहिए?", roleCategory: 'Farmer' },
        { id: '2', icon: '🌧️', text: "क्या इस सप्ताह बारिश से फसल पर असर पड़ेगा?", roleCategory: 'Farmer' },
        { id: '3', icon: '🌱', text: "क्या कल कीटनाशक छिड़काव के लिए उपयुक्त समय है?", roleCategory: 'Farmer' },
        { id: '4', icon: '🌡️', text: "आने वाले दिनों में तापमान का पूर्वानुमान क्या है?", roleCategory: 'Farmer' },
      ];
    }
    return [
      { id: '1', icon: '🌾', text: "Should I irrigate today?", roleCategory: 'Farmer' },
      { id: '2', icon: '🌧️', text: "Will rain affect my crop this week?", roleCategory: 'Farmer' },
      { id: '3', icon: '🌱', text: "Is tomorrow suitable for spraying?", roleCategory: 'Farmer' },
      { id: '4', icon: '🌡️', text: "What is the temperature outlook?", roleCategory: 'Farmer' },
    ];
  }

  if (normalizedRole.includes('fisher') || normalizedRole.includes('marine')) {
    if (lang === 'mr') {
      return [
        { id: '1', icon: '🎣', text: "उद्या मासेमारीसाठी समुद्रात जाणे सुरक्षित आहे का?", roleCategory: 'Fisherfolk' },
        { id: '2', icon: '🌊', text: "समुद्रातील लाटा आणि भरती-ओहोटीची स्थिती कशी आहे?", roleCategory: 'Fisherfolk' },
        { id: '3', icon: '🌬️', text: "किनारपट्टीवर वाऱ्याचा वेग किती असेल?", roleCategory: 'Fisherfolk' },
        { id: '4', icon: '⚡', text: "खोल समुद्रात वादळाचा काही धोका आहे का?", roleCategory: 'Fisherfolk' },
      ];
    }
    if (lang === 'hi') {
      return [
        { id: '1', icon: '🎣', text: "क्या कल मछली पकड़ने के लिए समुद्र में जाना सुरक्षित है?", roleCategory: 'Fisherfolk' },
        { id: '2', icon: '🌊', text: "समुद्र में लहरों और ज्वार-भाटे की स्थिति कैसी है?", roleCategory: 'Fisherfolk' },
        { id: '3', icon: '🌬️', text: "तटीय हवा की गति कितनी रहेगी?", roleCategory: 'Fisherfolk' },
        { id: '4', icon: '⚡', text: "क्या गहरे समुद्र में आंधी-तूफान का जोखिम है?", roleCategory: 'Fisherfolk' },
      ];
    }
    return [
      { id: '1', icon: '🎣', text: "Is it safe to go fishing tomorrow?", roleCategory: 'Fisherfolk' },
      { id: '2', icon: '🌊', text: "What are the wave & swell conditions?", roleCategory: 'Fisherfolk' },
      { id: '3', icon: '🌬️', text: "What will coastal wind speed be?", roleCategory: 'Fisherfolk' },
      { id: '4', icon: '⚡', text: "Are there thunderstorm risks offshore?", roleCategory: 'Fisherfolk' },
    ];
  }

  // Default Citizen prompts
  if (lang === 'mr') {
    return [
      { id: '1', icon: '🌧️', text: "आज माझ्या भागात पाऊस पडेल का?", roleCategory: 'Citizen' },
      { id: '2', icon: '☔', text: "उद्या बाहेर पडताना छत्री सोबत ठेवावी का?", roleCategory: 'Citizen' },
      { id: '3', icon: '🏃', text: "आज बाहेर व्यायाम किंवा धावणे सुरक्षित आहे का?", roleCategory: 'Citizen' },
      { id: '4', icon: '🌡️', text: "आज कमाल तापमान किती राहील?", roleCategory: 'Citizen' },
      { id: '5', icon: '🚨', text: "माझ्या भागात काही अधिकृत हवामान इशारा आहे का?", roleCategory: 'Citizen' },
    ];
  }

  if (lang === 'hi') {
    return [
      { id: '1', icon: '🌧️', text: "क्या आज मेरे इलाके में बारिश होगी?", roleCategory: 'Citizen' },
      { id: '2', icon: '☔', text: "क्या कल बाहर जाते समय छाता साथ रखना चाहिए?", roleCategory: 'Citizen' },
      { id: '3', icon: '🏃', text: "क्या आज बाहर व्यायाम या दौड़ना सुरक्षित है?", roleCategory: 'Citizen' },
      { id: '4', icon: '🌡️', text: "आज अधिकतम तापमान कितना रहेगा?", roleCategory: 'Citizen' },
      { id: '5', icon: '🚨', text: "क्या मेरे क्षेत्र में कोई आधिकारिक मौसम चेतावनी है?", roleCategory: 'Citizen' },
    ];
  }

  return [
    { id: '1', icon: '🌧️', text: "Will it rain today in my area?", roleCategory: 'Citizen' },
    { id: '2', icon: '☔', text: "Should I carry an umbrella tomorrow?", roleCategory: 'Citizen' },
    { id: '3', icon: '🏃', text: "Is it safe to exercise outdoors today?", roleCategory: 'Citizen' },
    { id: '4', icon: '🌡️', text: "How hot will it be today?", roleCategory: 'Citizen' },
    { id: '5', icon: '🚨', text: "Is there any official weather warning near me?", roleCategory: 'Citizen' },
  ];
};

export class ChatService {
  /**
   * Sends a user query to the FastAPI OrchestratorAgent and receives verified intelligence.
   * Supports both positional parameters and an options object.
   */
  async sendMessage(
    conversationIdOrOptions:
      | string
      | undefined
      | {
          conversationId?: string;
          conversation_id?: string;
          userId?: string;
          user_id?: string;
          message?: string;
          content?: string;
          role?: string;
          userRole?: string;
          location?: {
            latitude: number;
            longitude: number;
            city?: string | null;
            district?: string | null;
            state?: string | null;
          } | null;
          language?: string;
        },
    userIdArg?: string,
    contentArg?: string,
    roleArg?: string,
    locationArg?: {
      latitude: number;
      longitude: number;
      city?: string | null;
      district?: string | null;
      state?: string | null;
    } | null,
    languageArg?: string
  ): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    updatedTitle?: string;
    conversationId: string;
    message: string;
    text: string;
  }> {
    let convId: string | undefined;
    let uid: string;
    let text: string;
    let userRole: string;
    let loc: any = null;
    let lang: string | undefined;

    if (typeof conversationIdOrOptions === 'object' && conversationIdOrOptions !== null) {
      convId = conversationIdOrOptions.conversationId || conversationIdOrOptions.conversation_id;
      uid = conversationIdOrOptions.userId || conversationIdOrOptions.user_id || 'anonymous';
      text = conversationIdOrOptions.message || conversationIdOrOptions.content || '';
      userRole = conversationIdOrOptions.role || conversationIdOrOptions.userRole || 'citizen';
      loc = conversationIdOrOptions.location || null;
      lang = conversationIdOrOptions.language;
    } else {
      convId = conversationIdOrOptions;
      uid = userIdArg || 'anonymous';
      text = contentArg || '';
      userRole = roleArg || 'citizen';
      loc = locationArg || null;
      lang = languageArg;
    }

    const userMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_u_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      conversationId: convId,
      userId: uid,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString(),
    };

    const payload = {
      conversation_id: convId || null,
      message: text,
      user_id: uid || 'anonymous',
      role: userRole || 'citizen',
      language: lang || null,
      location: loc
        ? {
            latitude: loc.latitude,
            longitude: loc.longitude,
            city: loc.city || null,
            district: loc.district || null,
            state: loc.state || null,
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
    const assistantContent = data.message?.content || (typeof data.message === 'string' ? data.message : '');

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      conversationId: data.conversation_id,
      userId: uid,
      sender: 'assistant',
      text: assistantContent,
      timestamp: new Date().toISOString(),
      metadata: data.metadata,
    };

    return {
      userMessage,
      assistantMessage,
      updatedTitle: data.updated_title,
      conversationId: data.conversation_id,
      message: assistantContent,
      text: assistantContent,
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
