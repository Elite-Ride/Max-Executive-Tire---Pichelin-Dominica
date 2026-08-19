import React from 'react';
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
  Tag
} from 'lucide-react';
import { Tyre, Currency } from '../types';

interface TireCatalogProps {
  tyres: Tyre[];
  currency: Currency;
  onSelectTyre: (tyre: Tyre) => void;
  onAddToCart: (tyre: Tyre) => void;
  onOpenAdvisor: () => void;
}

export const TireCatalog: React.FC<TireCatalogProps> = ({
  tyres,
  currency,
  onSelectTyre,
  onAddToCart,
  onOpenAdvisor,
}) => {
  const formatPrice = (priceXCD: number, priceUSD: number) => {
    if (currency === 'XCD') {
      return `EC$ ${priceXCD.toLocaleString()}`;
    }
    return `$${priceUSD.toFixed(2)}`;
  };

  return (
    <div id="tyres-catalog-grid" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
            In-Stock Tyres at Maranatha Square, Pichelin
          </h2>
          <p className="text-sm text-slate-500">
            Showing {tyres.length} matching {tyres.length === 1 ? 'tyre' : 'tyres'} ready for same-day workshop fitting or roadside delivery
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All used tyres 100% leak & pressure tested</span>
        </div>
      </div>

      {tyres.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#0984E3] rounded-full flex items-center justify-center mx-auto">
            <Gauge className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#2D3436]">
            No tyres match your exact filter combination
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We frequently receive new shipments of new and pre-owned tyres at Maranatha Square. Contact us directly, reset your filters, or ask our Dominica AI Tyre Advisor!
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onOpenAdvisor}
              className="inline-flex items-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-white" />
              Ask AI Tyre Advisor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tyres.map((tyre) => {
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
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40"></div>

                  {/* Condition Badge (Type: New vs Used) */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isNew ? (
                      <span className="bg-[#0984E3] text-white text-xs font-bold uppercase px-2.5 py-1 rounded-md shadow-xs">
                        ✨ Brand New
                      </span>
                    ) : (
                      <span className="bg-slate-900/90 text-slate-100 border border-slate-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                        🔍 Tested Used ({treadPercent}% Tread)
                      </span>
                    )}

                    {tyre.isSpecialDeal && (
                      <span className="bg-[#E17055] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        🔥 Special Value
                      </span>
                    )}
                  </div>

                  {/* Quantity / Stock Badge */}
                  <div className="absolute top-3 right-3 text-right">
                    <span className="inline-flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-700">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{tyre.stockCount} In Stock</span>
                    </span>
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
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
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

                    <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Tread Remaining:</span>
                        <span className="font-bold text-slate-800">
                          {tyre.treadDepthMm}mm ({treadPercent}%)
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Available Sets:</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {tyre.stockCount >= 4 ? 'Full Set (4+) Ready' : tyre.stockCount >= 2 ? 'Pair (2) Ready' : 'Single Tyre'}
                        </span>
                      </div>
                    </div>

                    {/* Inspection / Warranty tag */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span className="truncate">{tyre.warranty}</span>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Price per tyre</span>
                        <span className="text-2xl font-black text-[#2D3436]">
                          {formatPrice(tyre.priceXCD, tyre.priceUSD)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {currency === 'XCD' ? `($${tyre.priceUSD} USD)` : `(EC$ ${tyre.priceXCD})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id={`view-details-${tyre.id}`}
                        onClick={() => onSelectTyre(tyre)}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Full Specs
                      </button>

                      <button
                        type="button"
                        id={`reserve-tyre-${tyre.id}`}
                        onClick={() => onAddToCart(tyre)}
                        className="inline-flex items-center justify-center gap-1.5 bg-[#0984E3] hover:bg-[#0873c4] text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs transition transform active:scale-95"
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
