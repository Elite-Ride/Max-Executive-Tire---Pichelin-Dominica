import React, { useMemo } from 'react';
import { Tyre } from '../types';
import { AdminOrder } from './AdminOrdersModal';
import { TrendingUp, AlertTriangle, Package, ShoppingCart, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';

interface AdminStockPredictionProps {
  orders: AdminOrder[];
  tyres: Tyre[];
  onRestockSelect?: (tyre: Tyre) => void;
}

export interface PredictionInsight {
  tyre: Tyre;
  recentOrdersCount: number;
  recentUnitsSold: number;
  currentStock: number;
  runoutDaysEstimate: number;
  urgency: 'critical' | 'high' | 'moderate' | 'stable';
  recommendedRestockQty: number;
  reason: string;
}

export const AdminStockPrediction: React.FC<AdminStockPredictionProps> = ({
  orders,
  tyres,
  onRestockSelect,
}) => {
  const insights: PredictionInsight[] = useMemo(() => {
    // 1. Calculate sales velocity per tyre ID from orders
    const tyreVelocityMap: Record<string, { ordersCount: number; unitsSold: number }> = {};

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const tyreId = item.tyre?.id;
        if (!tyreId) return;

        if (!tyreVelocityMap[tyreId]) {
          tyreVelocityMap[tyreId] = { ordersCount: 0, unitsSold: 0 };
        }
        tyreVelocityMap[tyreId].ordersCount += 1;
        tyreVelocityMap[tyreId].unitsSold += item.quantity || 1;
      });
    });

    // 2. Map predictions across inventory
    const list: PredictionInsight[] = tyres.map((tyre) => {
      const sales = tyreVelocityMap[tyre.id] || { ordersCount: 0, unitsSold: 0 };
      const currentStock = tyre.stockCount;
      // Approximate daily sales velocity assuming a 14-day sample window
      const estimatedDailyRate = Math.max(0.2, sales.unitsSold / 14);
      const runoutDaysEstimate = currentStock === 0 ? 0 : Math.round(currentStock / estimatedDailyRate);

      let urgency: 'critical' | 'high' | 'moderate' | 'stable' = 'stable';
      let reason = 'Stock levels are sufficient based on current demand.';
      let recommendedRestockQty = 4;

      if (currentStock === 0) {
        urgency = 'critical';
        reason = `Out of stock with ${sales.unitsSold} units requested in recent orders. Immediate maritime or air restock required.`;
        recommendedRestockQty = Math.max(8, sales.unitsSold * 2);
      } else if (currentStock <= 3 && sales.unitsSold >= 2) {
        urgency = 'critical';
        reason = `High velocity (${sales.unitsSold} units ordered) vs only ${currentStock} in stock. Will deplete in ~${runoutDaysEstimate} days!`;
        recommendedRestockQty = 8;
      } else if (currentStock <= 5) {
        urgency = 'high';
        reason = `Approaching minimum safety threshold for Dominica rough roads. Stock stands at ${currentStock} units.`;
        recommendedRestockQty = 6;
      } else if (sales.unitsSold >= 4) {
        urgency = 'moderate';
        reason = `Consistent seller in ${tyre.category}. Reorder advised before seasonal rains increase demand.`;
        recommendedRestockQty = 4;
      }

      return {
        tyre,
        recentOrdersCount: sales.ordersCount,
        recentUnitsSold: sales.unitsSold,
        currentStock,
        runoutDaysEstimate,
        urgency,
        recommendedRestockQty,
        reason,
      };
    });

    // Sort by urgency: critical first, then high, then moderate
    const urgencyWeight = { critical: 4, high: 3, moderate: 2, stable: 1 };
    return list.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);
  }, [orders, tyres]);

  const criticalItems = insights.filter((i) => i.urgency === 'critical');
  const highPriorityItems = insights.filter((i) => i.urgency === 'high');

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Predictive Stock Analytics & Demand Forecasting</span>
              <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-700/40">
                AI Demand Model
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Analyzes historical customer order velocity and sales turnover to predict which tyre models need restock before stockout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-red-950/80 text-red-300 border border-red-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            {criticalItems.length} Urgent Restocks
          </span>
          <span className="bg-amber-950/80 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-lg font-bold">
            {highPriorityItems.length} Watchlist
          </span>
        </div>
      </div>

      {/* Top 4 Priority Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {insights.slice(0, 6).map((insight) => {
          const { tyre, recentUnitsSold, currentStock, runoutDaysEstimate, urgency, recommendedRestockQty, reason } = insight;

          const badgeStyles = {
            critical: 'bg-red-950/90 text-red-300 border-red-700/80',
            high: 'bg-orange-950/90 text-orange-300 border-orange-700/80',
            moderate: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
            stable: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
          }[urgency];

          return (
            <div
              key={tyre.id}
              className={`rounded-xl p-3.5 border transition flex flex-col justify-between gap-2.5 ${
                urgency === 'critical'
                  ? 'bg-slate-950/90 border-red-900/70 hover:border-red-600'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={tyre.image}
                    alt={tyre.modelName}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                        {tyre.brand}
                      </span>
                      <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${badgeStyles}`}>
                        {urgency.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <strong className="text-white text-xs font-bold block">
                      {tyre.modelName} ({tyre.size})
                    </strong>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Category: {tyre.category}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stock</span>
                  <span className={`text-base font-black font-mono ${currentStock <= 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {currentStock} units
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {runoutDaysEstimate === 0 ? 'Depleted' : `~${runoutDaysEstimate} days left`}
                  </span>
                </div>
              </div>

              {/* Demand & Reason info */}
              <div className="bg-slate-900/90 rounded-lg p-2 text-xs border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Recent Demand: <strong>{recentUnitsSold} units ordered</strong>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Suggested PO: +{recommendedRestockQty} units
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{reason}</p>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px]">
                  Estimated Supplier Cost: <strong className="text-slate-200 font-mono">EC$ {Math.round(tyre.priceXCD * 0.65 * recommendedRestockQty)}</strong>
                </span>
                {onRestockSelect && (
                  <button
                    type="button"
                    onClick={() => onRestockSelect(tyre)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/80 px-2.5 py-1 rounded-lg border border-sky-800/60 transition"
                  >
                    <span>Add to PO Queue</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
