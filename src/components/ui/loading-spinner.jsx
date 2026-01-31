import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className, size = 'default' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={cn('animate-spin text-neutral-400', sizeClasses[size], className)} />
    </div>
  );
}

export default LoadingSpinner;