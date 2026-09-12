import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../hooks/useLocation';
import { Conversation, ChatMessage as ChatMessageType, ActiveNavPage } from '../types/chat';
import { chatService, getSuggestedPromptsByRole } from '../services/chatService';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { SuggestionCard } from '../components/chat/SuggestionCard';
import { VoiceInputModal } from '../components/chat/VoiceInputModal';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react';

interface Props {
  onOpenSidebar: () => void;
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNavigate: (page: ActiveNavPage) => void;
  conversations: Conversation[];
  onRefreshConversations: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const CHAT_I18N: Record<string, {
  greeting: (name: string) => string;
  subtitle: string;
  locationLabel: string;
  suggestedTitle: string;
  retry: string;
  errorLoad: string;
  errorSend: string;
  renameTitle: string;
  deleteTitle: string;
  deleteSubtitle: string;
  cancel: string;
  delete: string;
  save: string;
  placeholderTitle: string;
}> = {
  mr: {
    greeting: (name) => `नमस्कार, ${name}!`,
    subtitle: 'मी WeatherGPT. आपल्या परिसरातील अचूक हवामान, पावसाचा अंदाज आणि सल्ले जाणून घ्या.',
    locationLabel: 'सध्याचे स्थान:',
    suggestedTitle: 'सुचवलेले प्रश्न',
    retry: 'पुन्हा प्रयत्न करा',
    errorLoad: 'WeatherGPT संभाषण लोड करू शकले नाही.',
    errorSend: 'WeatherGPT संदेश पाठवू शकले नाही. कृपया पुन्हा प्रयत्न करा.',
    renameTitle: 'संभाषणाचे नाव बदला',
    deleteTitle: 'संभाषण हटवायचे का?',
    deleteSubtitle: 'हे संभाषण कायमचे काढले जाईल.',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    save: 'जतन करा',
    placeholderTitle: 'संभाषणाचे शीर्षक प्रविष्ट करा',
  },
  hi: {
    greeting: (name) => `नमस्ते, ${name}!`,
    subtitle: 'मैं WeatherGPT हूँ। अपने क्षेत्र का सटीक मौसम, बारिश का पूर्वानुमान और चेतावनियां जानें।',
    locationLabel: 'वर्तमान स्थान:',
    suggestedTitle: 'सुझाए गए प्रश्न',
    retry: 'पुनः प्रयास करें',
    errorLoad: 'WeatherGPT बातचीत लोड नहीं कर सका।',
    errorSend: 'WeatherGPT संदेश नहीं भेज सका। कृपया पुनः प्रयास करें।',
    renameTitle: 'बातचीत का नाम बदलें',
    deleteTitle: 'बातचीत हटाएं?',
    deleteSubtitle: 'यह बातचीत हमेशा के लिए हटा दी जाएगी।',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    save: 'सहेजें',
    placeholderTitle: 'बातचीत का शीर्षक दर्ज करें',
  },
  ta: {
    greeting: (name) => `வணக்கம், ${name}!`,
    subtitle: 'நான் WeatherGPT. உங்கள் பகுதிக்கான வானிலை, முன்னறிவிப்பு மற்றும் எச்சரிக்கைகளை அறியலாம்.',
    locationLabel: 'தற்போதைய இடம்:',
    suggestedTitle: 'பரிந்துரைக்கப்பட்ட கேள்விகள்',
    retry: 'மீண்டும் முயற்சிக்கவும்',
    errorLoad: 'உரையாடலை ஏற்ற முடியவில்லை.',
    errorSend: 'செய்தியை அனுப்ப முடியவில்லை.',
    renameTitle: 'தலைப்பை மாற்றவும்',
    deleteTitle: 'உரையாடலை நீக்கவா?',
    deleteSubtitle: 'இந்த உரையாடல் நிரந்தரமாக நீக்கப்படும்.',
    cancel: 'ரத்து செய்',
    delete: 'நீக்கு',
    save: 'சேமி',
    placeholderTitle: 'உரையாடலின் தலைப்பை உள்ளிடவும்',
  },
  te: {
    greeting: (name) => `నమస్కారం, ${name}!`,
    subtitle: 'నేను WeatherGPT. మీ ప్రాంతం యొక్క వాతావరణం, వర్ష సూచన మరియు హెచ్చరికలను తెలుసుకోండి.',
    locationLabel: 'ప్రస్తుత స్థానం:',
    suggestedTitle: 'సూచించిన ప్రశ్నలు',
    retry: 'మళ్ళీ ప్రయత్నించండి',
    errorLoad: 'సంభాషణను లోడ్ చేయడం సాధ్యపడలేదు.',
    errorSend: 'సందేశాన్ని పంపడం సాధ్యపడలేదు.',
    renameTitle: 'శీర్షికను మార్చండి',
    deleteTitle: 'సంభాషణను తొలగించాలా?',
    deleteSubtitle: 'ఈ సంభాషణ శాశ్వతంగా తొలగించబడుతుంది.',
    cancel: 'రద్దు చేయి',
    delete: 'తొలగించు',
    save: 'సేవ్ చేయి',
    placeholderTitle: 'సంభాషణ శీర్షికను నమోదు చేయండి',
  },
  kn: {
    greeting: (name) => `ನಮಸ್ಕಾರ, ${name}!`,
    subtitle: 'ನಾನು WeatherGPT. ನಿಮ್ಮ ಪ್ರದೇಶದ ಹವಾಮಾನ, ಮಳೆಯ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳನ್ನು ತಿಳಿಯಿರಿ.',
    locationLabel: 'ಪ್ರಸ್ತುತ ಸ್ಥಳ:',
    suggestedTitle: 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು',
    retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    errorLoad: 'ಸಂಭಾಷಣೆಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
    errorSend: 'ಸಂದೇಶ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
    renameTitle: 'ಶೀರ್ಷಿಕೆ ಬದಲಾಯಿಸಿ',
    deleteTitle: 'ಸಂಭಾಷಣೆ ಅಳಿಸುವುದೇ?',
    deleteSubtitle: 'ಈ ಸಂಭಾಷಣೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ.',
    cancel: 'ರದ್ದುಮಾಡಿ',
    delete: 'ಅಳಿಸಿ',
    save: 'ಉಳಿಸಿ',
    placeholderTitle: 'ಸಂಭಾಷಣೆಯ ಶೀರ್ಷಿಕೆಯನ್ನು ನಮೂದಿಸಿ',
  },
  bn: {
    greeting: (name) => `নমস্কার, ${name}!`,
    subtitle: 'আমি WeatherGPT। আপনার এলাকার সঠিক আবহাওয়া, বৃষ্টির পূর্বাভাস ও সতর্কতা জানুন।',
    locationLabel: 'বর্তমান অবস্থান:',
    suggestedTitle: 'প্রস্তাবিত প্রশ্নাবলী',
    retry: 'আবার চেষ্টা করুন',
    errorLoad: 'কথোপকথন লোড করা যায়নি।',
    errorSend: 'বার্তা পাঠানো যায়নি।',
    renameTitle: 'শিরোনাম পরিবর্তন করুন',
    deleteTitle: 'কথোপকথন মুছবেন?',
    deleteSubtitle: 'এই কথোপকথন স্থায়ীভাবে মুছে ফেলা হবে।',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    save: 'সংরক্ষণ করুন',
    placeholderTitle: 'কথোপকথনের শিরোনাম লিখুন',
  },
  gu: {
    greeting: (name) => `નમસ્તે, ${name}!`,
    subtitle: 'હું WeatherGPT છું. તમારા વિસ્તારનું સચોટ હવામાન, વરસાદની આગાહી અને ચેતવણીઓ જાણો.',
    locationLabel: 'વર્તમાન સ્થળ:',
    suggestedTitle: 'સૂચવેલા પ્રશ્નો',
    retry: 'ફરી પ્રયાસ કરો',
    errorLoad: 'વાતચીત લોડ થઈ શકી નથી.',
    errorSend: 'સંદેશ મોકલી શકાયો નથી.',
    renameTitle: 'શીર્ષક બદલો',
    deleteTitle: 'વાતચીત કાઢી નાખવી?',
    deleteSubtitle: 'આ વાતચીત કાયમ માટે દૂર કરવામાં આવશે.',
    cancel: 'રદ કરો',
    delete: 'કાઢી નાખો',
    save: 'સાચવો',
    placeholderTitle: 'વાતચીતનું શીર્ષક દાખલ કરો',
  },
  pa: {
    greeting: (name) => `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ${name}!`,
    subtitle: 'ਮੈਂ WeatherGPT ਹਾਂ। ਆਪਣੇ ਖੇਤਰ ਦਾ ਮੌਸਮ, ਮੀਂਹ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ ਅਤੇ ਚੇਤਾਵਨੀਆਂ ਜਾਣੋ।',
    locationLabel: 'ਮੌਜੂਦਾ ਸਥਾਨ:',
    suggestedTitle: 'ਸੁਝਾਏ ਗਏ ਸਵਾਲ',
    retry: 'ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    errorLoad: 'ਗੱਲਬਾਤ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ।',
    errorSend: 'ਸੁਨੇਹਾ ਭੇਜਿਆ ਨਹੀਂ ਜਾ ਸਕਿਆ।',
    renameTitle: 'ਸਿਰਲੇਖ ਬਦਲੋ',
    deleteTitle: 'ਗੱਲਬਾਤ ਮਿਟਾਓ?',
    deleteSubtitle: 'ਇਹ ਗੱਲਬਾਤ ਪੱਕੇ ਤੌਰ ਤੇ ਹਟਾ ਦਿੱਤੀ ਜਾਵੇਗੀ।',
    cancel: 'ਰੱਦ ਕਰੋ',
    delete: 'ਮਿਟਾਓ',
    save: 'ਸੰਭਾਲੋ',
    placeholderTitle: 'ਗੱਲਬਾਤ ਦਾ ਸਿਰਲੇਖ ਦਰਜ ਕਰੋ',
  },
  ml: {
    greeting: (name) => `നമസ്കാരം, ${name}!`,
    subtitle: 'ഞാൻ WeatherGPT. നിങ്ങളുടെ പ്രദേശത്തെ കാലാവസ്ഥയും മഴ മുന്നറിയിപ്പുകളും അറിയുക.',
    locationLabel: 'നിലവിലെ സ്ഥലം:',
    suggestedTitle: 'നിർദ്ദേശിച്ച ചോദ്യങ്ങൾ',
    retry: 'വീണ്ടും ശ്രമിക്കുക',
    errorLoad: 'സംഭാഷണം ലോഡ് ചെയ്യാനായില്ല.',
    errorSend: 'സന്ദേശം അയയ്ക്കാനായില്ല.',
    renameTitle: 'തലക്കെട്ട് മാറ്റുക',
    deleteTitle: 'സംഭാഷണം ഇല്ലാതാക്കണോ?',
    deleteSubtitle: 'ഈ സംഭാഷണം ശാശ്വതമായി നീക്കം ചെയ്യപ്പെടും.',
    cancel: 'റദ്ദാക്കുക',
    delete: 'ഇല്ലാതാക്കുക',
    save: 'സംരക്ഷിക്കുക',
    placeholderTitle: 'സംഭാഷണ തലക്കെട്ട് നൽകുക',
  },
  or: {
    greeting: (name) => `ନମସ୍କାର, ${name}!`,
    subtitle: 'ମୁଁ WeatherGPT। ଆପଣଙ୍କ ଅଞ୍ଚଳର ପାଣିପାଗ, ବର୍ଷା ପୂର୍ବାନୁମାନ ଏବଂ ସତର୍କତା ଜାଣନ୍ତୁ।',
    locationLabel: 'ବର୍ତ୍ତମାନର ସ୍ଥାନ:',
    suggestedTitle: 'ପ୍ରସ୍ତାବିତ ପ୍ରଶ୍ନ',
    retry: 'ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ',
    errorLoad: 'ବାର୍ତ୍ତାଳାପ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ।',
    errorSend: 'ସନ୍ଦେଶ ପଠାଯାଇ ପାରିଲା ନାହିଁ।',
    renameTitle: 'ଶୀର୍ଷକ ପରିବର୍ତ୍ତନ କରନ୍ତୁ',
    deleteTitle: 'ବାର୍ତ୍ତାଳାପ ଡିଲିଟ୍ କରିବେ କି?',
    deleteSubtitle: 'ଏହି ବାର୍ତ୍ତାଳାପ ସ୍ଥାୟୀ ଭାବରେ ଅପସାରଣ କରାଯିବ।',
    cancel: 'ବାତିଲ୍ କରନ୍ତୁ',
    delete: 'ଡିଲିଟ୍ କରନ୍ତୁ',
    save: 'ସେଭ୍ କରନ୍ତୁ',
    placeholderTitle: 'ବାର୍ତ୍ତାଳାପ ଶୀର୍ଷକ ପ୍ରବେଶ କରନ୍ତୁ',
  },
  en: {
    greeting: (name) => `Hello, ${name}!`,
    subtitle: "I'm WeatherGPT. Ask anything about current weather, rain forecasts, radar or advisories.",
    locationLabel: 'Location:',
    suggestedTitle: 'Suggested Questions',
    retry: 'Retry',
    errorLoad: "WeatherGPT couldn't load this conversation.",
    errorSend: "WeatherGPT couldn't send your message. Please try again.",
    renameTitle: 'Rename Conversation',
    deleteTitle: 'Delete conversation?',
    deleteSubtitle: 'This conversation will be permanently removed.',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save Title',
    placeholderTitle: 'Enter conversation title',
  },
};

export const ChatPage: React.FC<Props> = ({
  onOpenSidebar,
  activeConversationId,
  onSelectConversation,
  onNavigate,
  conversations,
  onRefreshConversations,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { location } = useLocation();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Rename & Delete Modals
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = profile?.user_id || 'dev_user';
  const userRole = profile?.role || 'citizen';
  const city = location?.city || profile?.city || '';
  const state = location?.state || profile?.state || '';
  const defaultLocName = language === 'mr' ? 'स्थानिक परिसर' : language === 'hi' ? 'स्थानीय क्षेत्र' : 'Local Area';
  const locationDisplay = city ? (state ? `${city}, ${state}` : city) : (location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : defaultLocName);

  const tStrings = CHAT_I18N[language] || CHAT_I18N.en;
  const username = profile?.username || (language === 'mr' ? 'मित्र' : language === 'hi' ? 'मित्र' : 'Friend');

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMsgs = async () => {
      setIsLoadingMessages(true);
      setErrorNotice(null);
      try {
        const msgs = await chatService.fetchMessages(activeConversationId);
        setMessages(msgs);
      } catch (err) {
        setErrorNotice(tStrings.errorLoad);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMsgs();
  }, [activeConversationId, tStrings.errorLoad]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle sending a user prompt
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const trimmed = text.trim();
    if (trimmed === 'navigate_map' || trimmed.toLowerCase() === 'navigate_radar' || trimmed.toLowerCase() === 'map' || trimmed.toLowerCase() === 'radar') {
      onNavigate('map');
      return;
    }
    if (trimmed === 'navigate_advisories' || trimmed.toLowerCase() === 'advisories') {
      onNavigate('advisories' as any);
      return;
    }
    if (trimmed === 'navigate_alerts' || trimmed.toLowerCase() === 'alerts') {
      onNavigate('alerts');
      return;
    }

    let convId = activeConversationId;
    setErrorNotice(null);

    // Pass user's real GPS or profile location
    const targetLocation = location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city || city || undefined,
      district: location.district || undefined,
      state: location.state || state || undefined,
    } : (profile?.latitude && profile?.longitude ? {
      latitude: profile.latitude,
      longitude: profile.longitude,
      city: profile.city || undefined,
      district: undefined,
      state: profile.state || undefined,
    } : undefined);

    const optimisticUserMsg: ChatMessageType = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsSending(true);

    try {
      const result = await chatService.sendMessage(
        convId,
        userId,
        text,
        userRole,
        targetLocation,
        language
      );

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticUserMsg.id);
        return [...filtered, result.userMessage, result.assistantMessage];
      });
      setIsSending(false);

