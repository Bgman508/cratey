import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Play, Pause, ShoppingBag, Download, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import EditionBadge from '@/components/products/EditionBadge';
import DropWindowCountdown from '@/components/products/DropWindowCountdown';
import OwnedBadge from '@/components/products/OwnedBadge';

export default function ProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const prefilledEmail = urlParams.get('email');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState(prefilledEmail || '');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [userOwnsThis, setUserOwnsThis] = useState(false);
  const audioRef = useRef(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0] || null;
    },
    enabled: !!productId
  });

  const { data: artist } = useQuery({
    queryKey: ['product-artist', product?.artist_id],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ id: product.artist_id });
      return artists[0] || null;
    },
    enabled: !!product?.artist_id
  });

  // Check if user already owns this product
  const checkOwnership = async (email) => {
    const items = await base44.entities.LibraryItem.filter({ 
      buyer_email: email.toLowerCase(), 
      product_id: productId 
    });
    return items.length > 0;
  };

  // Check ownership on load if email provided
  useEffect(() => {
    if (prefilledEmail && productId) {
      checkOwnership(prefilledEmail).then(setUserOwnsThis);
    }
  }, [prefilledEmail, productId]);

  const handleBuyClick = () => {
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!buyerEmail || !buyerEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setCheckoutLoading(true);

    // Check if already owns
    const alreadyOwns = await checkOwnership(buyerEmail);
    if (alreadyOwns) {
      toast.info('You already own this! Check your library.');
      setCheckoutLoading(false);
      setShowCheckout(false);
      return;
    }

    // Check if limited edition and sold out
    if (product.edition_type === 'limited' && product.total_sales >= product.edition_limit) {
      toast.error('This edition is sold out!');
      setCheckoutLoading(false);
      setShowCheckout(false);
      return;
    }

    // Check if drop window expired
    if (product.drop_window_enabled && new Date(product.drop_window_end) < new Date()) {
      toast.error('This drop window has ended!');
      setCheckoutLoading(false);
      setShowCheckout(false);
      return;
    }

    // Calculate edition number
    const editionNumber = product.edition_type === 'limited' 
      ? (product.total_sales || 0) + 1 
      : null;

    const platformFee = Math.round(product.price_cents * 0.08);
    const artistPayout = product.price_cents - platformFee;

    // Create order
    const order = await base44.entities.Order.create({
      artist_id: product.artist_id,
      product_id: product.id,
      product_title: product.title,
      artist_name: product.artist_name,
      buyer_email: buyerEmail.toLowerCase(),
      amount_cents: product.price_cents,
      platform_fee_cents: platformFee,
      artist_payout_cents: artistPayout,
      currency: product.currency || 'USD',
      status: 'paid',
      stripe_session_id: 'sim_' + Date.now(),
      edition_name: product.edition_name,
      edition_number: editionNumber
    });

    // Create library item
    const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await base44.entities.LibraryItem.create({
      buyer_email: buyerEmail.toLowerCase(),
      product_id: product.id,
      order_id: order.id,
      product_title: product.title,
      artist_name: product.artist_name,
      artist_slug: product.artist_slug,
      cover_url: product.cover_url,
      audio_urls: product.audio_urls || [],
      track_names: product.track_names || [],
      access_token: accessToken,
      edition_name: product.edition_name,
      edition_number: editionNumber,
      purchase_date: new Date().toISOString()
    });

    // Update product stats
    await base44.entities.Product.update(product.id, {
      total_sales: (product.total_sales || 0) + 1,
      total_revenue_cents: (product.total_revenue_cents || 0) + product.price_cents
    });

    // Send email with library link and artist thank you note
    const editionText = editionNumber ? `\n\nEdition: ${product.edition_name} #${editionNumber} of ${product.edition_limit}` : '';
    const thankYouNote = artist?.thank_you_note ? `\n\n---\n\nA message from ${artist.name}:\n${artist.thank_you_note}` : '';
    
    await base44.integrations.Core.SendEmail({
      to: buyerEmail,
      subject: `🎵 You own "${product.title}" - Download Now`,
      body: `
Hi there!

Thanks for your purchase! You now own "${product.title}" by ${product.artist_name}.${editionText}

Access your library anytime:
${window.location.origin}/Library?email=${encodeURIComponent(buyerEmail)}

You can download your music whenever you want. No expiration, no limits.${thankYouNote}

Enjoy!
— The CRATEY Team
      `.trim()
    });

    setCheckoutLoading(false);
    setShowCheckout(false);
    setPurchaseComplete(true);
    toast.success('Purchase complete! Check your email.');
  };

  const handlePreviewToggle = () => {
    if (!product?.preview_url) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  if (!productId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Product not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              to={artist ? createPageUrl('ArtistStorefront') + `?slug=${artist.slug}` : createPageUrl('Home')}
              className="flex items-center gap-2 text-neutral-600 hover:text-black"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{artist ? `Back to ${artist.name}` : 'Back'}</span>
            </Link>
            <Link to={createPageUrl('Library')}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Your Crate</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Cover Art */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 shadow-2xl">
              <img 
                src={product.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
              
              {/* Preview Button */}
              {product.preview_url && (
                <button
                  onClick={handlePreviewToggle}
                  className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-black" />
                  ) : (
                    <Play className="w-7 h-7 text-black ml-1" />
                  )}
                </button>
              )}
            </div>

            {/* Product Info */}
            <div>
              <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                {product.type}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-4">
                {product.title}
              </h1>
              <Link 
                to={artist ? createPageUrl('ArtistStorefront') + `?slug=${artist.slug}` : '#'}
                className="text-xl text-neutral-600 hover:text-black transition-colors"
              >
                {product.artist_name}
              </Link>

              {product.description && (
                <p className="text-neutral-600 mt-6">{product.description}</p>
              )}

              {/* Owned Badge */}
              {userOwnsThis && (
                <div className="mt-6">
                  <OwnedBadge className="text-base px-4 py-2" />
                </div>
              )}

              {/* Drop Window */}
              {product.drop_window_enabled && !userOwnsThis && (
                <div className="mt-6">
                  <DropWindowCountdown product={product} />
                </div>
              )}

              {/* Edition Info */}
              {product.edition_type === 'limited' && !userOwnsThis && (
                <div className="mt-6">
                  <EditionBadge product={product} />
                </div>
              )}

              {/* Track List */}
              {product.track_names && product.track_names.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                    Tracks
                  </h3>
                  <ul className="space-y-2">
                    {product.track_names.map((track, index) => (
                      <li key={index} className="flex items-center gap-3 py-2 border-b border-neutral-100">
                        <span className="text-sm text-neutral-400 w-6">{index + 1}</span>
                        <span className="font-medium">{track}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Purchase Section */}
              <div className="mt-10 p-6 bg-neutral-50 rounded-2xl">
                {purchaseComplete || userOwnsThis ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">You own this!</h3>
                    <p className="text-neutral-600 mb-4">Check your email for the download link, or visit your library.</p>
                    <Link to={createPageUrl('Library') + `?email=${encodeURIComponent(buyerEmail || prefilledEmail || '')}`}>
                      <Button className="bg-black text-white hover:bg-neutral-800">
                        Go to Your Crate
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold">
                        ${(product.price_cents / 100).toFixed(2)}
                      </span>
                      <span className="text-neutral-500">{product.currency || 'USD'}</span>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full bg-black text-white hover:bg-neutral-800 h-14 text-lg"
                      onClick={handleBuyClick}
                      disabled={
                        (product.edition_type === 'limited' && product.total_sales >= product.edition_limit) ||
                        (product.drop_window_enabled && new Date(product.drop_window_end) < new Date())
                      }
                    >
                      {product.edition_type === 'limited' && product.total_sales >= product.edition_limit ? (
                        'Sold Out'
                      ) : product.drop_window_enabled && new Date(product.drop_window_end) < new Date() ? (
                        'Drop Ended'
                      ) : (
                        'Buy Now'
                      )}
                    </Button>
                    <p className="text-sm text-neutral-500 mt-4 text-center">
                      Instant download. Own it forever.
                    </p>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-neutral-50 rounded-xl">
                  <Download className="w-5 h-5 mx-auto mb-2 text-neutral-400" />
                  <p className="text-sm text-neutral-600">Download anytime</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-xl">
                  <span className="text-xl block mb-1">💰</span>
                  <p className="text-sm text-neutral-600">92% to artist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Enter your email to receive your download link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
              <img 
                src={product.cover_url} 
                alt={product.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium">{product.title}</p>
                <p className="text-sm text-neutral-500">{product.artist_name}</p>
              </div>
              <div className="ml-auto font-bold">
                ${(product.price_cents / 100).toFixed(2)}
              </div>
            </div>
            
            <Input
              type="email"
              placeholder="your@email.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="h-12"
            />
            
            <Button 
              className="w-full h-12 bg-black text-white hover:bg-neutral-800"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>

            <p className="text-xs text-neutral-500 text-center">
              By purchasing, you agree to receive your download link via email.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Element */}
      {product.preview_url && (
        <audio 
          ref={audioRef}
          src={product.preview_url}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}