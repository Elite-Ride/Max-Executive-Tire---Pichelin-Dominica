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
  Gauge
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface HeroProps {
  onSearchClick: () => void;
  onBookServiceClick: () => void;
  onSOSClick: () => void;
  onAdvisorClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSearchClick,
  onBookServiceClick,
  onSOSClick,
  onAdvisorClick,
}) => {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
      {/* Background radial highlight & subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(9,132,227,0.18),transparent)] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8 sm:pt-8 sm:pb-12 relative z-10">
        
        {/* Top Badge & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800/80">
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white font-bold">Max Executive Tires Inc.</span>
            <span className="text-amber-400 italic font-serif hidden md:inline">"Where quality meets the road!"</span>
            <span className="text-slate-500">•</span>
            <MapPin className="w-3.5 h-3.5 text-[#E17055]" />
            <span>Maranatha Square, Pichelin</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline">Drive-In Bays Open: Mon–Sat 7:30 AM – 6:00 PM</span>
            <span className="bg-blue-950 text-blue-300 border border-blue-800/60 font-bold px-2.5 py-0.5 rounded-full">
              Dominica Island Fitment
            </span>
          </div>
        </div>

        {/* Main 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Heading & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="space-y-3">
              <span className="text-[#0984E3] font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0984E3]" />
                Dominica's Trusted Tyre & Wheel Care Specialist
              </span>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.15]">
                Engineered for <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200">
                  Dominica Mountain Terrain
                </span>
              </h1>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              From steep rainforest climbs up Pichelin Hill to coastal highways down to Grand Bay and Roseau — equip your vehicle with brand new and pressure-tested pre-owned tyres with precision digital balancing and pneumatic mounting.
            </p>

            {/* Executive Highlights Bento Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="text-[#0984E3] font-black text-lg">EC$ 95+</div>
                <div className="text-xs font-bold text-white mt-0.5">Tested Used Tyres</div>
                <div className="text-[11px] text-slate-400 mt-1">80%+ tread, 0 leaks, 60-day shop warranty</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="text-emerald-400 font-black text-lg">Top Brands</div>
                <div className="text-xs font-bold text-white mt-0.5">Brand New Stock</div>
                <div className="text-[11px] text-slate-400 mt-1">Bridgestone, Michelin, Goodyear, Maxxis</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="text-[#E17055] font-black text-lg">Full Bay</div>
                <div className="text-xs font-bold text-white mt-0.5">Mounting & Balancing</div>
                <div className="text-[11px] text-slate-400 mt-1">Pneumatic fitting, valve stems & repairs</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                id="hero-find-tyres-btn"
                onClick={onSearchClick}
                className="inline-flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition transform active:scale-95"
              >
                <Search className="w-5 h-5" />
                <span>Search Tyre Inventory</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                id="hero-book-service-btn"
                onClick={onBookServiceClick}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base px-5 py-3.5 rounded-xl border border-slate-700 transition"
              >
                <Wrench className="w-5 h-5 text-[#0984E3]" />
                <span>Workshop Services</span>
              </button>

              <button
                id="hero-ai-advisor-btn"
                onClick={onAdvisorClick}
                className="inline-flex items-center justify-center gap-2 bg-slate-900/70 hover:bg-slate-800 text-slate-300 font-semibold text-sm px-4 py-3.5 rounded-xl border border-slate-800 transition"
              >
                <Sparkles className="w-4 h-4 text-[#E17055]" />
                <span>AI Tyre Advisor</span>
              </button>
            </div>

          </div>

          {/* Right Column: Live Inventory & Workshop Status Box */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pichelin Workshop</div>
                  <h3 className="text-lg font-extrabold text-white">Live Inventory & Bay Status</h3>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Bays
                </span>
              </div>

              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-[#0984E3]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">4x4 & SUV Heavy Duty (16"-18")</div>
                      <div className="text-[11px] text-slate-400">Hilux, RAV4, Prado, Jimny, Grand Vitara</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                    In Stock
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Car className="w-4 h-4 text-[#0984E3]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Passenger Sedan & Hatchback (13"-16")</div>
                      <div className="text-[11px] text-slate-400">Vitz, Fit, Corolla, Premio, Axio, Tiida</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                    In Stock
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Commercial Taxi & Minibus (8-Ply C)</div>
                      <div className="text-[11px] text-slate-400">Noah, Voxy, HiAce 195/75R16C & 195R15C</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                    In Stock
                  </span>
                </div>
              </div>

              {/* Emergency Roadside SOS Bar inside card */}
              <div className="bg-red-950/50 border border-red-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-200">Need Roadside Tyre Rescue?</div>
                    <div className="text-[10px] text-slate-400">Grand Bay, Pichelin & Soufriere dispatch</div>
                  </div>
                </div>
                <button
                  id="hero-sos-quick-btn"
                  onClick={onSOSClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded-lg shrink-0 transition"
                >
                  Request SOS
                </button>
              </div>

              <div className="pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 mt-3">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E17055]" />
                  <span>Maranatha Square, Pichelin</span>
                </span>
                <a 
                  href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
                  className="text-[#0984E3] hover:underline font-bold"
                >
                  {SHOP_LOCATION_INFO.phonePrimary}
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
