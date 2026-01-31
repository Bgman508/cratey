import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function AutoPreviewNote() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 text-sm">
        <strong>Tip:</strong> You can create 30-60 second preview clips using free tools like{' '}
        <a 
          href="https://audacity.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          Audacity
        </a>{' '}
        or online audio editors. Export the most engaging part of each track to encourage purchases!
      </AlertDescription>
    </Alert>
  );
}