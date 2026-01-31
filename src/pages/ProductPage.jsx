import React, { useState, useRef, useEffect } from 'react';
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
import TrackList from '@/components/audio/TrackList';
import BundleOffer from '@/components/products/BundleOffer';
import ShareButtons from '@/components/products/ShareButtons';

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
  const [bundleCheckout, setBundleCheckout] = useState(null);
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
    setBundleCheckout(null);
    setShowCheckout(true);
  };

  const handleBundlePurchase = (bundleProducts, bundlePrice) => {
    setBundleCheckout({ products: bundleProducts, price: bundlePrice });
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!buyerEmail || !buyerEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setCheckoutLoading(true);

    try {
      // Determine products to purchase
      const productsToPurchase = bundleCheckout 
        ? [product, ...bundleCheckout.products] 
        : [product];

      // Check ownership for all products
      for (const p of productsToPurchase) {
        const items = await base44.entities.LibraryItem.filter({ 
          buyer_email: buyerEmail.toLowerCase(), 
          product_id: p.id 
        });
        if (items.length > 0) {
          toast.info(`You already own "${p.title}"!`);
          setCheckoutLoading(false);
          setShowCheckout(false);
          return;
        }
      }

      // Calculate total price
      const isDropEnded = product.drop_window_enabled && new Date(product.drop_window_end) < new Date();
      const basePrice = isDropEnded && product.archive_price_cents 
        ? product.archive_price_cents 
        : product.price_cents;
      
      const totalPrice = bundleCheckout ? bundleCheckout.price : basePrice;
      const platformFee = Math.round(totalPrice * 0.08);
      const artistPayout = totalPrice - platformFee;

      // Create orders and library items for each product
      for (const p of productsToPurchase) {
        // Check stock for limited editions
        if (p.edition_type === 'limited' && p.total_sales >= p.edition_limit) {
          toast.error(`"${p.title}" is sold out!`);
          setCheckoutLoading(false);
          return;
        }

        const productPrice = bundleCheckout 
          ? Math.round(p.price_cents * (1 - product.bundle_discount_percent / 100))
          : p.price_cents;
        const productFee = Math.round(productPrice * 0.08);
        const productPayout = productPrice - productFee;

        const editionNumber = p.edition_type === 'limited' ? (p.total_sales || 0) + 1 : null;

        // Create order
        const order = await base44.entities.Order.create({
          artist_id: p.artist_id,
          product_id: p.id,
          product_title: p.title,
          artist_name: p.artist_name,
          buyer_email: buyerEmail.toLowerCase(),
          amount_cents: productPrice,
          platform_fee_cents: productFee,
          artist_payout_cents: productPayout,
          currency: p.currency || 'USD',
          status: 'paid',
          stripe_session_id: 'sim_' + Date.now(),
          edition_name: p.edition_name,
          edition_number: editionNumber
        });

        // Create library item
        const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await base44.entities.LibraryItem.create({
          buyer_email: buyerEmail.toLowerCase(),
          product_id: p.id,
          order_id: order.id,
          product_title: p.title,
          artist_name: p.artist_name,
          artist_slug: p.artist_slug,
          cover_url: p.cover_url,
          audio_urls: p.audio_urls || [],
          track_names: p.track_names || [],
          access_token: accessToken,
          edition_name: p.edition_name,
          edition_number: editionNumber,
          purchase_date: new Date().toISOString()
        });

        // Update product stats
        await base44.entities.Product.update(p.id, {
          total_sales: (p.total_sales || 0) + 1,
          total_revenue_cents: (p.total_revenue_cents || 0) + productPrice
        });
      }

      // Send email
      const productList = productsToPurchase.map(p => `• ${p.title}`).join('\n');
      const bundleNote = bundleCheckout ? `\n\n🎁 Bundle Discount: You saved ${product.bundle_discount_percent}%!` : '';
      const thankYouNote = artist?.thank_you_note ? `\n\n---\n\nA message from ${artist.name}:\n${artist.thank_you_note}` : '';
      
      await base44.integrations.Core.SendEmail({
        to: buyerEmail,
        subject: bundleCheckout ? `🎵 You own ${productsToPurchase.length} releases!` : `🎵 You own "${product.title}" - Download Now`,
        body: `
Hi there!

Thanks for your purchase! You now own:

${productList}${bundleNote}

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
      setUserOwnsThis(true);
      toast.success('Purchase complete! Check your email.');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Purchase failed. Please try again.');
      setCheckoutLoading(false);
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
            <div className="flex items-center gap-2">
              <ShareButtons 
                title={`${product.title} by ${product.artist_name}`}
                text={`Check out "${product.title}" by ${product.artist_name} on CRATEY`}
              />
              <Link to={createPageUrl('Library')}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Your Crate</span>
                </Button>
              </Link>
            </div>
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

              {/* Track List with Playback */}
              {product.track_names && product.track_names.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
                    {userOwnsThis ? 'Play Full Tracks' : 'Preview Tracks'}
                  </h3>
                  <TrackList
                    tracks={userOwnsThis 
                      ? product.audio_urls 
                      : (product.preview_urls || product.audio_urls)
                    }
                    trackNames={product.track_names}
                    isPreview={!userOwnsThis}
                    onBuyClick={() => setShowCheckout(true)}
                  />
                </div>
              )}

              {/* Bundle Offer */}
              {!userOwnsThis && !purchaseComplete && (
                <div className="mt-8">
                  <BundleOffer 
                    product={product} 
                    onBundlePurchase={handleBundlePurchase}
                  />
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
                      {product.drop_window_enabled && 
                       product.archive_price_cents && 
                       new Date(product.drop_window_end) < new Date() ? (
                        <>
                          <span className="text-4xl font-bold">
                            ${(product.archive_price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-lg text-neutral-400 line-through">
                            ${(product.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-neutral-500 ml-2">Archive Price</span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">
                            ${(product.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-neutral-500">{product.currency || 'USD'}</span>
                        </>
                      )}
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
              {bundleCheckout ? 'Bundle: Save on multiple releases' : 'Enter your email to receive your download link'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {bundleCheckout ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <img 
                      src={product.cover_url} 
                      alt={product.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-neutral-500">{product.artist_name}</p>
                    </div>
                  </div>
                  {bundleCheckout.products.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                      <img 
                        src={p.cover_url} 
                        alt={p.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{p.title}</p>
                        <p className="text-sm text-neutral-500">{p.artist_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <span className="font-medium">Bundle Total</span>
                  <div className="text-right">
                    <p className="text-xl font-bold">${(bundleCheckout.price / 100).toFixed(2)}</p>
                    <p className="text-sm text-green-600">Save {product.bundle_discount_percent}%</p>
                  </div>
                </div>
              </>
            ) : (
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
                  ${((product.drop_window_enabled && new Date(product.drop_window_end) < new Date() && product.archive_price_cents ? product.archive_price_cents : product.price_cents) / 100).toFixed(2)}
                </div>
              </div>
            )}
            
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


    </div>
  );
}