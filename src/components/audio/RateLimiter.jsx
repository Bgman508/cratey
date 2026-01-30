import { useEffect, useState } from 'react';

/**
 * Simple client-side rate limiter for preview playback
 * Prevents abuse by limiting plays per session
 */

const STORAGE_KEY = 'cratey_preview_plays';
const MAX_PLAYS_PER_HOUR = 50;

export function usePreviewRateLimit() {
  const [canPlay, setCanPlay] = useState(true);
  const [playsRemaining, setPlaysRemaining] = useState(MAX_PLAYS_PER_HOUR);

  useEffect(() => {
    checkRateLimit();
  }, []);

  const checkRateLimit = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      resetCounter();
      return;
    }

    const data = JSON.parse(stored);
    const hourAgo = Date.now() - (60 * 60 * 1000);

    // Reset if data is old
    if (data.timestamp < hourAgo) {
      resetCounter();
      return;
    }

    // Check if limit reached
    if (data.count >= MAX_PLAYS_PER_HOUR) {
      setCanPlay(false);
      setPlaysRemaining(0);
    } else {
      setPlaysRemaining(MAX_PLAYS_PER_HOUR - data.count);
    }
  };

  const resetCounter = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      count: 0,
      timestamp: Date.now()
    }));
    setCanPlay(true);
    setPlaysRemaining(MAX_PLAYS_PER_HOUR);
  };

  const recordPlay = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : { count: 0, timestamp: Date.now() };
    
    data.count++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    setPlaysRemaining(MAX_PLAYS_PER_HOUR - data.count);
    
    if (data.count >= MAX_PLAYS_PER_HOUR) {
      setCanPlay(false);
    }
  };

  return { canPlay, playsRemaining, recordPlay };
}