import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TireFinder } from './components/TireFinder';
import { TireCatalog } from './components/TireCatalog';
import { TireDetailModal } from './components/TireDetailModal';
import { ServicesSection } from './components/ServicesSection';
import { RoadsideRescueSOS } from './components/RoadsideRescueSOS';
import { AITyreAdvisor } from './components/AITyreAdvisor';
import { DominicaTyreGuide } from './components/DominicaTyreGuide';
import { LocationSection } from './components/LocationSection';
import { Testimonials } from './components/Testimonials';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { TYRES_DATA } from './data/tyresData';
import { Tyre, CartItem, Currency, DominicaVehiclePreset, TyreCondition, BackgroundTheme } from './types';
import { 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  Wrench, 
  ShieldCheck, 
  MapPin,
  Car,
  RotateCcw
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from './data/servicesData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [currency, setCurrency] = useState<Currency>('XCD');
  const [bgTheme, setBgTheme] = useState<BackgroundTheme>(() => {
    try {
      return (localStorage.getItem('max_executive_bg_theme') as BackgroundTheme) || 'tarmac';
    } catch {
      return 'tarmac';
    }
  });
  
  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('max_executive_cart') || localStorage.getItem('maranatha_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [selectedTyreDetail, setSelectedTyreDetail] = useState<Tyre | null>(null);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedWidth, setSelectedWidth] = useState<string>('');
  const [selectedAspect, setSelectedAspect] = useState<string>('');
  const [selectedRim, setSelectedRim] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<TyreCondition | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minQuantity, setMinQuantity] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('max_executive_bg_theme', bgTheme);
    } catch (e) {
      console.warn('Could not save bg theme:', e);
    }
  }, [bgTheme]);

  // Handle Preset selection
  const handleSelectVehiclePreset = (preset: DominicaVehiclePreset) => {
    if (activePresetId === preset.id) {
      setActivePresetId(null);
      setSelectedCategory('All Categories');
      setSelectedRim('');
      setSelectedWidth('');
      setSelectedAspect('');
    } else {
      setActivePresetId(preset.id);
      // Auto-populate filter from preset
      setSelectedCategory(preset.category);
      if (preset.typicalSizes.length > 0) {
        const firstSize = preset.typicalSizes[0]; // e.g. "265/65 R17"
        const parts = firstSize.match(/(\d+)\/(\d+)\s*R(\d+)/);
        if (parts) {
          setSelectedWidth(parts[1]);
          setSelectedAspect(parts[2]);
          setSelectedRim(parts[3]);
        }
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedWidth('');
    setSelectedAspect('');
    setSelectedRim('');
    setSelectedCondition('all');
    setSelectedCategory('All Categories');
    setMinPrice('');
    setMaxPrice('');
    setMinQuantity('');
    setSortBy('featured');
    setSearchQuery('');
    setActivePresetId(null);
  };

  // Filtered & Sorted Tyres
  const filteredTyres = useMemo(() => {
    const list = TYRES_DATA.filter((tyre) => {
      // Brand filter
      if (selectedBrand && tyre.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      // Model filter
      if (selectedModel.trim() && !tyre.modelName.toLowerCase().includes(selectedModel.trim().toLowerCase())) {
        return false;
      }
      // Condition / Type filter (new / used)
      if (selectedCondition !== 'all' && tyre.condition !== selectedCondition) {
        return false;
      }
      // Width filter
      if (selectedWidth && tyre.width.toString() !== selectedWidth) {
        return false;
      }
      // Aspect ratio filter
      if (selectedAspect && tyre.aspectRatio.toString() !== selectedAspect) {
        return false;
      }
      // Rim diameter filter
      if (selectedRim && tyre.rimDiameter.toString() !== selectedRim) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All Categories' && tyre.category !== selectedCategory) {
        return false;
      }
      // Max price filter (checks price in selected currency)
      if (maxPrice) {
        const limit = Number(maxPrice);
        if (currency === 'XCD') {
          if (tyre.priceXCD > limit) return false;
        } else {
          // In USD mode, convert limit or check USD equivalent
          const limitUSD = limit / 2.70;
          if (tyre.priceUSD > limitUSD && tyre.priceXCD > limit) return false;
        }
      }
      // Minimum in-stock quantity filter
      if (minQuantity) {
        if (tyre.stockCount < Number(minQuantity)) {
          return false;
        }
      }
      // Search keyword (matches brand, model, size, features, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBrand = tyre.brand.toLowerCase().includes(q);
        const matchesModel = tyre.modelName.toLowerCase().includes(q);
        const matchesSize = tyre.size.toLowerCase().includes(q);
        const matchesDesc = tyre.shortDescription.toLowerCase().includes(q);
        const matchesCategory = tyre.category.toLowerCase().includes(q);
        if (!matchesBrand && !matchesModel && !matchesSize && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceXCD - b.priceXCD;
      if (sortBy === 'price-desc') return b.priceXCD - a.priceXCD;
      if (sortBy === 'brand-asc') return a.brand.localeCompare(b.brand);
      if (sortBy === 'stock-desc') return b.stockCount - a.stockCount;
      if (sortBy === 'grip-desc') return b.dominicaMountainRating - a.dominicaMountainRating;
      // Default: popular first, then special deals
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    });
  }, [
    selectedBrand,
    selectedModel,
    selectedCondition,
    selectedWidth,
    selectedAspect,
    selectedRim,
    selectedCategory,
    maxPrice,
    minQuantity,
    sortBy,
    searchQuery,
    currency,
  ]);

  // Cart operations
  const handleAddToCart = (tyre: Tyre) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.tyre.id === tyre.id);
      if (existing) {
        return prev.map((item) =>
          item.tyre.id === tyre.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          tyre,
          quantity: 2,
          includeMounting: true,
          includeBalancing: true,
          includeNewValves: true,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleAddToCartWithServices = (
    tyre: Tyre,
    qty: number,
    includeMounting: boolean,
    includeBalancing: boolean,
    includeValves: boolean
  ) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.tyre.id === tyre.id);
      if (existing) {
        return prev.map((item) =>
          item.tyre.id === tyre.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                includeMounting,
                includeBalancing,
                includeNewValves: includeValves,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          tyre,
          quantity: qty,
          includeMounting,
          includeBalancing,
          includeNewValves: includeValves,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleToggleService = (
    itemId: string,
    serviceKey: 'mounting' | 'balancing' | 'valves'
  ) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (serviceKey === 'mounting') return { ...item, includeMounting: !item.includeMounting };
          if (serviceKey === 'balancing') return { ...item, includeBalancing: !item.includeBalancing };
          if (serviceKey === 'valves') return { ...item, includeNewValves: !item.includeNewValves };
        }
        return item;
      })
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-[#0984E3] selection:text-white ${
      bgTheme === 'carbon' 
        ? 'bg-theme-carbon text-slate-100' 
        : bgTheme === 'light' 
          ? 'bg-theme-light text-slate-900' 
          : 'bg-theme-tarmac text-slate-100'
    }`}>
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        bgTheme={bgTheme}
        setBgTheme={setBgTheme}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        openSOS={() => setIsSOSOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <Hero
          onSearchClick={() => {
            setActiveTab('inventory');
            const el = document.getElementById('tyre-finder-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onBookServiceClick={() => {
            setActiveTab('services');
            const el = document.getElementById('service-booking-form-box');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onSOSClick={() => setIsSOSOpen(true)}
          onAdvisorClick={() => {
            setActiveTab('advisor');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Executive Sub-Nav Tab Switcher with Live Indicators */}
        <div className={`sticky top-14 z-30 backdrop-blur-md border-b transition-colors duration-200 ${
          bgTheme === 'light' 
            ? 'bg-white/95 border-slate-200 shadow-xs' 
            : 'bg-slate-950/90 border-slate-800 shadow-md'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-2 scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-max">
                <button
                  type="button"
                  id="tab-btn-inventory"
                  onClick={() => {
                    setActiveTab('inventory');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    activeTab === 'inventory'
                      ? 'bg-[#0984E3] text-white shadow-sm shadow-blue-500/20'
                      : bgTheme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Tyre Inventory</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'inventory' 
                      ? 'bg-white/20 text-white' 
                      : bgTheme === 'light'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-300'
                  }`}>
                    {filteredTyres.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-btn-services"
                  onClick={() => {
                    setActiveTab('services');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    activeTab === 'services'
                      ? 'bg-[#0984E3] text-white shadow-sm shadow-blue-500/20'
                      : bgTheme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Workshop Services & Bays</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-advisor"
                  onClick={() => {
                    setActiveTab('advisor');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    activeTab === 'advisor'
                      ? 'bg-[#0984E3] text-white shadow-sm shadow-blue-500/20'
                      : bgTheme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>AI Tyre Advisor</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-guide"
                  onClick={() => {
                    setActiveTab('guide');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    activeTab === 'guide'
                      ? 'bg-[#0984E3] text-white shadow-sm shadow-blue-500/20'
                      : bgTheme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Dominica Road Guide</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-location"
                  onClick={() => {
                    setActiveTab('location');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    activeTab === 'location'
                      ? 'bg-[#0984E3] text-white shadow-sm shadow-blue-500/20'
                      : bgTheme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Location & Hours</span>
                </button>
              </div>

              {/* Quick Call Button on Sub-nav */}
              <div className="hidden md:flex items-center gap-2">
                <a
                  href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                    bgTheme === 'light'
                      ? 'text-slate-700 hover:text-[#0984E3] bg-slate-100 border-slate-200'
                      : 'text-slate-200 hover:text-white bg-slate-900 border-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-[#0984E3]" />
                  <span>Call {SHOP_LOCATION_INFO.phonePrimary}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tab-driven Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
          
          {/* TAB 1: Inventory & Sales */}
          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-fade-in">
              <TireFinder
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                selectedWidth={selectedWidth}
                setSelectedWidth={setSelectedWidth}
                selectedAspect={selectedAspect}
                setSelectedAspect={setSelectedAspect}
                selectedRim={selectedRim}
                setSelectedRim={setSelectedRim}
                selectedCondition={selectedCondition}
                setSelectedCondition={setSelectedCondition}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                minQuantity={minQuantity}
                setMinQuantity={setMinQuantity}
                sortBy={sortBy}
                setSortBy={setSortBy}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currency={currency}
                onReset={handleResetFilters}
                onSelectVehiclePreset={handleSelectVehiclePreset}
                activePresetId={activePresetId}
                totalFilteredCount={filteredTyres.length}
              />

              <TireCatalog
                tyres={filteredTyres}
                currency={currency}
                onSelectTyre={(tyre) => setSelectedTyreDetail(tyre)}
                onAddToCart={handleAddToCart}
                onOpenAdvisor={() => setActiveTab('advisor')}
              />

              {/* Dominica Customer Reviews */}
              <div className="pt-8">
                <Testimonials />
              </div>
            </div>
          )}

          {/* TAB 2: Workshop Services & Booking */}
          {activeTab === 'services' && (
            <div className="animate-fade-in space-y-12">
              <ServicesSection
                currency={currency}
                onOpenSOS={() => setIsSOSOpen(true)}
              />

              <Testimonials />
            </div>
          )}

          {/* TAB 3: AI Tyre Advisor */}
          {activeTab === 'advisor' && (
            <div className="animate-fade-in space-y-10">
              <AITyreAdvisor />
              <DominicaTyreGuide />
            </div>
          )}

          {/* TAB 4: Dominica Road Guide */}
          {activeTab === 'guide' && (
            <div className="animate-fade-in space-y-12">
              <DominicaTyreGuide />
              <LocationSection />
            </div>
          )}

          {/* TAB 5: Location & Workshop Schedule */}
          {activeTab === 'location' && (
            <div className="animate-fade-in space-y-12">
              <LocationSection />
              <Testimonials />
            </div>
          )}

          {/* Emergency SOS Modal if open */}
          {isSOSOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
              <div className="max-w-3xl w-full my-8">
                <RoadsideRescueSOS onClose={() => setIsSOSOpen(false)} />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating Desktop & Tablet Assistance Widget */}
      <aside aria-label="Quick Assistance and Emergency Contacts" className="hidden md:flex fixed bottom-6 right-6 z-30 flex-col items-end gap-2.5">
        <button
          onClick={() => setIsSOSOpen(true)}
          className="group inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg shadow-red-600/30 transition transform hover:scale-105"
          title="Emergency Roadside Puncture Rescue"
        >
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Roadside SOS</span>
        </button>

        <a
          href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Max%20Executive%20Tires,%20I%20need%20tyres%20in%20Pichelin`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg shadow-emerald-600/30 transition transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Shop</span>
        </a>
      </aside>

      {/* Floating Bottom Quick Action for Mobile */}
      <div 
        className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-2 justify-center items-center px-2 max-w-[calc(100vw-24px)]"
        style={{ width: '500px', minHeight: '31px' }}
      >
        <button
          onClick={() => setIsSOSOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2 rounded-lg shadow-md flex items-center justify-center gap-1.5 h-full py-1.5"
          style={{ width: '199.5px' }}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>SOS Roadside</span>
        </button>

        <a
          href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Max%20Executive%20Tires,%20I%20need%20tyres%20in%20Pichelin`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2 rounded-lg shadow-md flex items-center justify-center gap-1.5 h-full py-1.5"
          style={{ width: '200.5px' }}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Shop</span>
        </a>
      </div>

      {/* Detail Modal */}
      {selectedTyreDetail && (
        <TireDetailModal
          tyre={selectedTyreDetail}
          currency={currency}
          onClose={() => setSelectedTyreDetail(null)}
          onAddToCartWithServices={handleAddToCartWithServices}
        />
      )}

      {/* Reservation Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        currency={currency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onToggleService={handleToggleService}
        onClearCart={handleClearCart}
      />

      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

    </div>
  );
}
