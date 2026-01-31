import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, DollarSign, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function DashboardPayouts() {
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

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ['my-artist', user?.email],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ owner_email: user.email });
      return artists[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders-for-payouts', artist?.id],
    queryFn: () => base44.entities.Order.filter({ artist_id: artist.id, status: 'paid' }, '-created_date'),
    enabled: !!artist?.id
  });

  const totalEarnings = orders.reduce((sum, o) => sum + (o.artist_payout_cents || 0), 0);
  const platformFees = orders.reduce((sum, o) => sum + (o.platform_fee_cents || 0), 0);

  const isLoading = artistLoading || ordersLoading;

  return (
    <DashboardLayout currentPage="DashboardPayouts" artist={artist}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-neutral-600">Track your earnings and set up payments</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <>
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Total Earnings</p>
                      <p className="text-3xl font-bold">${(totalEarnings / 100).toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    After 8% platform fee
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Total Sales</p>
                      <p className="text-3xl font-bold">{orders.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Platform Fees</p>
                      <p className="text-3xl font-bold">${(platformFees / 100).toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="text-neutral-600 font-bold">8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stripe Connect Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Setup</CardTitle>
                <CardDescription>
                  Connect your bank account to receive payouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {artist?.stripe_onboarding_complete ? (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-bold">Payments Enabled</h3>
                      <p className="text-sm text-neutral-600">
                        Your Stripe account is connected. Payouts will be sent automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                      <div>
                        <h3 className="font-bold">Set Up Payments</h3>
                        <p className="text-sm text-neutral-600">
                          Connect with Stripe to start receiving your earnings
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-black text-white hover:bg-neutral-800"
                      disabled
                      title="Stripe integration not yet implemented"
                    >
                      Connect Stripe
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How Payouts Work */}
            <Card>
              <CardHeader>
                <CardTitle>How Payouts Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold">1</span>
                    </div>
                    <h4 className="font-medium mb-1">Fan Purchases</h4>
                    <p className="text-sm text-neutral-500">
                      When someone buys your music, payment is processed through Stripe
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold">2</span>
                    </div>
                    <h4 className="font-medium mb-1">Platform Fee</h4>
                    <p className="text-sm text-neutral-500">
                      CRATEY takes 8% to cover payment processing and platform costs
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold">3</span>
                    </div>
                    <h4 className="font-medium mb-1">You Get 92%</h4>
                    <p className="text-sm text-neutral-500">
                      Your earnings are transferred to your connected bank account
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}