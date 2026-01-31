import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { ShoppingBag, Music, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import GlobalAudioStop from '@/components/audio/GlobalAudioStop';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  // Pages that should have no layout (artist storefronts)
  const noLayoutPages = ['ArtistStorefront', 'ProductPage', 'LibraryAccess'];
  
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <>
        <GlobalAudioStop />
        {children}
      </>
    );
  }
  
  // Dashboard pages have their own layout
  const dashboardPages = ['Dashboard', 'DashboardProducts', 'DashboardNewProduct', 'DashboardEditProduct', 'DashboardOrders', 'DashboardPayouts', 'DashboardSettings', 'DashboardAnalytics', 'DashboardStripe', 'AdminOrders'];

  if (dashboardPages.includes(currentPageName)) {
    return (
      <>
        <GlobalAudioStop />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <GlobalAudioStop />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">CRATEY</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to={createPageUrl('Home')} 
                className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
              >
                Browse
              </Link>
              <Link 
                to={createPageUrl('Artists')} 
                className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
              >
                Artists
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Library')}>
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Your Crate</span>
                </Button>
              </Link>
              <Link to={createPageUrl('Dashboard')}>
                <Button size="sm" className="bg-black text-white hover:bg-neutral-800">
                  Artist Login
                </Button>
              </Link>
              
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link 
                      to={createPageUrl('Home')} 
                      className="text-lg font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Browse
                    </Link>
                    <Link 
                      to={createPageUrl('Artists')} 
                      className="text-lg font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Artists
                    </Link>
                    <Link 
                      to={createPageUrl('Library')} 
                      className="text-lg font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Your Crate
                    </Link>
                    <hr className="my-4" />
                    <Link 
                      to={createPageUrl('Dashboard')} 
                      className="text-lg font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Artist Dashboard
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-50 border-t border-neutral-100 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="font-semibold text-lg tracking-tight">CRATEY</span>
              </div>
              <p className="text-neutral-600 text-sm max-w-xs">
                Buy music. Own it. Support artists directly and build your permanent collection.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">For Fans</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link to={createPageUrl('Home')} className="hover:text-black">Browse Music</Link></li>
                <li><Link to={createPageUrl('Library')} className="hover:text-black">Your Crate</Link></li>
                <li><Link to={createPageUrl('Artists')} className="hover:text-black">Artists</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">For Artists</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link to={createPageUrl('Dashboard')} className="hover:text-black">Dashboard</Link></li>
                <li><Link to={createPageUrl('ArtistSignup')} className="hover:text-black">Sell Your Music</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 mt-8 pt-8 text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} CRATEY. Artists keep 92% of every sale.
          </div>
        </div>
      </footer>
    </div>
  );
}