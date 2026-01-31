import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

export default function AutoPreviewNote() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 text-sm">
        <strong>Auto-Generated:</strong> Don't have previews? We'll automatically use your full tracks as previews. 
        Or upload custom 30-60s clips for the best fan experience.
      </AlertDescription>
    </Alert>
  );
}