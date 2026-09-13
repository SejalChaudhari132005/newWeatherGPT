import React from 'react';
import { UrbanPlannerWeatherPage } from './UrbanPlannerWeatherPage';

interface UrbanPlannerDashboardPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onBack?: () => void;
}

export const UrbanPlannerDashboardPage: React.FC<UrbanPlannerDashboardPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  return <UrbanPlannerWeatherPage onOpenChatWithPrompt={onOpenChatWithPrompt} />;
};
