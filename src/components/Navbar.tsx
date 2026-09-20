import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  Menu, 
  X, 
  ShieldCheck, 
  Compass, 
  Wrench, 
  Sparkles,
  MessageSquare,
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  Disc
} from 'lucide-react';
import { BackgroundTheme } from '../types';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { BrandLogo } from './BrandLogo';
import { triggerSOSHaptic } from '../utils/haptics';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bgTheme: BackgroundTheme;
  setBgTheme: (t: BackgroundTheme) => void;
  cartCount: number;
  openCart: () => void;
  openSOS: () => void;
  adminOrdersCount: number;
  activeOrdersCount?: number;
  openAdminOrders: () => void;
  onOpenDeviceSimulator?: (platform?: 'ios' | 'android') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  bgTheme,
  setBgTheme,
  cartCount,
  openCart,
  openSOS,
  adminOrdersCount,
  activeOrdersCount,
  openAdminOrders,
  onOpenDeviceSimulator,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayActiveOrdersCount = activeOrdersCount !== undefined ? activeOrdersCount : adminOrdersCount;

  // Workshop links
  const navItems = [
    { id: 'inventory', label: 'Tyre Inventory', icon: Disc },
    { id: 'services', label: 'Workshop Services & Guide', icon: Wrench },
    { id: 'location', label: 'Fitting Bays & Location', icon: MapPin },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    // Smooth scroll to top or section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      {/* Top Banner with Dominica info & Quick Hotline */}
      <div className="bg-slate-900/90 text-slate-200 text-xs font-medium py-1.5 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Open Today: 7:30 AM – 6:00 PM
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#E17055]" />
              Maranatha Square, Pichelin, Dominica
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3.5 h-3.5 text-[#0984E3]" />
              Direct:
            </span>
            <a 
              href="tel:+17676160155"
              className="inline-flex items-center gap-1.5 justify-center text-[#0984E3] hover:text-blue-300 hover:underline font-bold px-3 py-1 bg-slate-950/80 rounded-md border border-slate-700/80 transition"
              style={{ minHeight: '32px' }}
            >
              <Phone className="w-3.5 h-3.5 sm:hidden text-[#0984E3]" />
              +1 767 616 0155
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleNavClick('inventory')}
            className="cursor-pointer py-1"
          >
            <BrandLogo variant="navbar" showTagline={true} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-[#0984E3]/20 text-[#0984E3] border border-[#0984E3]/40 shadow-xs' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0984E3]' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Admin Portal Button Alongside Workshop Links */}
            <button
              id="desktop-menu-admin-portal"
              data-testid="desktop-nav-admin-portal-btn"
              type="button"
              onClick={openAdminOrders}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 shadow-xs cursor-pointer active:scale-95 group"
              title="Workshop Admin Portal (Tyre Inventory, Orders Dispatch & Financial Analytics)"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 fill-amber-400/25 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)] group-hover:scale-110 transition-transform" />
              <span>Admin Portal</span>
              {displayActiveOrdersCount > 0 ? (
                <span 
                  id="desktop-admin-active-orders-badge"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm min-w-[20px] animate-pulse"
                  title={`${displayActiveOrdersCount} active orders requiring workshop attention`}
                >
                  {displayActiveOrdersCount}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center bg-slate-800 text-amber-300/60 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-700">
                  0
                </span>
              )}
            </button>
          </nav>

          {/* Action Buttons: Cart Drawer & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Cart Drawer Trigger */}
            <button
              id="cart-button-nav"
              onClick={openCart}
              className="relative inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md border border-emerald-400 transition transform hover:scale-105"
              aria-label="View reserved tyres and services"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>Cart & Reserve</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 text-xs font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Roadside Rescue SOS Quick Button */}
            <button
              id="nav-sos-btn"
              onClick={() => {
                triggerSOSHaptic();
                openSOS();
              }}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-extrabold px-3 sm:px-3.5 py-2.5 rounded-xl shadow-md border border-red-400 transition transform hover:scale-105 active:scale-95"
              title="Emergency Roadside Puncture Rescue (Maranatha Square, Pichelin)"
              aria-label="Emergency Roadside Rescue SOS"
            >
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
              <span className="hidden sm:inline">SOS</span>
              <span className="sm:hidden font-black">SOS</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 pt-3 pb-6 space-y-2 shadow-xl">
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-left transition ${
                    isActive
                      ? 'bg-blue-600/20 text-[#0984E3] border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* My Orders & Receipts in Cart */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openCart();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold text-left text-slate-300 hover:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#0984E3]" />
                <span>My Orders & Receipts</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-blue-400 border border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                In Cart
              </span>
            </button>

            {/* Admin Portal in Mobile Menu Area Alongside Workshop Links */}
            <button
              id="mobile-drawer-admin-portal"
              data-testid="mobile-drawer-admin-portal-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAdminOrders();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold text-left text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 fill-amber-400/25 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]" />
                <span>Admin Portal</span>
              </div>
              <div className="flex items-center gap-1.5">
                {displayActiveOrdersCount > 0 ? (
                  <span 
                    id="mobile-admin-active-orders-badge"
                    className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse"
                  >
                    {displayActiveOrdersCount} Active
                  </span>
                ) : (
                  <span className="bg-slate-800 text-amber-300/60 text-xs font-bold px-2 py-0.5 rounded-full">
                    0
                  </span>
                )}
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                  Staff
                </span>
              </div>
            </button>

            {/* Emergency Roadside SOS (Mobile Drawer) */}
            <button
              id="mobile-drawer-sos-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                triggerSOSHaptic();
                openSOS();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold text-left bg-red-600/15 border border-red-500/30 text-red-400 hover:bg-red-600/25 transition active:scale-95"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-white">Roadside Rescue SOS</span>
              </div>
              <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md">
                EMERGENCY
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <a
              href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Max%20Executive%20Tires,%20I%20am%20inquiring%20about%20tyres%20in%20Pichelin`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Chat on WhatsApp
            </a>
            <a
              href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-slate-200 font-bold py-2.5 rounded-lg text-sm border border-slate-800"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              Call Shop: {SHOP_LOCATION_INFO.phonePrimary}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
