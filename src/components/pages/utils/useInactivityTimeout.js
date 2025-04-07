// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import { useEffect, useRef } from 'react';

const useInactivityTimeout = (timeoutDuration = 5 * 60 * 1000) => {
  const timeoutRef = useRef(null);

  const resetInactivityTimer = () => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Resetting inactivity timer...`);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const reloadTimestamp = new Date().toLocaleString();
      console.log(`[${reloadTimestamp}] Inactivity detected. Timer expired, reloading page...`);
      window.location.reload();
    }, timeoutDuration);
    
    console.log(`[${timestamp}] New inactivity timer set for ${timeoutDuration / 1000 / 60} minutes.`);
  };

  useEffect(() => {
    console.log("Setting up inactivity event listeners...");
    
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      console.log("Cleaning up inactivity event listeners...");
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return resetInactivityTimer;
};

export default useInactivityTimeout;
