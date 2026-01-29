import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';

export default function EditionBadge({ product }) {
  if (!product || product.edition_type !== 'limited') return null;

  const remaining = product.edition_limit - (product.total_sales || 0);
  const percentRemaining = (remaining / product.edition_limit) * 100;
  
  let variant = 'default';
  let urgency = null;
  
  if (percentRemaining <= 10) {
    variant = 'destructive';
    urgency = 'Almost Gone!';
  } else if (percentRemaining <= 25) {
    variant = 'default';
    urgency = 'Limited Stock';
  }

  return (
    <div className="space-y-2">
      {product.edition_name && (
        <Badge variant="outline" className="border-neutral-300">
          <Sparkles className="w-3 h-3 mr-1" />
          {product.edition_name}
        </Badge>
      )}
      
      <div className="flex items-center gap-2">
        {urgency && (
          <Badge variant={variant} className="gap-1">
            <Zap className="w-3 h-3" />
            {urgency}
          </Badge>
        )}
        <span className="text-sm text-neutral-600">
          {remaining} of {product.edition_limit} left
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${
            percentRemaining <= 10 ? 'bg-red-500' : 
            percentRemaining <= 25 ? 'bg-amber-500' : 
            'bg-neutral-400'
          }`}
          style={{ width: `${100 - percentRemaining}%` }}
        />
      </div>
    </div>
  );
}