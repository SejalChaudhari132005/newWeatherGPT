import React from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { UIProvider, useUI } from './context/UIContext';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { UserProvider } from './contexts/UserContext';

import { MobileAppShell } from './components/layout/MobileAppShell';
import { AskWeatherGPTCard } from './components/dashboard/AskWeatherGPTCard';
import { RoleBasedAdvisoryCard } from './components/dashboard/RoleBasedAdvisoryCard';
import { FarmerAdvisory } from './components/roles/FarmerAdvisory';
import { FisherAdvisory } from './components/roles/FisherAdvisory';

import { LocationSelectorModal } from './components/location/LocationSelectorModal';
import { VoiceModal } from './components/common/VoiceModal';
import { ExplainableAIModal } from './components/common/ExplainableAIModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';

import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { PhoneAuthScreen } from './components/onboarding/PhoneAuthScreen';
import { OtpVerificationScreen } from './components/onboarding/OtpVerificationScreen';
import { ProfileSetupScreen } from './components/onboarding/ProfileSetupScreen';
import { RoleSelectionScreen } from './components/onboarding/RoleSelectionScreen';
import { RoleConfirmationScreen } from './components/onboarding/RoleConfirmationScreen';
import { LocationSetupScreen } from './components/onboarding/LocationSetupScreen';
import { LocationConfirmationScreen } from './components/onboarding/LocationConfirmationScreen';

import { DashboardPage } from './pages/DashboardPage';
import { FarmerDashboardPage } from './pages/FarmerDashboardPage';
import { FarmerWeatherPage } from './pages/FarmerWeatherPage';
import { FisherDashboardPage } from './pages/FisherDashboardPage';
import { AviationDashboardPage } from './pages/AviationDashboardPage';
import { AlertsPage } from './pages/AlertsPage';
import { AirQualityPage } from './pages/AirQualityPage';
import { ClimatePage } from './pages/ClimatePage';
import { WhatIfPage } from './pages/WhatIfPage';
import { TravelPage } from './pages/TravelPage';
import { MapPage } from './pages/MapPage';
import { FarmRoutePage } from './pages/FarmRoutePage';
import { EmergencyPage } from './pages/EmergencyPage';
import { Loader2 } from 'lucide-react';

