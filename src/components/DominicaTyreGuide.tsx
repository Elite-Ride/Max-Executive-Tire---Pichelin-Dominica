import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Gauge, 
  Mountain, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Info,
  Car,
  CloudRain
} from 'lucide-react';

export const DominicaTyreGuide: React.FC = () => {
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<'sedan' | 'suv' | 'commercial'>('suv');
  const [loadWeight, setLoadWeight] = useState<'normal' | 'heavy'>('normal');

  // PSI calculation logic for Dominica island conditions
  const getRecommendedPSI = () => {
    if (selectedVehicleCategory === 'sedan') {
      return loadWeight === 'normal' ? '32 - 34 PSI' : '35 - 36 PSI (Loaded)';
    } else if (selectedVehicleCategory === 'suv') {
      return loadWeight === 'normal' ? '35 - 36 PSI' : '38 - 40 PSI (Loaded 4x4)';
    } else {
      return loadWeight === 'normal' ? '45 - 50 PSI' : '55 - 60 PSI (Commercial 8-Ply)';
    }
  };

  return (
    <div id="dominica-tyre-guide-section" className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0984E3] border border-blue-200/60 text-xs font-bold uppercase px-3 py-1 rounded-md">
          <BookOpen className="w-3.5 h-3.5" />
          Driver Knowledge & Safety
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#2D3436] tracking-tight">
          Dominica Road Tyre Guide & Safety Manual
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Dominica's volcanic topography, steep gradients, tight hairpin corners, and sudden tropical downpours demand specific tyre care.
        </p>
      </div>

      {/* 1. Interactive Sidewall Code Decoder */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 border border-slate-800 shadow-md space-y-6">
        <div className="space-y-1">
          <span className="text-[#0984E3] text-xs font-bold uppercase tracking-wider">
            Interactive Sidewall Decoder
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            How to Read Your Tyre Sidewall Code (e.g. 205 / 55 R16 91V)
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Before buying or booking fitting at Maranatha Square, check these numbers printed on your current tyre.
          </p>
        </div>

        {/* Visual Code Box */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-wrap items-center justify-center gap-3 text-center">
          <div className="bg-[#0984E3] text-white px-4 py-2.5 rounded-lg font-bold text-xl sm:text-2xl">
            205
            <span className="block text-[10px] font-medium uppercase tracking-wider text-blue-100">Width (mm)</span>
          </div>

          <span className="text-slate-600 text-2xl font-bold">/</span>

          <div className="bg-slate-800 text-blue-300 border border-slate-700 px-4 py-2.5 rounded-lg font-bold text-xl sm:text-2xl">
            55
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Aspect Ratio %</span>
          </div>

          <div className="bg-slate-800 text-white border border-slate-700 px-4 py-2.5 rounded-lg font-bold text-xl sm:text-2xl">
            R16
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Rim Diameter (")</span>
          </div>

          <div className="bg-slate-800 text-emerald-300 border border-slate-700 px-4 py-2.5 rounded-lg font-bold text-xl sm:text-2xl">
            91
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Load Index (615kg)</span>
          </div>

          <div className="bg-slate-800 text-sky-300 border border-slate-700 px-4 py-2.5 rounded-lg font-bold text-xl sm:text-2xl">
            V
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Speed (240km/h)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <strong className="text-[#0984E3] block mb-1">1. Section Width:</strong>
            The width of the tyre from sidewall to sidewall in millimeters. A wider tyre (e.g. 265mm) gives more mountain grip for 4x4s.
          </div>
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <strong className="text-[#0984E3] block mb-1">2. Profile / Aspect:</strong>
            The height of the sidewall as a percentage of the width. Higher profile (65-75%) protects alloy rims against Dominica potholes!
          </div>
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <strong className="text-[#0984E3] block mb-1">3. "C" or "XL" Marking:</strong>
            Commercial minibus tyres will have a "C" (e.g. 195/75R16C), meaning heavy 8-ply casing for continuous passenger carrying.
          </div>
        </div>
      </div>

      {/* 2. Dominica Island PSI Calculator */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[#0984E3] text-xs font-bold uppercase tracking-wider">
              Mountain PSI Advisor
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2D3436]">
              Dominica Island Tyre Pressure Guide
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Under-inflated tyres generate high heat on mountain climbs; over-inflated tyres lose wet braking traction on slippery asphalt.
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-center min-w-[200px]">
            <span className="text-[11px] font-bold text-[#0984E3] block uppercase tracking-wide">Recommended PSI:</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 block my-0.5">
              {getRecommendedPSI()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">Check cold in morning</span>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Vehicle Category:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedVehicleCategory('sedan')}
                className={`p-3 rounded-lg text-xs font-bold border transition ${
                  selectedVehicleCategory === 'sedan' ? 'bg-[#0984E3] text-white border-[#0984E3]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Sedan / Hatchback
              </button>
              <button
                type="button"
                onClick={() => setSelectedVehicleCategory('suv')}
                className={`p-3 rounded-lg text-xs font-bold border transition ${
                  selectedVehicleCategory === 'suv' ? 'bg-[#0984E3] text-white border-[#0984E3]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                SUV / 4x4 / Hilux
              </button>
              <button
                type="button"
                onClick={() => setSelectedVehicleCategory('commercial')}
                className={`p-3 rounded-lg text-xs font-bold border transition ${
                  selectedVehicleCategory === 'commercial' ? 'bg-[#0984E3] text-white border-[#0984E3]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Commercial / Bus
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Passenger & Cargo Load:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoadWeight('normal')}
                className={`p-3 rounded-lg text-xs font-bold border transition ${
                  loadWeight === 'normal' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Standard (1-2 Passengers)
              </button>
              <button
                type="button"
                onClick={() => setLoadWeight('heavy')}
                className={`p-3 rounded-lg text-xs font-bold border transition ${
                  loadWeight === 'heavy' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Full Load / Cargo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. New vs Tested Pre-Owned Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0984E3] border border-blue-200 text-xs font-bold px-3 py-1 rounded-md">
            ✨ Brand New Tyres
          </div>
          <h4 className="text-xl font-bold text-[#2D3436]">
            When to Choose Brand New Tyres
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ideal for commercial operators doing high-mileage daily routes (e.g. Roseau-Grand Bay-Soufriere), long-distance hauling, or drivers wanting complete factory warranty protection.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pt-2 font-medium">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% full original factory tread depth (8.5mm - 14.5mm)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full multi-year manufacturer warranty</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Maximum water channeling during heavy tropical downpours</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-2 bg-slate-800 text-[#0984E3] border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-md">
            🔍 Grade-A Inspected Used Tyres
          </div>
          <h4 className="text-xl font-bold text-white">
            Why Our Tested Pre-Owned Tyres are 100% Safe
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every used tyre at Max Executive Tires undergoes strict pneumatic tank testing up to 55-60 PSI. We only stock Grade-A tyres with 80%+ tread remaining and zero sidewall damage.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-2 font-medium">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0984E3] shrink-0" />
              <span>Save 50% to 65% compared to new tyre prices</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0984E3] shrink-0" />
              <span>Pressure immersion tank tested with 0 bead leaks</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0984E3] shrink-0" />
              <span>60 to 90-Day Max Executive Workshop Guarantee</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
