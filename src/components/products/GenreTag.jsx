import React from 'react';
import { Badge } from '@/components/ui/badge';

const genreColors = {
  rock: 'bg-red-100 text-red-800',
  pop: 'bg-pink-100 text-pink-800',
  hiphop: 'bg-purple-100 text-purple-800',
  electronic: 'bg-blue-100 text-blue-800',
  jazz: 'bg-amber-100 text-amber-800',
  classical: 'bg-slate-100 text-slate-800',
  indie: 'bg-green-100 text-green-800',
  folk: 'bg-yellow-100 text-yellow-800',
  rnb: 'bg-orange-100 text-orange-800',
  metal: 'bg-zinc-800 text-white',
};

export default function GenreTag({ genre }) {
  if (!genre) return null;
  
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z]/g, '');
  const colorClass = genreColors[normalizedGenre] || 'bg-neutral-100 text-neutral-800';
  
  return (
    <Badge className={colorClass}>
      {genre}
    </Badge>
  );
}