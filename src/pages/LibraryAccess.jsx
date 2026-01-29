import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Download, ArrowLeft, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function LibraryAccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid access link');
        setLoading(false);
        return;
      }

      // Find the token
      const tokens = await base44.entities.LibraryAccessToken.filter({ token });
      
      if (tokens.length === 0) {
        setError('Access link not found or expired');
        setLoading(false);
        return;
      }

      const accessToken = tokens[0];
      
      // Check expiration
      if (new Date(accessToken.expires_at) < new Date()) {
        setError('This access link has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      setTokenData(accessToken);
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const { data: libraryItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['library-by-token', tokenData?.buyer_email],
    queryFn: () => base44.entities.LibraryItem.filter({ buyer_email: tokenData.buyer_email }, '-created_date'),
    enabled: !!tokenData?.buyer_email
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-md mx-auto px-4 pt-32 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <Link to={createPageUrl('Library')}>
            <Button>Request New Access Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">CRATEY</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Music Library</h1>
          <p className="text-neutral-600 mt-1">{tokenData?.buyer_email}</p>
        </div>

        {itemsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : libraryItems.length > 0 ? (
          <div className="space-y-4">
            {libraryItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
                  <img 
                    src={item.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200'} 
                    alt={item.product_title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.product_title}</h3>
                    <p className="text-neutral-600">{item.artist_name}</p>
                    
                    <div className="mt-4 space-y-2">
                      {item.audio_urls && item.audio_urls.length > 0 ? (
                        item.audio_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 mr-2"
                          >
                            <Download className="w-4 h-4" />
                            {item.track_names?.[index] || `Track ${index + 1}`}
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-400">Downloads coming soon</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border-t border-green-100 px-4 py-2">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ You own this. Download anytime.
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Music className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No music yet</h3>
            <p className="text-neutral-500 mb-6">Start building your collection</p>
            <Link to={createPageUrl('Home')}>
              <Button className="bg-black text-white hover:bg-neutral-800">
                Browse Music
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to={createPageUrl('Home')} className="text-sm text-neutral-500 hover:text-black">
            ← Back to CRATEY
          </Link>
        </div>
      </div>
    </div>
  );
}