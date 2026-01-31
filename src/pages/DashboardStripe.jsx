import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function DashboardStripe() {
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

  if (!artist) {
    return (
      <DashboardLayout currentPage="DashboardStripe">
        <div className="text-center py-16">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isConnected = artist.stripe_onboarding_complete;

  return (
    <DashboardLayout currentPage="DashboardStripe" artist={artist}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Setup</h1>
          <p className="text-neutral-600">Connect your Stripe account to receive payouts</p>
        </div>

        {isConnected ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your Stripe account is connected and ready to receive payments!
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to connect your Stripe account to receive payouts from sales.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Stripe Connect</CardTitle>
            <CardDescription>
              CRATEY uses Stripe to securely process payments and send you your earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">What you'll need:</h4>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                <li>Business or personal information</li>
                <li>Bank account details</li>
                <li>Tax information (SSN or EIN)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">You'll receive:</h4>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                <li>92% of every sale (CRATEY keeps 8%)</li>
                <li>Automatic weekly payouts</li>
                <li>Full transaction history in Stripe</li>
              </ul>
            </div>

            {!isConnected && (
              <Button 
                className="w-full bg-[#635BFF] hover:bg-[#4F46E5] text-white"
                disabled
                title="Stripe integration not yet implemented"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect with Stripe
              </Button>
            )}

            {isConnected && artist.stripe_account_id && (
              <div className="pt-4 border-t">
                <p className="text-sm text-neutral-600 mb-2">
                  Account ID: <code className="bg-neutral-100 px-2 py-1 rounded">{artist.stripe_account_id}</code>
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled
                  title="Stripe integration not yet implemented"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage in Stripe Dashboard
                </Button>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Stripe Connect Not Yet Implemented:</strong> Real payment processing requires Stripe API integration. Contact platform admin to enable payments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}