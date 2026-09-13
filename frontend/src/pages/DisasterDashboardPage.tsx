import React from 'react';
import { DisasterWeatherPage } from './DisasterWeatherPage';

interface DisasterDashboardPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onBack?: () => void;
}

export const DisasterDashboardPage: React.FC<DisasterDashboardPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  return <DisasterWeatherPage onOpenChatWithPrompt={onOpenChatWithPrompt} />;
};
