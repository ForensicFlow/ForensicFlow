import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSessionTimeoutOptions {
  timeout: number; // Session timeout in milliseconds
  warningTime: number; // Show warning before timeout (in milliseconds)
  onTimeout: () => void; // Callback when session expires
}

export const useSessionTimeout = ({
  timeout,
  warningTime,
  onTimeout,
}: UseSessionTimeoutOptions) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningTime / 1000);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const startCountdown = useCallback(() => {
    setRemainingTime(warningTime / 1000);
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningTime, onTimeout, clearAllTimers]);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, timeout - warningTime);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  }, [timeout, warningTime, onTimeout, clearAllTimers, startCountdown]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      const now = Date.now();
      // Only reset if it's been more than 1 second since last activity (debounce)
      if (now - lastActivityRef.current > 1000) {
        if (!showWarning) {
          resetTimer();
        }
      }
    };

    // Initial timer start
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, clearAllTimers, showWarning]);

  return {
    showWarning,
    remainingTime,
    extendSession,
  };
};

