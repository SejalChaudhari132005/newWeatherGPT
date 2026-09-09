import React from 'react';
import { MobileAppShell } from '../components/layout/MobileAppShell';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <MobileAppShell>
      {children}
    </MobileAppShell>
  );
};

export default AppLayout;
