import React from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  PhoneCall, 
  MapPin, 
  RotateCw, 
  Search, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2,
  Car,
  Truck,
  Layers,
  Flame,
  ArrowRight,
  Shield,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { triggerSOSHaptic } from '../utils/haptics';

interface HeroProps {
  onSearchClick: () => void;
  onBookServiceClick: () => void;
  onSOSClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSearchClick,
  onBookServiceClick,
  onSOSClick,
}) => {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
      {/* Background radial highlight & subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(9,132,227,0.18),transparent)] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-16 relative z-10"
      >
        {/* Main Hero Container */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Conquer Every <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200">
                Dominica Peak with Absolute Grip
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            From steep rainforest climbs up Pichelin Hill to coastal highways down to Grand Bay and Roseau — equip your vehicle with brand new and pressure-tested pre-owned tyres with pneumatic mounting.
          </p>

          {/* Executive Highlights Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-left">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition">
              <div className="text-[#0984E3] font-black text-lg">EC$ 125 – 160</div>
              <div className="text-xs font-bold text-white mt-0.5">Tested Used Tyres</div>
              <div className="text-[11px] text-slate-400 mt-1">Starting from $125 to $160 • 80%+ tread, certified</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition">
              <div className="text-emerald-400 font-black text-lg">Top Brands</div>
              <div className="text-xs font-bold text-white mt-0.5">Brand New Stock</div>
              <div className="text-[11px] text-slate-400 mt-1">Bridgestone, Michelin, Goodyear, Maxxis</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition">
              <div className="text-[#E17055] font-black text-lg">Full Bay</div>
              <div className="text-xs font-bold text-white mt-0.5">Pneumatic Mounting</div>
              <div className="text-[11px] text-slate-400 mt-1">Pneumatic fitting, valve stems & repairs</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              id="hero-find-tyres-btn"
              onClick={onSearchClick}
              className="inline-flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-sm sm:text-base px-7 py-4 rounded-xl shadow-lg shadow-blue-500/20 transition transform active:scale-95 cursor-pointer"
            >
              <Search className="w-5 h-5" />
              <span>Search Tyre Inventory</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              id="hero-book-service-btn"
              onClick={onBookServiceClick}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base px-6 py-4 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <Wrench className="w-5 h-5 text-[#0984E3]" />
              <span>Workshop Services</span>
            </button>

            <button
              id="hero-sos-btn"
              onClick={() => {
                triggerSOSHaptic();
                onSOSClick();
              }}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base px-6 py-4 rounded-xl shadow-lg shadow-red-600/20 transition transform active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>Roadside SOS Rescue</span>
            </button>
          </div>

          {/* High-Quality Professional Photographs Showcase: Pichelin Scenery & Tyre Workshop Bay */}
          <div className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Pichelin Scenery Banner */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl transition-all duration-300 hover:border-slate-700">
                <div className="aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src="/src/assets/images/pichelin_scenery_hero_1791186990903.jpg"
                    alt="Scenic Pichelin Dominica mountain peaks and rainforest road to Maranatha Square"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold tracking-wider uppercase border border-blue-500/30 mb-1">
                      <MapPin className="w-3 h-3 text-[#0984E3]" />
                      <span>Pichelin Valley Route</span>
                    </span>
                    <h3 className="text-white font-extrabold text-sm sm:text-base drop-shadow-md">
                      Built for Dominica&apos;s Mountain Slopes
                    </h3>
                    <p className="text-slate-300 text-[11px] font-medium leading-tight">
                      Maranatha Square gateway between Roseau and Grand Bay
                    </p>
                  </div>
                </div>
              </div>

              {/* Tyre Workshop Environment Banner */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl transition-all duration-300 hover:border-slate-700">
                <div className="aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src="/src/assets/images/workshop_bay_hero_1791187000502.jpg"
                    alt="Max Executive Tires workshop bay with computer balancing and pneumatic mounting tools in Pichelin"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30 mb-1">
                      <Wrench className="w-3 h-3 text-emerald-400" />
                      <span>Professional Fitting Bay</span>
                    </span>
                    <h3 className="text-white font-extrabold text-sm sm:text-base drop-shadow-md">
                      Full-Service Tyre Workshop
                    </h3>
                    <p className="text-slate-300 text-[11px] font-medium leading-tight">
                      Computerized wheel balancing, pneumatic mounting & pressure testing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
