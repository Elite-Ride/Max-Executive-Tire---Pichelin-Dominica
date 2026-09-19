import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Check,
  Plus,
  Minus,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Tyre } from '../types';

interface AdminQuickAdjustModalProps {
  isOpen: boolean;
  tyre: Tyre | null;
  onClose: () => void;
  onSave: (tyreId: string, newPriceXCD: number, newStockCount: number) => void;
}

export const AdminQuickAdjustModal: React.FC<AdminQuickAdjustModalProps> = ({
  isOpen,
  tyre,
  onClose,
  onSave
}) => {
  const [priceVal, setPriceVal] = useState<string>('');
  const [stockVal, setStockVal] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (tyre) {
      setPriceVal(tyre.priceXCD.toString());
      setStockVal(tyre.stockCount.toString());
      setFeedback(null);
    }
  }, [tyre, isOpen]);

  if (!isOpen || !tyre) return null;

  const currentPrice = tyre.priceXCD;
  const currentStock = tyre.stockCount;

  const numericPrice = parseFloat(priceVal);
  const numericStock = parseInt(stockVal, 10);

  const isPriceValid = !isNaN(numericPrice) && numericPrice > 0;
  const isStockValid = !isNaN(numericStock) && numericStock >= 0;

  const priceDiff = isPriceValid ? Number((numericPrice - currentPrice).toFixed(2)) : 0;
  const stockDiff = isStockValid ? numericStock - currentStock : 0;
  const hasChanges = (isPriceValid && priceDiff !== 0) || (isStockValid && stockDiff !== 0);

  const handlePriceDelta = (delta: number) => {
    const base = isPriceValid ? numericPrice : currentPrice;
    const next = Math.max(5, base + delta);
    setPriceVal(next.toString());
  };

  const handleStockDelta = (delta: number) => {
    const base = isStockValid ? numericStock : currentStock;
    const next = Math.max(0, base + delta);
    setStockVal(next.toString());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPriceValid || !isStockValid) return;

    onSave(tyre.id, numericPrice, numericStock);
    setFeedback('Adjustments applied successfully!');
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 450);
  };

  // Stock status pill calculation
  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'bg-rose-100 text-rose-700 border-rose-300' };
    if (qty <= 4) return { label: `Low Stock (${qty})`, color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: `In Stock (${qty})`, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const stockBadge = getStockStatus(isStockValid ? numericStock : currentStock);

  return (
    <div
      id="quick-adjust-dialog-backdrop"
      className="fixed inset-0 z-80 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quick-adjust-dialog-card"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Quick Adjust Item</h3>
              <p className="text-[11px] text-slate-400">Immediate price & inventory count update</p>
            </div>
          </div>
          <button
            id="quick-adjust-close-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tyre Header Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <img
            src={tyre.image}
            alt={tyre.modelName}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase text-[#0984E3] tracking-wider">
                {tyre.brand}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  tyre.condition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {tyre.condition}
              </span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-xs truncate">{tyre.modelName}</h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono mt-0.5">
              <span>{tyre.size}</span>
              <span>•</span>
              <span className="text-slate-500">{tyre.category}</span>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-4 py-2 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Adjustments Form */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-5">
          {/* Price Adjuster */}
          <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Retail Price (EC$)</span>
              </label>
              {priceDiff !== 0 && (
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    priceDiff > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {priceDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>
                    {priceDiff > 0 ? `+EC$ ${priceDiff}` : `-EC$ ${Math.abs(priceDiff)}`}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  EC$
                </span>
                <input
                  id="quick-adjust-price-input"
                  type="number"
                  step="1"
                  min="5"
                  value={priceVal}
                  onChange={(e) => setPriceVal(e.target.value)}
                  className="w-full pl-11 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-[#0984E3] focus:outline-hidden"
                  autoFocus
                />
              </div>

              {isPriceValid && (
                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  ≈ US$ {(numericPrice / 2.70).toFixed(2)}
                </span>
              )}
            </div>

            {/* Quick Price Steppers */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handlePriceDelta(-20)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                -20
              </button>
              <button
                type="button"
                onClick={() => handlePriceDelta(-10)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handlePriceDelta(10)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handlePriceDelta(20)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                +20
              </button>
            </div>
          </div>

          {/* Stock Count Adjuster */}
          <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Inventory Stock Units</span>
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stockBadge.color}`}>
                {stockBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStockDelta(-1)}
                disabled={isStockValid && numericStock <= 0}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                id="quick-adjust-stock-input"
                type="number"
                min="0"
                value={stockVal}
                onChange={(e) => setStockVal(e.target.value)}
                className="flex-1 text-center py-2 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-[#0984E3] focus:outline-hidden"
              />

              <button
                type="button"
                onClick={() => handleStockDelta(1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stock Steppers */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleStockDelta(-5)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setStockVal('0')}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Out (0)
              </button>
              <button
                type="button"
                onClick={() => handleStockDelta(5)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleStockDelta(10)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                +10
              </button>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="quick-adjust-save-btn"
              type="submit"
              disabled={!isPriceValid || !isStockValid || !hasChanges}
              className="px-4 py-2 rounded-xl bg-[#0984E3] hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Adjustments</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
