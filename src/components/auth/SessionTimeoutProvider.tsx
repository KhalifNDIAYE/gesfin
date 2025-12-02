import React from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  enabled?: boolean;
}

export const SessionTimeoutProvider: React.FC<SessionTimeoutProviderProps> = ({ 
  children,
  timeoutMinutes = 30,
  enabled = true
}) => {
  useSessionTimeout({ timeoutMinutes, enabled });
  
  return <>{children}</>;
};
