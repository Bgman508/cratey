import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ArtistCard({ artist }) {
  return (
    <Link 
      to={createPageUrl('ArtistStorefront') + `?slug=${artist.slug}`}
      className="group block text-center"
    >
      <div className="relative aspect-square rounded-full overflow-hidden bg-neutral-100 mb-4 mx-auto max-w-[200px]">
        <img 
          src={artist.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${artist.name}`} 
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <h3 className="font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
        {artist.name}
      </h3>
    </Link>
  );
}