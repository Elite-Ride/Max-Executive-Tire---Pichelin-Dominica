import React from 'react';
import { Search, Filter, RotateCcw, Car, Check, DollarSign, Layers, Tag, SlidersHorizontal } from 'lucide-react';
import { TyreCondition, TyreCategory, DominicaVehiclePreset, Currency } from '../types';
import { DOMINICA_VEHICLE_PRESETS } from '../data/tyresData';

interface TireFinderProps {
  selectedBrand: string;
  setSelectedBrand: (val: string) => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  selectedWidth: string;
  setSelectedWidth: (val: string) => void;
  selectedAspect: string;
  setSelectedAspect: (val: string) => void;
  selectedRim: string;
  setSelectedRim: (val: string) => void;
  selectedCondition: TyreCondition | 'all';
  setSelectedCondition: (val: TyreCondition | 'all') => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  minQuantity: string;
  setMinQuantity: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  currency: Currency;
  onReset: () => void;
  onSelectVehiclePreset: (preset: DominicaVehiclePreset) => void;
  activePresetId: string | null;
  totalFilteredCount: number;
}

export const TireFinder: React.FC<TireFinderProps> = ({
  selectedBrand,
  setSelectedBrand,
  selectedModel,
  setSelectedModel,
  selectedWidth,
  setSelectedWidth,
  selectedAspect,
  setSelectedAspect,
  selectedRim,
  setSelectedRim,
  selectedCondition,
  setSelectedCondition,
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minQuantity,
  setMinQuantity,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  currency,
  onReset,
  onSelectVehiclePreset,
  activePresetId,
  totalFilteredCount,
}) => {
  const brands = [
    'All Brands',
    'Bridgestone',
    'Michelin',
    'Goodyear',
    'Hankook',
    'Dunlop',
    'Yokohama',
    'Continental',
    'Pirelli',
    'Maxxis',
    'BFGoodrich',
    'Sailun',
    'Kumho',
  ];

  const widths = ['175', '185', '195', '205', '215', '225', '235', '245', '265'];
  const aspects = ['55', '60', '65', '70', '75', '80', '85'];
  const rims = ['13', '14', '15', '16', '17', '18'];

  const categories = [
    'All Categories',
    'Passenger & Hatchback',
    'SUV, Crossover & 4x4',
    'All-Terrain (A/T)',
    'Commercial Van & Minibus',
    'Mud-Terrain (M/T)'
  ];

  const hasActiveFilters = Boolean(
    selectedBrand ||
    selectedModel ||
    selectedWidth ||
    selectedAspect ||
    selectedRim ||
    selectedCondition !== 'all' ||
    selectedCategory !== 'All Categories' ||
    minPrice ||
    maxPrice ||
    minQuantity ||
    searchQuery
  );

  return (
    <div id="tyre-finder-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-8 space-y-6">
      
      {/* Top Header & Type / Condition Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] flex items-center justify-center font-bold">
              <Filter className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-[#2D3436] tracking-tight">
              Searchable Tyre Inventory & Fitment Finder
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filter in-stock tyres by brand, model, size (diameter, width, aspect ratio), condition, price, and available quantity in Pichelin.
          </p>
        </div>

        {/* Condition Filter (Type: New vs Used) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              id="filter-cond-all"
              onClick={() => setSelectedCondition('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCondition === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              id="filter-cond-new"
              onClick={() => setSelectedCondition('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCondition === 'new'
                  ? 'bg-[#0984E3] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✨ Brand New
            </button>
            <button
              type="button"
              id="filter-cond-used"
              onClick={() => setSelectedCondition('used')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCondition === 'used'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔍 Tested Used (80%+)
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              id="reset-all-filters-top-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Dominica Vehicle Matcher Quick Chips */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Dominica Vehicle Quick Matcher:
        </label>
        <div className="flex flex-wrap gap-2">
          {DOMINICA_VEHICLE_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-${preset.id}`}
                onClick={() => onSelectVehiclePreset(preset)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isSelected
                    ? 'bg-[#0984E3] border-[#0984E3] text-white shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{preset.name}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Filter Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        
        {/* FIELD 1: Brand */}
        <div>
          <label htmlFor="filter-brand-select" className="block text-xs font-bold text-slate-700 mb-1">
            Tyre Brand
          </label>
          <select
            id="filter-brand-select"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
          >
            {brands.map((b) => (
              <option key={b} value={b === 'All Brands' ? '' : b}>{b}</option>
            ))}
          </select>
        </div>

        {/* FIELD 2: Model (Direct Input or Search) */}
        <div>
          <label htmlFor="filter-model-input" className="block text-xs font-bold text-slate-700 mb-1">
            Model / Tread Pattern
          </label>
          <div className="relative">
            <input
              id="filter-model-input"
              type="text"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="e.g. Dueler, Primacy, Vantra..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0984E3]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>

        {/* FIELD 3: Category */}
        <div>
          <label htmlFor="filter-category-select" className="block text-xs font-bold text-slate-700 mb-1">
            Vehicle & Terrain Category
          </label>
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3] focus:border-[#0984E3]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* FIELD 4: General Keyword Search */}
        <div>
          <label htmlFor="filter-keyword-input" className="block text-xs font-bold text-slate-700 mb-1">
            Keywords / Vehicle Fitment
          </label>
          <div className="relative">
            <input
              id="filter-keyword-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Hilux, Minibus, Commercial..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0984E3]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {/* Row 2: Precise Size Fields (Width, Aspect, Diameter) + Price & Quantity */}
      <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0984E3]" />
          <span>Size Dimensions (Width / Aspect / Diameter), Price Range & In-Stock Quantity:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Size Field: Width */}
          <div>
            <label htmlFor="filter-width-select" className="block text-xs font-bold text-slate-700 mb-1">
              Width (mm)
            </label>
            <select
              id="filter-width-select"
              value={selectedWidth}
              onChange={(e) => setSelectedWidth(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3]"
            >
              <option value="">Any Width</option>
              {widths.map((w) => (
                <option key={w} value={w}>{w} mm</option>
              ))}
            </select>
          </div>

          {/* Size Field: Aspect Ratio */}
          <div>
            <label htmlFor="filter-aspect-select" className="block text-xs font-bold text-slate-700 mb-1">
              Aspect Ratio (%)
            </label>
            <select
              id="filter-aspect-select"
              value={selectedAspect}
              onChange={(e) => setSelectedAspect(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3]"
            >
              <option value="">Any Aspect</option>
              {aspects.map((a) => (
                <option key={a} value={a}>/{a}</option>
              ))}
            </select>
          </div>

          {/* Size Field: Rim Diameter */}
          <div>
            <label htmlFor="filter-rim-select" className="block text-xs font-bold text-slate-700 mb-1">
              Diameter / Rim
            </label>
            <select
              id="filter-rim-select"
              value={selectedRim}
              onChange={(e) => setSelectedRim(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3]"
            >
              <option value="">Any Diameter</option>
              {rims.map((r) => (
                <option key={r} value={r}>R{r} ( {r}" )</option>
              ))}
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <label htmlFor="filter-max-price-select" className="block text-xs font-bold text-slate-700 mb-1">
              Price Range ({currency === 'XCD' ? 'EC$' : 'USD'})
            </label>
            <select
              id="filter-max-price-select"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3]"
            >
              <option value="">All Prices</option>
              <option value="200">Under {currency === 'XCD' ? 'EC$ 200' : '$75 USD'}</option>
              <option value="350">Under {currency === 'XCD' ? 'EC$ 350' : '$130 USD'}</option>
              <option value="550">Under {currency === 'XCD' ? 'EC$ 550' : '$200 USD'}</option>
              <option value="750">Under {currency === 'XCD' ? 'EC$ 750' : '$280 USD'}</option>
            </select>
          </div>

          {/* Minimum Quantity / Stock Filter */}
          <div>
            <label htmlFor="filter-quantity-select" className="block text-xs font-bold text-slate-700 mb-1">
              Min. In-Stock Qty
            </label>
            <select
              id="filter-quantity-select"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3]"
            >
              <option value="">Any Quantity</option>
              <option value="1">1+ Single Tyre</option>
              <option value="2">2+ Pair Available</option>
              <option value="4">4+ Full Set Available</option>
              <option value="8">8+ Fleet / Bulk</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="filter-sort-select" className="block text-xs font-bold text-slate-700 mb-1">
              Sort By
            </label>
            <select
              id="filter-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0984E3]"
            >
              <option value="featured">Featured / Best Value</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="brand-asc">Brand: A to Z</option>
              <option value="stock-desc">Stock Quantity (High to Low)</option>
              <option value="grip-desc">Mountain Grip Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-500">Matching Inventory:</span>
          <span className="bg-blue-50 text-[#0984E3] font-bold px-2 py-0.5 rounded border border-blue-200">
            {totalFilteredCount} {totalFilteredCount === 1 ? 'tyre found' : 'tyres found'}
          </span>

          {selectedBrand && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              Brand: {selectedBrand}
              <button type="button" onClick={() => setSelectedBrand('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}

          {selectedModel && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              Model: {selectedModel}
              <button type="button" onClick={() => setSelectedModel('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}

          {(selectedWidth || selectedAspect || selectedRim) && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              Size: {selectedWidth || '*'}/{selectedAspect || '*'} R{selectedRim || '*'}
              <button type="button" onClick={() => { setSelectedWidth(''); setSelectedAspect(''); setSelectedRim(''); }} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}

          {selectedCondition !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              Type: {selectedCondition === 'new' ? 'New' : 'Used'}
              <button type="button" onClick={() => setSelectedCondition('all')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}

          {maxPrice && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              Max Price: {currency === 'XCD' ? `EC$ ${maxPrice}` : `$${(Number(maxPrice)/2.7).toFixed(0)} USD`}
              <button type="button" onClick={() => setMaxPrice('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}

          {minQuantity && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              Min Qty: {minQuantity}+
              <button type="button" onClick={() => setMinQuantity('')} className="hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-slate-500 hover:text-slate-800 font-medium underline"
          >
            Clear all filters
          </button>
        )}
      </div>

    </div>
  );
};

