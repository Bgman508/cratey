import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, ShoppingCart, Music, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('30');

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

  // Calculate metrics with date filter
  const daysAgo = parseInt(dateRange);
  const filterDate = new Date();
  filterDate.setDate(filterDate.getDate() - daysAgo);
  
  const filteredOrders = dateRange === 'all' 
    ? orders 
    : orders.filter(o => new Date(o.created_date) > filterDate);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);
  const totalSales = filteredOrders.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Best sellers
  const productSales = products.map(p => ({
    ...p,
    salesCount: filteredOrders.filter(o => o.product_id === p.id).length,
    revenue: filteredOrders
      .filter(o => o.product_id === p.id)
      .reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0)
  })).sort((a, b) => b.salesCount - a.salesCount);

  // Chart data - daily revenue
  const chartData = [];
  const days = dateRange === 'all' ? 365 : daysAgo;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate >= date && orderDate < nextDate;
    });
    
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);
    
    chartData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue / 100,
      sales: dayOrders.length
    });
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-neutral-600">Track your performance</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
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
              <CardTitle className="text-sm font-medium text-neutral-600">Products</CardTitle>
              <Music className="w-4 h-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-neutral-500 mt-1">{products.filter(p => p.status === 'live').length} live</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Sales Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sales" fill="#000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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