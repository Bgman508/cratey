import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditionBadge from '@/components/products/EditionBadge';
import DropWindowCountdown from '@/components/products/DropWindowCountdown';
import OwnedBadge from '@/components/products/OwnedBadge';

export default function ProductCard({ product, showArtist = true, isOwned = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePreviewToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.preview_url) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Link 
      to={createPageUrl('ProductPage') + `?id=${product.id}`}
      className="group block"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-3">
        <img 
          src={product.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Preview Button Overlay */}
        {product.preview_url && (
          <button
            onClick={handlePreviewToggle}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
          >
            <div className={`w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg ${isPlaying ? 'opacity-100' : ''}`}>
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black" />
              ) : (
                <Play className="w-6 h-6 text-black ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-full uppercase">
            {product.type}
          </span>
        </div>

        {/* Owned Badge */}
        {isOwned && (
          <div className="absolute top-3 right-3">
            <OwnedBadge />
          </div>
        )}
      </div>

      <h3 className="font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-1">
        {product.title}
      </h3>
      
      {showArtist && (
        <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
          {product.artist_name}
        </p>
      )}
      
      <div className="mt-2 space-y-2">
        <p className="font-semibold">
          ${(product.price_cents / 100).toFixed(2)}
        </p>
        
        {product.edition_type === 'limited' && !isOwned && (
          <p className="text-xs text-neutral-500">
            {product.edition_limit - (product.total_sales || 0)} of {product.edition_limit} left
          </p>
        )}
      </div>

      {product.preview_url && (
        <audio 
          ref={audioRef}
          src={product.preview_url}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}
    </Link>
  );
}