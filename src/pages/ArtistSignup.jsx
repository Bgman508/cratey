import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, DollarSign, Users, Download } from 'lucide-react';

export default function ArtistSignup() {
  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('DashboardSettings'));
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-black text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Sell your music.<br />
              <span className="text-neutral-400">Keep 92%.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-xl">
              No middlemen. No complicated deals. Upload your music, set your price, 
              and start selling directly to your fans.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-neutral-200"
              onClick={handleGetStarted}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to sell music
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              CRATEY gives you a beautiful storefront, payment processing, 
              and instant delivery—all set up in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-neutral-50">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">92% Revenue Share</h3>
              <p className="text-neutral-600">
                You keep the vast majority. We only take 8% to cover payment 
                processing and platform costs.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-neutral-50">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Your Own Storefront</h3>
              <p className="text-neutral-600">
                Get a beautiful, branded storefront to share with fans. 
                No coding required.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-neutral-50">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6">
                <Download className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Delivery</h3>
              <p className="text-neutral-600">
                Fans get their downloads immediately after purchase. 
                No waiting, no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-lg text-neutral-600">
              Start selling in under 3 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Create Your Profile</h3>
              <p className="text-neutral-600">
                Sign up and set up your artist profile with your name and image
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Your Music</h3>
              <p className="text-neutral-600">
                Add cover art, audio files, and set your price
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Start Selling</h3>
              <p className="text-neutral-600">
                Share your storefront and start earning from every sale
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Keep more of what you earn
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-neutral-200">
                  <th className="text-left py-4 pr-4">Platform</th>
                  <th className="text-right py-4 px-4">You Keep</th>
                  <th className="text-right py-4 pl-4">$10 Sale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100 bg-green-50">
                  <td className="py-4 pr-4 font-bold">CRATEY</td>
                  <td className="py-4 px-4 text-right font-bold text-green-600">92%</td>
                  <td className="py-4 pl-4 text-right font-bold text-green-600">$9.20</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-4 pr-4 text-neutral-600">Bandcamp</td>
                  <td className="py-4 px-4 text-right text-neutral-600">80-85%</td>
                  <td className="py-4 pl-4 text-right text-neutral-600">$8.00-8.50</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-4 pr-4 text-neutral-600">DistroKid (streaming)</td>
                  <td className="py-4 px-4 text-right text-neutral-600">~70%</td>
                  <td className="py-4 pl-4 text-right text-neutral-600">$7.00</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-4 pr-4 text-neutral-600">Spotify (streaming)</td>
                  <td className="py-4 px-4 text-right text-neutral-600">~30%</td>
                  <td className="py-4 pl-4 text-right text-neutral-600">$3.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Everything included. No hidden fees.
              </h2>
              <ul className="space-y-4">
                {[
                  'Beautiful artist storefront',
                  'Unlimited product uploads',
                  'Secure payment processing',
                  'Instant file delivery',
                  'Sales analytics dashboard',
                  'Direct payouts to your bank'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-800 rounded-2xl p-8">
              <p className="text-neutral-400 text-sm mb-2">Platform fee</p>
              <p className="text-5xl font-bold mb-4">8%</p>
              <p className="text-neutral-400 mb-6">
                That's it. No monthly fees, no hidden charges. 
                You only pay when you make a sale.
              </p>
              <Button 
                size="lg" 
                className="w-full bg-white text-black hover:bg-neutral-200"
                onClick={handleGetStarted}
              >
                Start Selling Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to sell your music?
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join CRATEY and start earning from your music today.
          </p>
          <Button 
            size="lg" 
            className="bg-black text-white hover:bg-neutral-800"
            onClick={handleGetStarted}
          >
            Create Your Storefront
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}