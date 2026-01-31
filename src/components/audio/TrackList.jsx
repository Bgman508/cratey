import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import { Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrackList({ 
  tracks, 
  trackNames, 
  isPreview = false, 
  onBuyClick,
  onDownload 
}) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);

  const handleTrackClick = (index) => {
    setCurrentTrackIndex(index === currentTrackIndex ? null : index);
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className="bg-neutral-100 rounded-lg p-4 text-center">
        <p className="text-sm text-neutral-600">No audio tracks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((url, index) => (
        <div key={index} className="space-y-2">
          {/* Track Row */}
          <button
            onClick={() => handleTrackClick(index)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left",
              currentTrackIndex === index && "bg-neutral-50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              currentTrackIndex === index 
                ? "bg-black text-white" 
                : "bg-neutral-100 text-neutral-600"
            )}>
              {currentTrackIndex === index ? (
                <Check className="w-4 h-4" />
              ) : isPreview ? (
                <Play className="w-4 h-4 ml-0.5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {trackNames?.[index] || `Track ${index + 1}`}
              </p>
              {isPreview && (
                <p className="text-xs text-neutral-500">Preview • 30s</p>
              )}
            </div>
          </button>

          {/* Expanded Player */}
          {currentTrackIndex === index && (
            <AudioPlayer
              track={{
                url,
                name: trackNames?.[index] || `Track ${index + 1}`
              }}
              isPreview={isPreview}
              onBuyClick={onBuyClick}
              onDownload={onDownload}
            />
          )}
        </div>
      ))}
    </div>
  );
}