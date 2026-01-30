import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export default function AudioPlayer({ 
  track,
  isPreview = false,
  onBuyClick,
  onDownload,
  className 
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Stop playback when component unmounts (navigation)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    if (audioRef.current && !isPreview) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = duration - currentTime;

  return (
    <div className={cn("bg-neutral-50 rounded-xl p-4", className)}>
      <audio ref={audioRef} src={track.url} preload="metadata" />
      
      <div className="flex items-center gap-4">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Track Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{track.name}</p>
              {isPreview ? (
                <p className="text-xs text-neutral-500">
                  Preview • {formatTime(timeRemaining)} remaining
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isPreview}
            className={cn(
              "cursor-pointer",
              isPreview && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Action Button */}
        {isPreview ? (
          <Button 
            size="sm" 
            className="bg-black text-white hover:bg-neutral-800"
            onClick={onBuyClick}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Buy Full
          </Button>
        ) : (
          onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(track)}
            >
              <Download className="w-4 h-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}