      if (!activeConversationId && result.conversationId) {
        onSelectConversation(result.conversationId);
      }
      onRefreshConversations();
    } catch (err: any) {
      setErrorNotice(err?.message || tStrings.errorSend);
      setIsSending(false);
    }
  };

  // Auto-send initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Rename action submit
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newTitleInput.trim()) return;
    await chatService.renameConversation(renameTarget.id, newTitleInput.trim(), userId);
    setRenameTarget(null);
    onRefreshConversations();
  };

  // Delete action submit
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    await chatService.deleteConversation(deleteTarget.id, userId);
    if (activeConversationId === deleteTarget.id) {
      onSelectConversation('');
    }
    setDeleteTarget(null);
    onRefreshConversations();
  };

  const suggestions = getSuggestedPromptsByRole(userRole, language);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F7F9] font-sans relative">
      {/* Main Chat Body Container - flex-1 scrollable area */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 max-w-4xl mx-auto w-full flex flex-col justify-between">
        {errorNotice && (
          <div className="gov-panel p-3 mb-2 border-l-4 border-l-[#B42318] bg-red-50/50 text-xs font-bold text-[#B42318] flex items-center justify-between animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => activeConversationId && chatService.fetchMessages(activeConversationId)}
              className="gov-btn-danger px-2.5 py-1 text-[11px] font-bold"
            >
              {tStrings.retry}
            </button>
          </div>
        )}

        {/* --- EMPTY CHAT / WELCOME STATE --- */}
        {messages.length === 0 && !isSending && !isLoadingMessages ? (
          <div className="flex-1 flex flex-col justify-center py-4 text-center space-y-3 sm:space-y-4 animate-fadeIn my-auto max-w-xl mx-auto w-full">
            {/* Government Service Welcome Panel */}
            <div className="gov-panel p-4 sm:p-5 space-y-2.5 text-center">
              <div className="w-10 h-10 bg-[#006B3C] text-white flex items-center justify-center mx-auto text-xs font-bold">
                IMD
              </div>

              <h2 className="text-base sm:text-lg font-bold text-[#17365D] uppercase tracking-wide">
                {tStrings.greeting(username)}
              </h2>

              <p className="text-xs text-[#5B6770] leading-relaxed max-w-md mx-auto">
                {tStrings.subtitle}
              </p>

              {/* Exact Location Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#D6DCE1] text-xs font-medium text-[#1F2933]">
                <span className="text-[#5B6770] font-semibold">{tStrings.locationLabel}</span>
                <span className="text-[#17365D] font-bold">{locationDisplay}</span>
              </div>
            </div>

            {/* Suggested Question Prompt Cards */}
            <div className="space-y-1.5 text-left w-full">
              <div className="text-[10px] font-bold uppercase text-[#17365D] tracking-wider px-1">
                {tStrings.suggestedTitle}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.slice(0, 4).map((sug) => (
                  <SuggestionCard
                    key={sug.id}
                    suggestion={sug}
                    onClick={handleSendMessage}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* --- ACTIVE MESSAGES FEED --- */
          <div className="space-y-3 pb-2 flex-1">
            {messages.map((msg, idx) => {
              let prevUserQuery = '';
              if (msg.sender === 'assistant') {
                for (let i = idx - 1; i >= 0; i--) {
                  if (messages[i].sender === 'user') {
                    prevUserQuery = messages[i].text;
                    break;
                  }
                }
              }

              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onFollowupClick={handleSendMessage}
                  onNavigate={onNavigate}
                  onRegenerate={prevUserQuery ? () => handleSendMessage(prevUserQuery) : undefined}
                />
              );
            })}

            {isSending && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Permanently Pinned Bottom Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
        isLoading={isSending}
      />

      {/* Voice Recognition Modal */}
      <VoiceInputModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTranscriptCaptured={(text) => handleSendMessage(text)}
      />

      {/* Rename Dialog Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white p-4 space-y-3 border border-[#D6DCE1] shadow-lg">
            <h3 className="text-sm font-bold text-[#17365D] uppercase tracking-wide flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#006B3C]" />
              <span>{tStrings.renameTitle}</span>
            </h3>

            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <input
                type="text"
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                placeholder={tStrings.placeholderTitle}
                className="w-full px-3 py-2 bg-white border border-[#D6DCE1] text-xs font-semibold text-[#1F2933] focus:outline-none focus:border-[#006B3C]"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="gov-btn-secondary px-3 py-1.5 text-xs font-bold"
                >
                  {tStrings.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newTitleInput.trim()}
                  className="gov-btn-primary px-3 py-1.5 text-xs font-bold uppercase disabled:opacity-50"
                >
                  {tStrings.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white p-4 space-y-3 border border-[#D6DCE1] shadow-lg text-center font-sans">
            <div className="w-10 h-10 bg-red-50 text-[#B42318] border border-red-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#17365D] uppercase tracking-wide">{tStrings.deleteTitle}</h3>
              <p className="text-xs text-[#5B6770] pt-1">{tStrings.deleteSubtitle}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="gov-btn-secondary flex-1 py-2 text-xs font-bold"
              >
                {tStrings.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="gov-btn-danger flex-1 py-2 text-xs font-bold uppercase"
              >
                {tStrings.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
