import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, ShoppingCart, Music, Eye } from 'lucide-react';

export default function DashboardAnalytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
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

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['my-products', artist?.id],
    queryFn: () => base44.entities.Product.filter({ artist_id: artist.id }),
    enabled: !!artist?.id
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders', artist?.id],
    queryFn: () => base44.entities.Order.filter({ artist_id: artist.id }),
    enabled: !!artist?.id
  });

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);
  const totalSales = orders.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Best sellers
  const productSales = products.map(p => ({
    ...p,
    salesCount: orders.filter(o => o.product_id === p.id).length,
    revenue: orders
      .filter(o => o.product_id === p.id)
      .reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0)
  })).sort((a, b) => b.salesCount - a.salesCount);

  // Recent trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentOrders = orders.filter(o => new Date(o.created_date) > thirtyDaysAgo);
  const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);

  if (!artist) {
    return (
      <DashboardLayout currentPage="DashboardAnalytics">
        <div className="text-center py-16">
          <Skeleton className="h-32 w-full mb-4" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="DashboardAnalytics" artist={artist}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-neutral-600">Track your performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-neutral-500 mt-1">Your earnings (92%)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Sales</CardTitle>
              <ShoppingCart className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-neutral-500 mt-1">All-time purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Avg Order Value</CardTitle>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(averageOrderValue / 100).toFixed(2)}</div>
              <p className="text-xs text-neutral-500 mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Last 30 Days</CardTitle>
              <Eye className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(recentRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-neutral-500 mt-1">{recentOrders.length} sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Best Sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Best Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : productSales.length > 0 ? (
              <div className="space-y-4">
                {productSales.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                    <span className="text-lg font-bold text-neutral-400 w-6">#{index + 1}</span>
                    <img
                      src={product.cover_url}
                      alt={product.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-neutral-500">
                        {product.salesCount} sales • ${(product.revenue / 100).toFixed(2)} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-8">No sales yet</p>
            )}
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle>All Products Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map(product => {
                const sales = orders.filter(o => o.product_id === product.id).length;
                const revenue = orders
                  .filter(o => o.product_id === product.id)
                  .reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);
                
                return (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={product.cover_url}
                        alt={product.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-neutral-500">{product.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{sales} sales</p>
                      <p className="text-sm text-neutral-500">${(revenue / 100).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}