import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Activity,
  Map,
  Radar,
  Car,
  AlertTriangle,
  TrendingUp,
  Settings,
  User,
  MessageSquare,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Conversation, ActiveNavPage } from '../../types/chat';
import { ConversationItem } from './ConversationItem';
import { useAuthContext } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  activeNavPage: ActiveNavPage;
  onNavigate: (page: ActiveNavPage) => void;
}

export const ChatSidebar: React.FC<Props> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  activeNavPage,
  onNavigate,
}) => {
  const { profile, signOut } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations with search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group conversations by date (TODAY, YESTERDAY, OLDER)
  const groupedConversations = useMemo(() => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    filteredConversations.forEach((conv) => {
      const convTime = new Date(conv.updatedAt || conv.createdAt).getTime();
      if (convTime >= todayStart) {
        today.push(conv);
      } else if (convTime >= yesterdayStart) {
        yesterday.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, older };
  }, [filteredConversations]);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel (Slide-over drawer on Mobile, Fixed sidebar on Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 shadow-2xl md:shadow-none flex flex-col justify-between transition-transform duration-300 font-['Arimo'] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="p-4 border-b border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/assets/logo-icon.png" alt="WeatherGPT Logo" className="w-7 h-7 object-contain" />
              <span className="text-lg font-black text-black tracking-tight font-['Arimo']">
                WeatherGPT
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* + New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#38b6ff] to-[#004aad] hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-blue-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Chat</span>
          </button>

          {/* Search Input Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/20 focus:border-[#38b6ff]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Scrollable Conversation History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 space-y-2 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-bold">No conversations yet.</p>
              <p className="text-[10px]">Start your first weather conversation above.</p>
            </div>
          ) : (
            <>
              {/* TODAY */}
              {groupedConversations.today.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                    Today
                  </div>
                  {groupedConversations.today.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={activeNavPage === 'chat' && activeConversationId === conv.id}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        onNavigate('chat');
                        onClose();
                      }}
                      onRename={() => onRenameConversation(conv)}
                      onDelete={() => onDeleteConversation(conv)}
                    />
                  ))}
                </div>
              )}

              {/* YESTERDAY */}
              {groupedConversations.yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                    Yesterday
                  </div>
                  {groupedConversations.yesterday.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={activeNavPage === 'chat' && activeConversationId === conv.id}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        onNavigate('chat');
                        onClose();
                      }}
                      onRename={() => onRenameConversation(conv)}
                      onDelete={() => onDeleteConversation(conv)}
                    />
                  ))}
                </div>
              )}

              {/* OLDER */}
              {groupedConversations.older.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                    Previous Chats
                  </div>
                  {groupedConversations.older.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={activeNavPage === 'chat' && activeConversationId === conv.id}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        onNavigate('chat');
                        onClose();
                      }}
                      onRename={() => onRenameConversation(conv)}
                      onDelete={() => onDeleteConversation(conv)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Platform Navigation Links */}
          <div className="pt-3 border-t border-slate-200/80 space-y-1">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 mb-1">
              Navigation
            </div>

            <button
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${
                activeNavPage === 'dashboard'
                  ? 'bg-sky-50 text-[#004aad]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4 text-sky-500" />
              <span>📊 Live Dashboard</span>
            </button>

            <button
              onClick={() => {
                onNavigate('map');
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${
                activeNavPage === 'map'
                  ? 'bg-sky-50 text-[#004aad]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Radar className="w-4 h-4 text-emerald-500" />
              <span>📡 IMD Live Radar & Map</span>
            </button>

            <button
              onClick={() => {
                onNavigate('travel');
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${
                activeNavPage === 'travel'
                  ? 'bg-sky-50 text-[#004aad]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Car className="w-4 h-4 text-indigo-500" />
              <span>🚗 Travel & Route Weather</span>
            </button>

            <button
              onClick={() => {
                onNavigate('alerts');
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${
                activeNavPage === 'alerts'
                  ? 'bg-sky-50 text-[#004aad]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>🚨 Alerts</span>
            </button>

            <button
              onClick={() => {
                onNavigate('climate');
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${
                activeNavPage === 'climate'
                  ? 'bg-sky-50 text-[#004aad]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>📈 Climate</span>
            </button>
          </div>
        </div>

        {/* Bottom User Settings & Profile Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 space-y-1">
          <button
            onClick={() => {
              onNavigate('settings');
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeNavPage === 'settings' ? 'bg-sky-100 text-[#004aad]' : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>⚙ Settings</span>
          </button>

          <button
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeNavPage === 'profile' ? 'bg-sky-100 text-[#004aad]' : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <User className="w-4 h-4 text-slate-500" />
            <span className="truncate">👤 {profile?.username || 'Profile'}</span>
          </button>

          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
