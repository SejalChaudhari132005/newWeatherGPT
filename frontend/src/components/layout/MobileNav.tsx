import React from 'react';
import { Home, MessageSquare, Radar, Bell, Car, User } from 'lucide-react';
import { useUI, ActiveTab } from '../../context/UIContext';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, setLocationModalOpen } = useUI();

  const navItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ask', label: 'Ask', icon: MessageSquare },
    { id: 'radar', label: 'Radar', icon: Radar },
    { id: 'travel', label: 'Travel', icon: Car },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
              isActive ? 'text-sky-600 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-sky-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={() => setLocationModalOpen(true)}
        className="flex flex-col items-center py-1 px-3 text-slate-500 font-medium"
      >
        <User className="w-5 h-5 mb-0.5 text-slate-400" />
        <span className="text-[10px]">Location</span>
      </button>
    </div>
  );
};
