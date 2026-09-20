import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Plus, 
  Eye, 
  Star, 
  Mountain, 
  Zap,
  Gauge,
  PackageCheck,
  Tag,
  Search,
  X,
  ChevronRight,
  Car,
  Layers,
  Award,
  WifiOff
} from 'lucide-react';
import { Tyre } from '../types';
import { TYRES_DATA, getRepresentativeVehicleForTyre } from '../data/tyresData';
import { triggerAddToCartHaptic } from '../utils/haptics';
import { useOnlineStatus } from '../utils/useOnlineStatus';

interface TireCatalogProps {
  tyres: Tyre[];
  allTyres?: Tyre[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectTyre: (tyre: Tyre) => void;
  onAddToCart: (tyre: Tyre) => void;
}

interface SizeSuggestion {
  type: 'size';
  label: string;
  count: number;
  vehicleExample?: string;
  rim: number;
}

interface BrandSuggestion {
  type: 'brand';
  label: string;
  count: number;
}

interface VehicleSuggestion {
  type: 'vehicle';
  label: string;
  targetSize: string;
  category: string;
}

type SuggestionItem = SizeSuggestion | BrandSuggestion | VehicleSuggestion;

// Common vehicle models in Dominica for quick auto-suggest matching
const DOMINICA_COMMON_VEHICLES = [
  { label: 'Toyota Hilux 4x4', targetSize: '265/65 R17', category: 'SUV, Crossover & 4x4' },
  { label: 'Toyota RAV4 / CR-V', targetSize: '225/65 R17', category: 'SUV, Crossover & 4x4' },
  { label: 'Toyota HiAce Commuter Bus', targetSize: '195/80 R15', category: 'Commercial Minibus & Van' },
  { label: 'Toyota Vitz / Yaris', targetSize: '175/65 R14', category: 'Passenger & Hatchback' },
  { label: 'Nissan Frontier / D22', targetSize: '265/70 R16', category: 'SUV, Crossover & 4x4' },
  { label: 'Suzuki Grand Vitara / Escudo', targetSize: '225/70 R16', category: 'SUV, Crossover & 4x4' },
  { label: 'Commercial Cargo Truck / Canter', targetSize: '7.50 R16', category: 'Heavy Duty Pickup & Truck' },
];

export const TireCatalog: React.FC<TireCatalogProps> = ({
  tyres,
  allTyres,
  searchQuery,
  onSearchChange,
  onSelectTyre,
  onAddToCart,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  // Determine whether search is controlled from parent or local
  const isControlled = searchQuery !== undefined && onSearchChange !== undefined;
  const currentSearch = isControlled ? searchQuery : internalSearch;

  const handleUpdateSearch = (value: string) => {
    if (isControlled && onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearch(value);
    }
  };

  // The full tyre pool to extract sizes, brands, and availability from
  const fullTyrePool = useMemo(() => {
    return allTyres && allTyres.length > 0 ? allTyres : (TYRES_DATA || tyres);
  }, [allTyres, tyres]);

  // If uncontrolled, filter local tyres by search query
  const displayedTyres = useMemo(() => {
    if (isControlled) {
      return tyres;
    }
    if (!internalSearch.trim()) {
      return tyres;
    }
    const q = internalSearch.toLowerCase().trim();
    return tyres.filter((tyre) => {
      const matchBrand = tyre.brand.toLowerCase().includes(q);
      const matchModel = tyre.modelName.toLowerCase().includes(q);
      const matchSize = tyre.size.toLowerCase().includes(q);
      const matchDesc = tyre.shortDescription.toLowerCase().includes(q);
      const matchCat = tyre.category.toLowerCase().includes(q);
      return matchBrand || matchModel || matchSize || matchDesc || matchCat;
    });
  }, [tyres, isControlled, internalSearch]);

  // Precompute unique brands and sizes with stock counts from the full pool
  const { uniqueSizes, uniqueBrands } = useMemo(() => {
    const sizeMap: Record<string, { count: number; vehicleExample?: string; rim: number }> = {};
    const brandMap: Record<string, number> = {};

    fullTyrePool.forEach((t) => {
      // Size counting
      if (!sizeMap[t.size]) {
        const rep = getRepresentativeVehicleForTyre(t);
        sizeMap[t.size] = {
          count: 0,
          vehicleExample: rep?.name,
          rim: t.rimDiameter,
        };
      }
      sizeMap[t.size].count += 1;

      // Brand counting
      brandMap[t.brand] = (brandMap[t.brand] || 0) + 1;
    });

    const sizes = Object.entries(sizeMap).map(([size, data]) => ({
      size,
      count: data.count,
      vehicleExample: data.vehicleExample,
      rim: data.rim,
    }));

    const brands = Object.entries(brandMap).map(([brand, count]) => ({
      brand,
      count,
    }));

    return { uniqueSizes: sizes, uniqueBrands: brands };
  }, [fullTyrePool]);

  // Generate suggestions as the user types
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const q = currentSearch.toLowerCase().trim();
    const cleanQ = q.replace(/[\s\/-]/g, '');

    // Case 1: Empty input - show popular Dominica tyre sizes & top brands
    if (!q) {
      const popularSizes: SuggestionItem[] = [
        '265/65 R17',
        '195/65 R15',
        '205/55 R16',
        '225/65 R17',
        '195/80 R15',
        '7.50 R16',
      ].map((sizeStr) => {
        const found = uniqueSizes.find((s) => s.size === sizeStr);
        return {
          type: 'size',
          label: sizeStr,
          count: found ? found.count : 4,
          vehicleExample: found?.vehicleExample,
          rim: found ? found.rim : 17,
        };
      });

      const topBrands: SuggestionItem[] = ['Bridgestone', 'Michelin', 'Goodyear', 'Dunlop'].map((b) => {
        const found = uniqueBrands.find((ub) => ub.brand.toLowerCase() === b.toLowerCase());
        return {
          type: 'brand',
          label: b,
          count: found ? found.count : 8,
        };
      });

      return [...popularSizes, ...topBrands];
    }

    // Case 2: User is typing - match tyre sizes
    const matchedSizes: SizeSuggestion[] = uniqueSizes
      .filter((s) => {
        const sizeNorm = s.size.toLowerCase();
        const sizeClean = sizeNorm.replace(/[\s\/-]/g, '');
        return sizeNorm.includes(q) || sizeClean.includes(cleanQ);
      })
      .slice(0, 8)
      .map((s) => ({
        type: 'size',
        label: s.size,
        count: s.count,
        vehicleExample: s.vehicleExample,
        rim: s.rim,
      }));

    // Match brands
    const matchedBrands: BrandSuggestion[] = uniqueBrands
      .filter((b) => b.brand.toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({
        type: 'brand',
        label: b.brand,
        count: b.count,
      }));

    // Match common Dominica vehicle models
    const matchedVehicles: VehicleSuggestion[] = DOMINICA_COMMON_VEHICLES
      .filter((v) => v.label.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
      .slice(0, 3)
      .map((v) => ({
        type: 'vehicle',
        label: v.label,
        targetSize: v.targetSize,
        category: v.category,
      }));

    return [...matchedSizes, ...matchedBrands, ...matchedVehicles];
  }, [currentSearch, uniqueSizes, uniqueBrands]);

  // Handle clicking a suggestion
  const handleSelectSuggestion = (item: SuggestionItem) => {
    if (item.type === 'size') {
      handleUpdateSearch(item.label);
    } else if (item.type === 'brand') {
      handleUpdateSearch(item.label);
    } else if (item.type === 'vehicle') {
      handleUpdateSearch(item.targetSize);
    }
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        setIsDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatPrice = (priceXCD: number) => {
    return `EC$ ${priceXCD.toLocaleString()}`;
  };

  const clearSearch = () => {
    handleUpdateSearch('');
    setHighlightedIndex(-1);
    setIsDropdownOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Quick preset pills for Dominica
  const quickPills = [
    { label: '265/65 R17', hint: 'Hilux / 4x4' },
    { label: '195/65 R15', hint: 'Sedan / Hatch' },
    { label: '205/55 R16', hint: 'Corolla' },
    { label: '225/65 R17', hint: 'RAV4 / CR-V' },
    { label: '195/80 R15', hint: 'HiAce Bus' },
    { label: 'Bridgestone', hint: 'Brand' },
    { label: 'Michelin', hint: 'Brand' },
  ];

  return (
    <div id="tyres-catalog-grid" className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0dec5a' }}>
              In-Stock Tyres at Maranatha Square, Pichelin
            </h2>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full" title="Connected to shop live inventory">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Pichelin Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full" title="Serving cached catalog in offline mode">
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Pichelin Offline Mode</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Showing {displayedTyres.length} matching {displayedTyres.length === 1 ? 'tyre' : 'tyres'} ready for same-day workshop fitting or roadside delivery
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="catalog-collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            {isCollapsed ? 'Expand Items ▾' : 'Collapse Items ▴'}
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All used tyres 100% leak tested</span>
          </div>
        </div>
      </div>

      {/* REFACTORED SEARCH BAR WITH AUTO-SUGGEST DROPDOWN */}
      <div 
        ref={searchContainerRef} 
        id="tire-catalog-search-container" 
        className="relative bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
      >
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-[#0984E3]" />
            </div>

            <input
              ref={searchInputRef}
              id="tire-catalog-search-input"
              type="text"
              value={currentSearch}
              onChange={(e) => {
                handleUpdateSearch(e.target.value);
                setIsDropdownOpen(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search by tyre size (e.g. 265/65 R17, 195/65 R15), brand, or vehicle..."
              autoComplete="off"
              className="w-full pl-10 pr-24 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-[#0984E3] focus:ring-2 focus:ring-[#0984E3]/20 transition outline-none"
            />

            {/* Trailing Controls (Clear Button & Match Counter) */}
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              {currentSearch && (
                <button
                  type="button"
                  id="tire-catalog-clear-search-btn"
                  onClick={clearSearch}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md hidden sm:inline-block">
                {displayedTyres.length} tyres
              </span>
            </div>
          </div>

          {/* AUTO-SUGGEST DROPDOWN */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div 
              id="tire-catalog-autosuggest-dropdown"
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto animate-fadeIn"
            >
              {/* Dropdown Header */}
              <div className="bg-slate-50/90 px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{currentSearch ? 'Matching Suggestions' : 'Common Sizes & Premier Brands'}</span>
                <span className="text-[10px] font-normal lowercase text-slate-400">↑↓ to navigate • Enter to select</span>
              </div>

              {/* Suggestions List */}
              <div className="py-1">
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;

                  if (item.type === 'size') {
                    return (
                      <button
                        key={`suggest-size-${item.label}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition cursor-pointer ${
                          isHighlighted ? 'bg-blue-50/90 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-1.5 rounded-lg bg-blue-100/70 text-[#0984E3] shrink-0">
                            <Gauge className="w-4 h-4" />
                          </span>
                          <div className="truncate">
                            <div className="text-xs font-extrabold font-mono text-slate-900 flex items-center gap-2">
                              <span>{item.label}</span>
                              <span className="text-[10px] font-sans font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                R{item.rim}"
                              </span>
                            </div>
                            {item.vehicleExample && (
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Car className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Typical: {item.vehicleExample}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {item.count} in stock
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    );
                  }

                  if (item.type === 'brand') {
                    return (
                      <button
                        key={`suggest-brand-${item.label}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition cursor-pointer ${
                          isHighlighted ? 'bg-amber-50/90 text-amber-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-lg bg-amber-100/70 text-amber-700 shrink-0">
                            <Award className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-xs font-black text-slate-900">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Premier Manufacturer • Pressure Certified
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.count} options
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    );
                  }

                  if (item.type === 'vehicle') {
                    return (
                      <button
                        key={`suggest-vehicle-${item.label}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition cursor-pointer ${
                          isHighlighted ? 'bg-emerald-50/90 text-emerald-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700 shrink-0">
                            <Car className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Recommended size: <strong className="font-mono text-slate-700">{item.targetSize}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-[#0984E3] bg-blue-50 px-2 py-0.5 rounded-md">
                            {item.targetSize}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Quick helper footer in dropdown */}
              <div className="bg-slate-50 p-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
                <span>Can't find your size? Stop by Maranatha Square or call </span>
                <a href="tel:+17676160155" className="font-bold text-[#0984E3] underline">+1 (767) 616-0155</a>
              </div>
            </div>
          )}
        </div>

        {/* Quick Filter Size Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Popular in Dominica:</span>
          </span>
          {quickPills.map((pill) => {
            const isActive = currentSearch.toLowerCase() === pill.label.toLowerCase();
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  if (isActive) {
                    handleUpdateSearch('');
                  } else {
                    handleUpdateSearch(pill.label);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#0984E3] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
                }`}
              >
                <span className="font-mono font-bold">{pill.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  ({pill.hint})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* No Tyres Match State */}
      {displayedTyres.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#0984E3] rounded-full flex items-center justify-center mx-auto">
            <Gauge className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#2D3436]">
            No tyres match {currentSearch ? `"${currentSearch}"` : 'your exact filter combination'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We frequently receive new shipments of new and pre-owned tyres at Maranatha Square. Try searching for a different size or brand, or reset your search.
          </p>
          {currentSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0984E3] hover:bg-[#0873c4] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search Query</span>
            </button>
          )}
        </div>
      ) : isCollapsed ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-600">
          Items collapsed ({displayedTyres.length} items hidden). Click <button onClick={() => setIsCollapsed(false)} className="text-[#0984E3] font-bold underline cursor-pointer">Expand Items</button> to view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTyres.map((tyre) => {
            const isNew = tyre.condition === 'new';
            const treadPercent = Math.round((tyre.treadDepthMm / tyre.originalTreadMm) * 100);

            return (
              <div
                key={tyre.id}
                id={`tyre-card-${tyre.id}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Top Image & Badges */}
                <div className="relative h-48 bg-slate-950 overflow-hidden">
                  <img
                    src={tyre.image}
                    alt={`${tyre.brand} ${tyre.modelName} ${tyre.size}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40"></div>

                  {/* Condition & Low Stock Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isNew ? (
                      <span className="bg-[#0984E3] text-white text-xs font-bold uppercase px-2.5 py-1 rounded-md shadow-xs">
                        ✨ Brand New
                      </span>
                    ) : (
                      <span className="bg-slate-900/90 text-slate-100 border border-slate-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                        🔍 Tested Used Tyre
                      </span>
                    )}

                    {tyre.isSpecialDeal && (
                      <span className="bg-[#E17055] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        🔥 Special Value
                      </span>
                    )}

                    {tyre.stockCount < 5 && (
                      <span className={`text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1 ${
                        tyre.stockCount <= 0 
                          ? 'bg-slate-800 border border-slate-600' 
                          : tyre.stockCount <= 2 
                          ? 'bg-red-600 animate-pulse' 
                          : 'bg-amber-600'
                      }`}>
                        ⚠️ Low Stock: Only {tyre.stockCount} left!
                      </span>
                    )}
                  </div>

                  {/* Bottom Size Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="text-xl font-bold tracking-tight text-white drop-shadow-xs font-mono">
                        {tyre.size}
                      </div>
                      <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                        <span>{tyre.brand}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{tyre.modelName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div 
                  className="p-5 flex-1 flex flex-col justify-between space-y-4"
                  style={tyre.id === 'tyre-01' ? { width: '350.5px', height: '276.828px' } : undefined}
                >
                  <div>
                    {/* Category & Road Rating */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-700">{tyre.category}</span>
                      <span className="flex items-center gap-1 font-bold text-[#E17055]">
                        <Mountain className="w-3.5 h-3.5" />
                        Dominica Grip: {tyre.dominicaMountainRating}/5
                      </span>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {tyre.shortDescription}
                    </p>

                    {/* Representative Vehicle Tag */}
                    <div className="mt-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900 font-medium">
                      <span className="text-sm">🚗</span>
                      <div className="truncate">
                        <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-bold">Representative Vehicle:</span>
                        <span className="font-bold truncate">{getRepresentativeVehicleForTyre(tyre).name}</span>
                      </div>
                    </div>

                    {/* Dimensions & Specifications Chips */}
                    <div className="grid grid-cols-3 gap-1.5 mt-3 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Width</span>
                        <span className="font-bold text-slate-800">{tyre.width} mm</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Profile</span>
                        <span className="font-bold text-slate-800">/{tyre.aspectRatio}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Rim</span>
                        <span className="font-bold text-slate-800">R{tyre.rimDiameter} ({tyre.rimDiameter}")</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Price per tyre</span>
                        <span className="text-2xl font-black text-[#2D3436]">
                          {formatPrice(tyre.priceXCD)}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        In Stock
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id={`view-details-${tyre.id}`}
                        onClick={() => onSelectTyre(tyre)}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Full Specs
                      </button>

                      <button
                        type="button"
                        id={`reserve-tyre-${tyre.id}`}
                        onClick={() => {
                          triggerAddToCartHaptic();
                          onAddToCart(tyre);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-[#0984E3] hover:bg-[#0873c4] text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs transition transform active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Reserve Fitting
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
