import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export default function MobilePlayer({ tracks, currentIndex, onTrackChange, isOwned }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentIndex < tracks.length - 1) {
        onTrackChange(currentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, tracks.length, onTrackChange]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onTrackChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < tracks.length - 1) {
      onTrackChange(currentIndex + 1);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current && isOwned) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 lg:hidden">
      <audio ref={audioRef} src={tracks[currentIndex]?.url} preload="metadata" />
      
      {/* Progress Bar */}
      <div className="px-4 pt-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          disabled={!isOwned}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <div className="flex-1 min-w-0 mr-4">
          <p className="font-medium text-sm truncate">{tracks[currentIndex]?.name}</p>
          <p className="text-xs text-neutral-500">{isOwned ? 'Full Track' : 'Preview'}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 disabled:opacity-30"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === tracks.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 disabled:opacity-30"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600"
            >
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}