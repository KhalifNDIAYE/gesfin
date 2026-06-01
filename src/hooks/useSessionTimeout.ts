import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
const WARNING_BEFORE_TIMEOUT_MS = 60 * 1000; // 1 minute warning

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  enabled?: boolean;
}

export const useSessionTimeout = ({ 
  timeoutMinutes = 30, 
  enabled = true 
}: UseSessionTimeoutOptions = {}) => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const timeoutMs = timeoutMinutes * 60 * 1000;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(async () => {
    clearTimers();
    toast({
      title: "Session expirée",
      description: "Vous avez été déconnecté pour inactivité.",
      variant: "destructive",
    });
    await signOut();
  }, [signOut, clearTimers]);

  const showWarning = useCallback(() => {
    toast({
      title: "Session bientôt expirée",
      description: "Votre session expirera dans 1 minute en raison d'inactivité.",
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled || !user) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer
    const warningDelay = timeoutMs - WARNING_BEFORE_TIMEOUT_MS;
    if (warningDelay > 0) {
      warningRef.current = setTimeout(showWarning, warningDelay);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
  }, [enabled, user, timeoutMs, clearTimers, showWarning, handleTimeout]);

  useEffect(() => {
    if (!enabled || !user) {
      clearTimers();
      return;
    }

    // Initial timer setup
    resetTimer();

    // Activity event listeners
    const handleActivity = () => {
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, user, resetTimer, clearTimers]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
};
