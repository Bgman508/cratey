import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Stop all audio when navigating between pages
export default function GlobalAudioStop() {
  const location = useLocation();

  useEffect(() => {
    // Get all audio elements
    const audioElements = document.querySelectorAll('audio');
    
    // Pause all of them
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, [location.pathname, location.search]);

  return null;
}