import { ChatPage } from './pages/ChatPage';
import { ChatSidebar } from './components/sidebar/ChatSidebar';
import { chatService } from './services/chatService';
import { Conversation, ActiveNavPage } from './types/chat';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, emergencyMode } = useUI();
  const { profile } = useAuthContext();

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = React.useState<string | null>(null);

  const userId = profile?.user_id || 'dev_user';

  const loadConversations = React.useCallback(async () => {
    try {
      const list = await chatService.fetchConversations(userId);
      setConversations(list);
    } catch (e) {
      console.warn('[App] Failed to load conversations:', e);
    }
  }, [userId]);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleOpenChatWithPrompt = (promptText: string) => {
    setChatInitialPrompt(promptText);
    setActiveTab('ask');
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    setChatInitialPrompt(null);
    setActiveTab('ask');
  };

  const { activeRole, setActiveRole } = useWeather();

  const handleNavPage = (page: ActiveNavPage) => {
    if (page === 'dashboard') setActiveTab('home');
    else if (page === 'chat') setActiveTab('ask');
    else if (page === 'map') setActiveTab('radar');
    else if (page === 'travel') setActiveTab('travel');
    else if (page === 'alerts') setActiveTab('alerts');
    else if (page === 'climate') setActiveTab('climate');
    else if (page === 'settings' || page === 'profile') setActiveTab('home');
  };

  const renderActivePage = () => {
    if (emergencyMode) return <EmergencyPage />;

    switch (activeTab) {
      case 'home':
      case 'live':
        if (profile?.role?.toLowerCase() === 'farmer' || activeRole?.toLowerCase() === 'farmer') {
          return (
            <FarmerWeatherPage
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
            />
          );
        }
        return (
          <DashboardPage
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
            onNavigatePage={(page) => {
              if (page === 'home' || page === 'live') setActiveTab('home');
              else if (page === 'map' || page === 'radar') setActiveTab('radar');
              else if (page === 'travel') setActiveTab('travel');
              else if (page === 'alerts') setActiveTab('alerts');
              else if (page === 'advisories' || page === 'air_quality' || page === 'airQuality') {
                setActiveTab('advisories');
              } else if (page === 'farmer') {
                setActiveTab('farmer');
              } else if (page === 'fisher') {
                setActiveTab('fisher');
              } else if (page === 'aviation') {
                setActiveTab('aviation');
              }
            }}
          />
        );
      case 'ask':
      case 'chat':
        return (
          <ChatPage
            onOpenSidebar={() => setIsSidebarOpen(true)}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id)}
            onNavigate={handleNavPage}
            conversations={conversations}
            onRefreshConversations={loadConversations}
            initialPrompt={chatInitialPrompt}
            onClearInitialPrompt={() => setChatInitialPrompt(null)}
          />
        );
      case 'radar':
        if (profile?.role?.toLowerCase() === 'farmer' || activeRole?.toLowerCase() === 'farmer') {
          return (
            <FarmRoutePage
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
              onBack={() => setActiveTab('home')}
            />
          );
        }
        return (
          <MapPage
            onBack={() => setActiveTab('home')}
            onAskGpt={handleOpenChatWithPrompt}
          />
        );
      case 'travel':
        return (
          <TravelPage
            onBack={() => setActiveTab('home')}
            onAskGpt={handleOpenChatWithPrompt}
          />
        );
      case 'advisories':
        if (profile?.role?.toLowerCase() === 'farmer' || activeRole?.toLowerCase() === 'farmer') {
          return (
            <FarmerDashboardPage
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
              onBack={() => setActiveTab('home')}
            />
          );
        } else if (profile?.role?.toLowerCase() === 'fisher' || activeRole?.toLowerCase() === 'fisher') {
          return (
            <FisherDashboardPage
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
              onBack={() => setActiveTab('home')}
            />
          );
        } else if (profile?.role?.toLowerCase() === 'aviation' || activeRole?.toLowerCase() === 'aviation') {
          return (
            <AviationDashboardPage
              onOpenChatWithPrompt={handleOpenChatWithPrompt}
              onBack={() => setActiveTab('home')}
            />
          );
        }
        return <AirQualityPage onOpenChatWithPrompt={handleOpenChatWithPrompt} />;
      case 'farmer':
        return (
          <FarmerDashboardPage
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'fisher':
        return (
          <FisherDashboardPage
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'aviation':
        return (
          <AviationDashboardPage
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'alerts':
        return <AlertsPage onOpenChatWithPrompt={handleOpenChatWithPrompt} />;
      case 'climate':
        return <ClimatePage />;
      case 'whatif':
        return <WhatIfPage />;
      case 'emergency':
        return <EmergencyPage />;
      default:
        return (
          <DashboardPage
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
            onNavigatePage={(page) => {
              if (page === 'home' || page === 'live') setActiveTab('home');
              else if (page === 'map' || page === 'radar') setActiveTab('radar');
              else if (page === 'travel') setActiveTab('travel');
              else if (page === 'alerts') setActiveTab('alerts');
              else if (page === 'advisories' || page === 'air_quality' || page === 'airQuality') {
                if (profile?.role?.toLowerCase() === 'farmer' || activeRole?.toLowerCase() === 'farmer') {
                  setActiveTab('farmer');
                } else if (profile?.role?.toLowerCase() === 'fisher' || activeRole?.toLowerCase() === 'fisher') {
                  setActiveTab('fisher');
                } else if (profile?.role?.toLowerCase() === 'aviation' || activeRole?.toLowerCase() === 'aviation') {
                  setActiveTab('aviation');
                } else {
                  setActiveTab('advisories');
                }
              } else if (page === 'farmer') {
                setActiveTab('farmer');
              } else if (page === 'farmroute' || page === 'plan' || page === 'planMyDay') {
                setActiveTab('radar');
              } else if (page === 'fisher') {
                setActiveTab('fisher');
              } else if (page === 'aviation') {
                setActiveTab('aviation');
              }
            }}
          />

        );
    }
  };

  return (
    <>
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onRenameConversation={async (conv) => {
          const newTitle = prompt('Enter new conversation title:', conv.title);
          if (newTitle && newTitle.trim()) {
            await chatService.renameConversation(conv.id, newTitle.trim(), userId);
            loadConversations();
          }
        }}
        onDeleteConversation={async (conv) => {
          if (confirm(`Delete conversation "${conv.title}"?`)) {
            await chatService.deleteConversation(conv.id, userId);
            if (activeConversationId === conv.id) {
              setActiveConversationId(undefined);
            }
            loadConversations();
          }
        }}
        activeNavPage={activeTab === 'ask' || activeTab === 'chat' ? 'chat' : 'dashboard'}
        onNavigate={handleNavPage}
      />
      <MobileAppShell onOpenSidebar={() => setIsSidebarOpen(true)}>
        <LocationSelectorModal />
        <VoiceModal />
        <ExplainableAIModal />
        <PwaInstallPrompt />
        {renderActivePage()}
      </MobileAppShell>
    </>
  );
};

const RootRouter: React.FC = () => {
  const { authStatus, onboardingStep } = useAuthContext();

  if (authStatus === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Restoring WeatherGPT Session...</span>
        </div>
      </div>
    );
  }

  if (authStatus === 'PROFILE_COMPLETE' || onboardingStep === 'COMPLETE') {
    return <MainAppContent />;
  }

  switch (onboardingStep) {
    case 'WELCOME':
      return <WelcomeScreen />;
    case 'PHONE':
      return <PhoneAuthScreen />;
    case 'OTP':
      return <OtpVerificationScreen />;
    case 'USERNAME':
      return <ProfileSetupScreen />;
    case 'ROLE':
      return <RoleSelectionScreen />;
    case 'ROLE_CONFIRM':
      return <RoleConfirmationScreen />;
    case 'LOCATION':
      return <LocationSetupScreen />;
    case 'LOCATION_CONFIRM':
      return <LocationConfirmationScreen />;
    default:
      return <WelcomeScreen />;
  }
};

export function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <UIProvider>
          <AuthProvider>
            <UserProvider>
              <LocationProvider>
                <WeatherProvider>
                  <RootRouter />
                </WeatherProvider>
              </LocationProvider>
            </UserProvider>
          </AuthProvider>
        </UIProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
