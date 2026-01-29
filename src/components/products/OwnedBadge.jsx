import React from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OwnedBadge({ className = '' }) {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-green-100 text-green-700 border-green-200 gap-1 ${className}`}
    >
      <Check className="w-3 h-3" />
      Owned
    </Badge>
  );
}