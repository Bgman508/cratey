import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Mail, Download, ArrowRight, ShoppingBag, Loader2, Music, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OwnershipCertificate from '@/components/library/OwnershipCertificate';
import TrackList from '@/components/audio/TrackList';
import { toast } from 'sonner';
import { saveLibraryAccess, getLibraryAccess, clearLibraryAccess, hasLibraryAccess } from '@/components/library/PersistentAccess';

export default function Library() {
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  const tokenFromUrl = urlParams.get('token');
  
  const [email, setEmail] = useState(emailFromUrl || '');
  const [verified, setVerified] = useState(!!emailFromUrl);
  const [sendingLink, setSendingLink] = useState(false);

  const { data: libraryItems = [], isLoading, refetch } = useQuery({
    queryKey: ['library', email],
    queryFn: () => base44.entities.LibraryItem.filter({ buyer_email: email.toLowerCase() }, '-created_date'),
    enabled: verified && !!email
  });

  const handleAccessLibrary = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingLink(true);
    
    try {
      const items = await base44.entities.LibraryItem.filter({ buyer_email: email.toLowerCase() });
      
      if (items.length === 0) {
        toast.error('No purchases found for this email');
        setSendingLink(false);
        return;
      }

      const accessUrl = `${window.location.origin}${createPageUrl('Library')}?email=${encodeURIComponent(email)}`;
      
      await base44.functions.invoke('sendStyledEmail', {
        to: email,
        subject: '🎵 Access Your CRATEY Library',
        title: 'Your Music Library',
        bodyContent: `
          <p>You have <strong>${items.length} item${items.length !== 1 ? 's' : ''}</strong> in your crate.</p>
          <p>Click below to access all your CRATEY purchases. Download anytime, anywhere.</p>
        `,
        ctaText: 'Open My Library',
        ctaUrl: accessUrl
      });

      setSendingLink(false);
      toast.success('Access link sent! Check your email.');
    } catch (error) {
      setSendingLink(false);
      toast.error('Failed to send link');
    }
  };

  const handleDirectAccess = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    saveLibraryAccess(email);
    setVerified(true);
    refetch();
  };

  if (!verified) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-md mx-auto px-4 pt-32 pb-16">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Your Crate</h1>
            <p className="text-neutral-600">
              Enter your email to access your purchased music
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              
              <Button 
                className="w-full h-12 bg-black text-white hover:bg-neutral-800"
                onClick={handleDirectAccess}
              >
                Access Library
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral-500">or</span>
                </div>
              </div>

              <Button 
                variant="outline"
                className="w-full h-12"
                onClick={handleAccessLibrary}
                disabled={sendingLink}
              >
                {sendingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Access Link to Email
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-neutral-500 text-center mt-6">
            Don't have any purchases yet?{' '}
            <Link to={createPageUrl('Home')} className="text-black font-medium hover:underline">
              Browse music
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Crate</h1>
            <p className="text-neutral-600 mt-1">{email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                clearLibraryAccess();
                setVerified(false);
                setEmail('');
                toast.success('Signed out');
              }}
            >
              Sign Out
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setVerified(false);
                setEmail('');
              }}
            >
              Switch Account
            </Button>
          </div>
        </div>

        {/* Library Items */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : libraryItems.length > 0 ? (
          <div className="space-y-4">
            {libraryItems.map(item => (
              <LibraryItemCard key={item.id} item={item} />
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
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryItemCard({ item }) {
  const [downloading, setDownloading] = useState(false);

  const { data: order } = useQuery({
    queryKey: ['order', item.order_id],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: item.order_id });
      return orders[0] || null;
    },
    enabled: !!item.order_id
  });

  const handleDownload = async (url, trackName) => {
    setDownloading(true);
    
    window.open(url, '_blank');
    
    if (order) {
      await base44.entities.Order.update(order.id, {
        download_count: (order.download_count || 0) + 1
      });
    }
    
    setDownloading(false);
    toast.success(`Downloading ${trackName || 'track'}...`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Tabs defaultValue="downloads" className="w-full">
        <div className="border-b border-neutral-100">
          <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0">
            <TabsTrigger 
              value="downloads" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              Downloads
            </TabsTrigger>
            <TabsTrigger 
              value="certificate"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              <FileText className="w-4 h-4 mr-2" />
              Certificate
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="downloads" className="m-0">
          <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
            <Link to={createPageUrl('ProductPage') + `?id=${item.product_id}`}>
              <img 
                src={item.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200'} 
                alt={item.product_title}
                className="w-24 h-24 rounded-lg object-cover"
              />
            </Link>
            
            <div className="flex-1">
              <Link to={createPageUrl('ProductPage') + `?id=${item.product_id}`}>
                <h3 className="font-bold text-lg hover:text-neutral-600 transition-colors">
                  {item.product_title}
                </h3>
              </Link>
              <Link 
                to={createPageUrl('ArtistStorefront') + `?slug=${item.artist_slug}`}
                className="text-neutral-600 hover:text-black transition-colors"
              >
                {item.artist_name}
              </Link>
              
              {item.edition_name && (
                <p className="text-sm text-neutral-500 mt-1">
                  {item.edition_name} {item.edition_number && `#${item.edition_number}`}
                </p>
              )}
              
              <div className="mt-4">
                <p className="text-sm text-neutral-500 mb-4">
                  Purchased {new Date(item.purchase_date || item.created_date).toLocaleDateString()}
                </p>
                
                {item.audio_urls && item.audio_urls.length > 0 ? (
                  <TrackList
                    tracks={item.audio_urls}
                    trackNames={item.track_names}
                    isPreview={false}
                    onDownload={(track) => handleDownload(track.url, track.name, item.order_id)}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Audio Files Processing</p>
                    <p className="text-sm text-yellow-700">Your purchase is confirmed. Audio files are being processed and will be available shortly. Check back in a few minutes or contact support if this persists.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="certificate" className="m-0 p-4 md:p-6">
          <OwnershipCertificate item={item} order={order} />
        </TabsContent>
      </Tabs>
      
      <div className="bg-green-50 border-t border-green-100 px-4 py-2">
        <p className="text-sm text-green-700 font-medium">
          ✓ You own this. Download anytime.
        </p>
      </div>
    </div>
  );
}