import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCard from '@/components/products/ProductCard';
import TrackList from '@/components/audio/TrackList';

export default function ArtistStorefront() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  const emailParam = urlParams.get('email');
  
  const [ownedProductIds, setOwnedProductIds] = React.useState([]);

  const { data: artist, isLoading: artistLoading, error: artistError } = useQuery({
    queryKey: ['artist', slug],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ slug });
      return artists[0] || null;
    },
    enabled: !!slug
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['artist-products', artist?.id],
    queryFn: () => base44.entities.Product.filter({ artist_id: artist.id, status: 'live' }, '-created_date'),
    enabled: !!artist?.id
  });

  // Check owned products
  useQuery({
    queryKey: ['owned-products-storefront', emailParam],
    queryFn: async () => {
      const items = await base44.entities.LibraryItem.filter({ buyer_email: emailParam.toLowerCase() });
      const ids = items.map(item => item.product_id);
      setOwnedProductIds(ids);
      return items;
    },
    enabled: !!emailParam
  });

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Artist not found</p>
      </div>
    );
  }

  if (artistLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-64 md:h-80 bg-neutral-100" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-8 w-48 mt-4" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>
    );
  }

  if (!artist || artistError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
          <p className="text-neutral-500 mb-6">The artist you're looking for doesn't exist.</p>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const featuredProduct = products[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-neutral-600 hover:text-black">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to CRATEY</span>
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

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-neutral-900 mt-16">
        {artist.cover_url ? (
          <img 
            src={artist.cover_url} 
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />
        )}
      </div>

      {/* Artist Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
              <img 
                src={artist.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${artist.name}`}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{artist.name}</h1>
              {artist.bio && (
                <p className="text-neutral-600 mt-2 max-w-xl">{artist.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="music" className="mb-8">
          <TabsList className="bg-neutral-100">
            <TabsTrigger value="music" className="data-[state=active]:bg-white">Music</TabsTrigger>
            <TabsTrigger value="merch" disabled className="opacity-50">Merch</TabsTrigger>
            <TabsTrigger value="events" disabled className="opacity-50">Events</TabsTrigger>
            <TabsTrigger value="experiences" disabled className="opacity-50">Experiences</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Featured Release */}
        {featuredProduct && (
          <section className="mb-12">
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">Featured Release</h2>
            <Link 
              to={createPageUrl('ProductPage') + `?id=${featuredProduct.id}`}
              className="block group"
            >
              <div className="relative bg-neutral-50 rounded-2xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 aspect-square">
                    <img 
                      src={featuredProduct.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'} 
                      alt={featuredProduct.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full md:w-2/3 p-8 flex flex-col justify-center">
                    <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                      {featuredProduct.type}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-neutral-600 transition-colors">
                      {featuredProduct.title}
                    </h3>
                    
                    {/* Preview Tracks */}
                    {featuredProduct.audio_urls && featuredProduct.audio_urls.length > 0 && (
                      <div className="mb-4">
                        <TrackList
                          tracks={featuredProduct.audio_urls}
                          trackNames={featuredProduct.track_names}
                          isPreview={true}
                          onBuyClick={() => window.location.href = createPageUrl('ProductPage') + `?id=${featuredProduct.id}`}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-2xl font-bold">
                        ${(featuredProduct.price_cents / 100).toFixed(2)}
                      </span>
                      <Button className="bg-black text-white hover:bg-neutral-800">
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* All Releases */}
        <section className="pb-16">
          <h2 className="text-xl font-bold mb-6">All Releases</h2>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  showArtist={false}
                  isOwned={ownedProductIds.includes(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500">No releases yet</p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-50 border-t border-neutral-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-neutral-500">
            Powered by <Link to={createPageUrl('Home')} className="font-medium text-black hover:underline">CRATEY</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}