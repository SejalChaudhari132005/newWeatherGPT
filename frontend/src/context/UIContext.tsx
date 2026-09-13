import React, { createContext, useContext, useState } from 'react';

export type ActiveTab =
  | 'home'
  | 'ask'
  | 'chat'
  | 'live'
  | 'radar'
  | 'alerts'
  | 'advisories'
  | 'climate'
  | 'whatif'
  | 'travel'
  | 'emergency'
  | 'farmer'
  | 'fisher'
  | 'aviation'
  | 'skyroute'
  | 'weatherlab'
  | 'researcher';

interface UIContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  simpleMode: boolean;
  setSimpleMode: React.Dispatch<React.SetStateAction<boolean>>;
  emergencyMode: boolean;
  setEmergencyMode: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  locationModalOpen: boolean;
  setLocationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  voiceModalOpen: boolean;
  setVoiceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  explainModalOpen: boolean;
  setExplainModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [simpleMode, setSimpleMode] = useState<boolean>(false);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [explainModalOpen, setExplainModalOpen] = useState<boolean>(false);

  return (
    <UIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        simpleMode,
        setSimpleMode,
        emergencyMode,
        setEmergencyMode,
        sidebarOpen,
        setSidebarOpen,
        locationModalOpen,
        setLocationModalOpen,
        voiceModalOpen,
        setVoiceModalOpen,
        explainModalOpen,
        setExplainModalOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
