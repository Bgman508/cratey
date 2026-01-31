import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Package, ShoppingCart, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const { data: artist } = useQuery({
    queryKey: ['my-artist', user?.email],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ owner_email: user.email });
      return artists[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: products = [] } = useQuery({
    queryKey: ['my-products', artist?.id],
    queryFn: () => base44.entities.Product.filter({ artist_id: artist.id }, '-created_date'),
    enabled: !!artist?.id
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders', artist?.id],
    queryFn: () => base44.entities.Order.filter({ artist_id: artist.id, status: 'paid' }, '-created_date', 10),
    enabled: !!artist?.id
  });

  if (loading) {
    return (
      <DashboardLayout currentPage="Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!artist) {
    return (
      <DashboardLayout currentPage="Dashboard">
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎵</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Create Your Artist Profile</h1>
          <p className="text-neutral-600 mb-8">
            Set up your storefront to start selling your music directly to fans.
          </p>
          <Link to={createPageUrl('DashboardSettings')}>
            <Button size="lg" className="bg-black text-white hover:bg-neutral-800">
              <Plus className="w-5 h-5 mr-2" />
              Create Artist Profile
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);
  const totalSales = orders.length;
  const liveProducts = products.filter(p => p.status === 'live').length;

  return (
    <DashboardLayout currentPage="Dashboard" artist={artist}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-neutral-600">Welcome back, {artist.name}</p>
          </div>
          <Link to={createPageUrl('DashboardNewProduct')}>
            <Button className="bg-black text-white hover:bg-neutral-800">
              <Plus className="w-4 h-4 mr-2" />
              New Release
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-neutral-500">After platform fee</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Sales</CardTitle>
              <ShoppingCart className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-neutral-500">Completed orders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Products</CardTitle>
              <Package className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-neutral-500">{liveProducts} live</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Avg. Order</CardTitle>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalSales > 0 ? ((totalRevenue / totalSales) / 100).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-neutral-500">Per sale</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to={createPageUrl('DashboardOrders')}>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{order.product_title}</p>
                        <p className="text-sm text-neutral-500">{order.buyer_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(order.artist_payout_cents / 100).toFixed(2)}</p>
                        <p className="text-xs text-neutral-500">
                          {new Date(order.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No orders yet</p>
              )}
            </CardContent>
          </Card>

          {/* Your Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Products</CardTitle>
              <Link to={createPageUrl('DashboardProducts')}>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.slice(0, 5).map(product => (
                    <div key={product.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                      <img 
                        src={product.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'} 
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-neutral-500">{product.type}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.status === 'live' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No products yet</p>
                  <Link to={createPageUrl('DashboardNewProduct')}>
                    <Button size="sm">Create Your First Release</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Storefront Link */}
        <Card className="bg-neutral-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg">Your Storefront</h3>
                <p className="text-neutral-600">
                  Share this link with your fans
                </p>
              </div>
              <div className="flex items-center gap-3">
                <code className="bg-white px-4 py-2 rounded-lg text-sm">
                  {window.location.origin}/ArtistStorefront?slug={artist.slug}
                </code>
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/ArtistStorefront?slug=${artist.slug}`);
                    toast.success('Link copied!');
                  }}
                >
                  Copy
                </Button>
                <Link to={createPageUrl('ArtistStorefront') + `?slug=${artist.slug}`} target="_blank">
                  <Button>View Store</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}