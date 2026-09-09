import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../hooks/useLocation';
import { Conversation, ChatMessage as ChatMessageType, ActiveNavPage } from '../types/chat';
import { chatService, getSuggestedPromptsByRole } from '../services/chatService';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { SuggestionCard } from '../components/chat/SuggestionCard';
import { VoiceInputModal } from '../components/chat/VoiceInputModal';
import { WeatherGptLogo } from '../components/common/WeatherGptLogo';
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
  const locationDisplay = city ? (state ? `${city}, ${state}` : city) : (location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : 'Local Area');

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
        setErrorNotice("WeatherGPT couldn't load this conversation.");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMsgs();
  }, [activeConversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle sending a user prompt
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    let convId = activeConversationId;
    setErrorNotice(null);

    // Pass user's real GPS or profile location, or undefined to trigger location request
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

      setMessages((prev) => [...prev, result.userMessage, result.assistantMessage]);
      setIsSending(false);

      if (!activeConversationId && result.conversationId) {
        onSelectConversation(result.conversationId);
      }
      onRefreshConversations();
    } catch (err: any) {
      setErrorNotice(err?.message || "WeatherGPT couldn't send your message. Please try again.");
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

  const suggestions = getSuggestedPromptsByRole(userRole);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F4F7FC] font-['Arimo'] relative">
      {/* Header */}
      <ChatHeader
        onOpenSidebar={onOpenSidebar}
        onNavigateProfile={() => onNavigate('profile')}
        onNavigateLocation={() => onNavigate('profile')}
        onNavigateDashboard={() => onNavigate('dashboard')}
      />

      {/* Main Chat Body Container */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full flex flex-col justify-between">
        {errorNotice && (
          <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => activeConversationId && chatService.fetchMessages(activeConversationId)}
              className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-extrabold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* --- EMPTY CHAT / WELCOME STATE --- */}
        {(!activeConversationId || (messages.length === 0 && !isLoadingMessages)) ? (
          <div className="my-auto py-8 text-center space-y-6 animate-fadeIn font-['Arimo']">
            {/* Logo & Welcome Banner */}
            <div className="space-y-3">
              <div className="flex justify-center">
                <WeatherGptLogo size="lg" showText={false} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Hello, <span className="text-[#004aad]">{profile?.username || 'Friend'}</span>! 👋
              </h2>

              <p className="text-sm font-bold text-slate-600 max-w-md mx-auto leading-relaxed">
                I'm WeatherGPT. I can help you understand the weather, forecasts, warnings and weather-related decisions for your location.
              </p>

              {/* Exact Location Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-xs font-black text-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold">Current location:</span>
                <span className="text-slate-900 underline decoration-[#38b6ff]">📍 {locationDisplay}</span>
              </div>
            </div>

            {/* Suggested Question Prompt Cards */}
            <div className="space-y-2 text-left max-w-lg mx-auto pt-2">
              <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider px-1">
                Suggested Questions
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suggestions.map((sug) => (
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
          <div className="space-y-4 pb-4 flex-1">
            {messages.map((msg, idx) => {
              // Find the prompt that generated this assistant response if regenerating
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
                  onRegenerate={prevUserQuery ? () => handleSendMessage(prevUserQuery) : undefined}
                />
              );
            })}

            {isSending && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Fixed Bottom Chat Input Bar */}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#38b6ff]" />
              <span>Rename Conversation</span>
            </h3>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                placeholder="Enter conversation title"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#38b6ff]"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitleInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#004aad] text-white text-xs font-extrabold shadow-md cursor-pointer disabled:bg-slate-300"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 text-center font-['Arimo']">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Delete conversation?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">This conversation will be permanently removed.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
