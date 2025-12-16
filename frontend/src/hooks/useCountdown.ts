'use client';

import { useState, useEffect, useCallback } from 'react';

export const useCountdown = (initialSeconds: number = 60) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback((customSeconds?: number) => {
    setSeconds(customSeconds || initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setIsActive(false);
    setSeconds(0);
  }, []);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            setIsActive(false);
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  return {
    seconds,
    isActive,
    start,
    stop,
    reset,
    isFinished: seconds === 0 && !isActive
  };
};