import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Disc, 
  ShieldAlert, 
  Truck, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  Navigation,
  MapPin,
  Compass,
  Printer,
  ShieldCheck,
  BookOpen,
  Leaf,
  Recycle,
  TreePine,
  ArrowRight
} from 'lucide-react';
import { Tyre } from '../types';
import { TYRE_SERVICES, SHOP_LOCATION_INFO } from '../data/servicesData';
import { PrintServiceMenuModal } from './PrintServiceMenuModal';
import { EcoTyreDisposalSection } from './EcoTyreDisposalSection';

interface ServicesSectionProps {
  onOpenSOS: () => void;
  servicePrices: Record<string, number>;
  tyres?: Tyre[];
  initialTab?: 'services' | 'disposal';
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenSOS,
  servicePrices,
  tyres = [],
  initialTab = 'services',
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [activeServicesTab, setActiveServicesTab] = useState<'services' | 'disposal'>('services');

  useEffect(() => {
    if (initialTab) {
      setActiveServicesTab(initialTab);
    }
  }, [initialTab]);

  const SHOP_LAT = 15.2345;
  const SHOP_LNG = -61.3521;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGetLocationDistance = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        const dist = calculateDistance(lat, lng, SHOP_LAT, SHOP_LNG);
        setDistanceKm(Math.round(dist * 10) / 10);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setGeoError(`Unable to retrieve your location: ${error.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return <Wrench className="w-6 h-6 text-[#0984E3]" />;
      case 'Disc': return <Disc className="w-6 h-6 text-[#0984E3]" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6 text-emerald-600" />;
      case 'Truck': return <Truck className="w-6 h-6 text-red-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-indigo-500" />;
      case 'Leaf': return <Leaf className="w-6 h-6 text-emerald-500" />;
      default: return <Wrench className="w-6 h-6 text-[#0984E3]" />;
    }
  };

  return (
    <section id="services-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-[#0984E3]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#0984E3]/20 border border-[#0984E3]/40 text-[#0984E3] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            <span>Maranatha Square Workshop • Pichelin, Dominica</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Professional Tyre Services & Island Maintenance
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Equipped with heavy-duty pneumatic changers, permanent radial vulcanizing gear, and our community mechanical tyre shredder. Engineered for Dominica's rugged mountain terrain and environmental sustainability.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Clock className="w-4 h-4 text-[#0984E3]" />
                <span>Mon-Sat: 7:30 AM – 6:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Walk-Ins Welcome at Pichelin</span>
              </div>
            </div>

            {/* Print Service Menu Button in Header */}
            <button
              id="btn-print-service-menu"
              type="button"
              onClick={() => setIsPrintMenuOpen(true)}
              className="inline-flex items-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md hover:shadow-lg active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Service Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveServicesTab('services')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeServicesTab === 'services'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4 text-[#0984E3]" />
            <span>Workshop Services ({TYRE_SERVICES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveServicesTab('disposal')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeServicesTab === 'disposal'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span>Eco-Friendly Tyre Disposal (Pichelin)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsPrintMenuOpen(true)}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 transition shadow-xs"
        >
          <Printer className="w-4 h-4 text-[#0984E3]" />
          <span>Print Friendly Pricing Sheet</span>
        </button>
      </div>

      {/* TAB CONTENT 1: WORKSHOP SERVICES GRID */}
      {activeServicesTab === 'services' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TYRE_SERVICES.map((service, index) => {
          const isRoadside = service.id === 'srv-roadside';
          const isShredder = service.id === 'srv-shredder';
          return (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              className={`bg-white rounded-2xl p-6 sm:p-8 border shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group ${
                isRoadside 
                  ? 'border-red-200 bg-gradient-to-br from-white to-red-50/30 lg:col-span-2' 
                  : isShredder
                    ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20'
                    : 'border-slate-200'
              }`}
            >
              {service.badge && (
                <div className="absolute top-0 right-0">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider ${
                    isRoadside 
                      ? 'bg-red-600 text-white' 
                      : isShredder
                        ? 'bg-emerald-700 text-white'
                        : service.isPopular 
                          ? 'bg-[#0984E3] text-white' 
                          : 'bg-slate-100 text-slate-700'
                  }`}>
                    {service.badge}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isRoadside 
                      ? 'bg-red-100 text-red-600' 
                      : isShredder
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-50 text-[#0984E3]'
                  }`}>
                    {getServiceIcon(service.iconName)}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {service.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0984E3] transition">
                      {service.name}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {service.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Service Inclusions:
                  </span>
                  <ul className="space-y-1.5">
                    {service.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Workshop Fee</span>
                  <span className="text-xl font-bold text-slate-900">
                    EC$ {servicePrices[service.id] ?? service.priceXCD}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ({service.durationMinutes} mins approx)
                  </span>
                </div>

                {isRoadside ? (
                  <button
                    type="button"
                    onClick={onOpenSOS}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs transition transform active:scale-95 animate-pulse"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch SOS Mobile Unit</span>
                  </button>
                ) : isShredder ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveServicesTab('disposal');
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    <span>Eco Guide & Calculator</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    Available Walk-in
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spotlight Feature Banner: Eco-Friendly Tyre Disposal & Green Shredding in Pichelin */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 border border-emerald-800/40 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nature Isle Zero-Landfill Initiative • Pichelin, Dominica</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Eco-Friendly Tyre Disposal & Mechanical Shredder Station
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Discarded tyres in tropical Dominica collect stagnant rainwater within 48 hours, creating prime breeding reservoirs for Dengue and Zika mosquitoes, while posing catastrophic ravine fire hazards. At Maranatha Square in Pichelin, our commercial mechanical shredder transforms scrap rubber into clean civil retaining aggregate and agricultural mulch.
            </p>
            <div className="flex flex-wrap gap-4 text-xs pt-1 text-slate-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Mosquito Vector Elimination</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Open Burning or River Leaching</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Soil Retaining Mulch & French Drain Aggregate</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveServicesTab('disposal');
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-md"
            >
              <Recycle className="w-4 h-4 text-slate-950" />
              <span>Explore Pichelin Disposal Process</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation Distance Calculator Widget */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0984E3] text-white rounded-xl shadow-xs">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#0984E3] uppercase tracking-wider block">GPS Shop Distance Calculator</span>
              <h3 className="text-lg font-bold text-slate-900">How far are you from Maranatha Square, Pichelin?</h3>
            </div>
          </div>
          <button
            onClick={handleGetLocationDistance}
            disabled={locating}
            className="bg-[#0984E3] hover:bg-[#0873c4] disabled:bg-slate-400 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting GPS...' : '📍 Calculate Distance from My Location'}</span>
          </button>
        </div>

        {geoError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-medium">
            ⚠️ {geoError}
          </div>
        )}

        {distanceKm !== null && (
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Straight-Line Distance</span>
                <strong className="text-slate-900 text-base">{distanceKm} km</strong> <span className="text-slate-500">({(distanceKm * 0.621371).toFixed(1)} miles)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#0984E3] rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Est. Mountain Drive Time</span>
                <strong className="text-slate-900 text-base">~{Math.max(5, Math.round(distanceKm * 2.5))} mins</strong> <span className="text-slate-500">(at 30 km/h island avg)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Service Status</span>
                <strong className="text-emerald-700 font-bold">Fast-Lane Ready</strong> <span className="text-slate-500">at Pichelin Shop</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shop Location Callout */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">Visit Our Maranatha Square Workshop</h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            {SHOP_LOCATION_INFO.landmarks}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <a
            href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition"
          >
            <span>Call Shop: {SHOP_LOCATION_INFO.phonePrimary}</span>
          </a>
        </div>
      </div>
    </div>
  )}

      {/* TAB CONTENT 2: ECO-FRIENDLY TYRE DISPOSAL & RECYCLING IN PICHELIN */}
      {activeServicesTab === 'disposal' && (
        <div className="space-y-8 animate-fade-in">
          <EcoTyreDisposalSection onOpenSOS={onOpenSOS} />
        </div>
      )}

      {/* Printer-Friendly Service & Tyre Price Menu Modal */}
      <PrintServiceMenuModal
        isOpen={isPrintMenuOpen}
        onClose={() => setIsPrintMenuOpen(false)}
        tyres={tyres}
        servicePrices={servicePrices}
      />
    </section>
  );
};
