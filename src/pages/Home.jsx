import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Search, ArrowRight, Play, Pause, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import ArtistCard from '@/components/artists/ArtistCard';
import { fuzzyFilter } from '@/components/search/FuzzySearch';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [ownedProductIds, setOwnedProductIds] = useState([]);
  
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'live'],
    queryFn: () => base44.entities.Product.filter({ status: 'live' }, '-created_date', 12)
  });

  // Check if user has email in URL (coming from library)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setUserEmail(emailParam);
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => audio.pause());
    };
  }, []);

  // Fetch owned products
  useQuery({
    queryKey: ['owned-products', userEmail],
    queryFn: async () => {
      const items = await base44.entities.LibraryItem.filter({ buyer_email: userEmail.toLowerCase() });
      const ids = items.map(item => item.product_id);
      setOwnedProductIds(ids);
      return items;
    },
    enabled: !!userEmail
  });

  const { data: artists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ['artists', 'featured'],
    queryFn: () => base44.entities.Artist.list('-created_date', 8)
  });

  const filteredProducts = searchQuery 
    ? fuzzyFilter(products, searchQuery, ['title', 'artist_name', 'type', 'description', 'genre', 'tags'])
    : products;

  const featuredProduct = products.find(p => p.status === 'live');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Buy music.<br />
              <span className="text-neutral-400">Own it forever.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-xl">
              Support artists directly. Download your purchases anytime. 
              No subscriptions, no DRM, no nonsense.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl('Artists')}>
                <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200">
                  Explore Artists
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to={createPageUrl('ArtistSignup')}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  Sell Your Music
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 border border-neutral-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search for artists, releases, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg border-neutral-200 focus:border-black focus:ring-black"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Release */}
      {featuredProduct && !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">Featured Release</h2>
          <Link 
            to={createPageUrl('ProductPage') + `?id=${featuredProduct.id}`}
            className="block group"
          >
            <div className="relative bg-neutral-50 rounded-2xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto">
                  <img 
                    src={featuredProduct.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'} 
                    alt={featuredProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    {featuredProduct.type}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold mb-2 group-hover:text-neutral-600 transition-colors">
                    {featuredProduct.title}
                  </h3>
                  <p className="text-lg text-neutral-600 mb-6">{featuredProduct.artist_name}</p>
                  <div className="flex items-center gap-4">
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

      {/* New Releases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">
            {searchQuery ? 'Search Results' : 'New Releases'}
          </h2>
          {!searchQuery && (
            <Link to={createPageUrl('Artists')} className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isOwned={ownedProductIds.includes(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-neutral-500">No releases found</p>
          </div>
        )}
      </section>

      {/* Artists Section */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-neutral-50 rounded-3xl mx-4 lg:mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Artists</h2>
            <Link to={createPageUrl('Artists')} className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {artistsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {artists.slice(0, 4).map(artist => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎵</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Own Your Music</h3>
            <p className="text-neutral-600">
              No subscriptions. Download high-quality files and keep them forever.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Support Artists</h3>
            <p className="text-neutral-600">
              Artists keep 92% of every sale. Your money goes directly to creators.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔓</span>
            </div>
            <h3 className="text-xl font-bold mb-3">No DRM</h3>
            <p className="text-neutral-600">
              Play your music anywhere, on any device. It's yours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}