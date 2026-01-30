import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Menu,
  X,
  ExternalLink,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Products', icon: Package, page: 'DashboardProducts' },
  { name: 'Orders', icon: ShoppingCart, page: 'DashboardOrders' },
  { name: 'Analytics', icon: BarChart3, page: 'DashboardAnalytics' },
  { name: 'Payouts', icon: CreditCard, page: 'DashboardPayouts' },
  { name: 'Settings', icon: Settings, page: 'DashboardSettings' },
];

export default function DashboardLayout({ children, currentPage, artist }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    base44.auth.logout();
  };

  const NavContent = ({ onItemClick }) => (
    <nav className="space-y-1">
      {navItems.map(item => (
        <Link
          key={item.page}
          to={createPageUrl(item.page)}
          onClick={onItemClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPage === item.page
              ? 'bg-black text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.name}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 border-r border-neutral-200 bg-white">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-neutral-100">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">CRATEY</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 overflow-y-auto">
            <NavContent />
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-neutral-100">
            {artist && (
              <Link 
                to={createPageUrl('ArtistStorefront') + `?slug=${artist.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-black mb-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Storefront
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-100">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">CRATEY</span>
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center h-16 px-6 border-b border-neutral-100">
                  <span className="font-semibold text-lg">Menu</span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <NavContent onItemClick={() => setMobileMenuOpen(false)} />
                </div>
                <div className="p-4 border-t border-neutral-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          <div className="max-w-6xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}