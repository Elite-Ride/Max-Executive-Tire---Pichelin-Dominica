import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Compass, 
  CheckCircle2, 
  Car, 
  Truck,
  Printer,
  Wrench,
  ShieldCheck,
  Leaf
} from 'lucide-react';
import { SHOP_LOCATION_INFO, WORKSHOP_HOURS } from '../data/servicesData';
import { GoogleMapsStoreLocator } from './GoogleMapsStoreLocator';
import { PrintServiceMenuModal } from './PrintServiceMenuModal';

interface LocationSectionProps {
  onNavigateToServices?: (tab?: 'services' | 'disposal') => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ onNavigateToServices }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const travelTimes = [
    { from: 'Grand Bay (Berricoa)', time: '5 - 7 mins', dist: '3.8 km' },
    { from: 'Bellevue Chopin', time: '6 - 8 mins', dist: '4.2 km' },
    { from: 'Roseau (Capital)', time: '18 - 22 mins', dist: '13.5 km' },
    { from: 'Soufrière / Scotts Head', time: '12 - 15 mins', dist: '8.1 km' },
    { from: 'Petite Savanne / Bagatelle', time: '14 - 18 mins', dist: '9.4 km' },
  ];

  return (
    <section id="location-section" className="space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0984E3] border border-blue-200/60 text-xs font-bold uppercase px-3 py-1 rounded-md">
          <MapPin className="w-3.5 h-3.5" />
          Location & Workshop Bays
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#2D3436] tracking-tight">
          Visit Us at Maranatha Square, Pichelin
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Direct roadside drive-in access along the Grand Bay-Roseau link road with spacious bays for passenger cars, SUVs, minibuses, and 4x4s.
        </p>
      </div>

      {/* Google Maps Platform Interactive Store Locator */}
      <GoogleMapsStoreLocator />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Location Card & Landmarks */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0984E3] uppercase tracking-wider">
                Parish of Saint Patrick, Commonwealth of Dominica
              </span>
              <h3 className="text-2xl font-bold text-[#2D3436]">
                {SHOP_LOCATION_INFO.name}
              </h3>
              <p className="text-slate-700 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E17055] shrink-0" />
                <span>{SHOP_LOCATION_INFO.address}, {SHOP_LOCATION_INFO.parish}</span>
              </p>
            </div>

            {/* Landmark Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
              <strong className="text-slate-900 block flex items-center gap-1.5 font-bold">
                <Compass className="w-4 h-4 text-[#0984E3]" />
                Landmark & Driving Directions:
              </strong>
              <p className="leading-relaxed">
                {SHOP_LOCATION_INFO.landmarks}
              </p>
            </div>

            {/* Travel Times Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Approximate Driving Times to Maranatha Square:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {travelTimes.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="text-slate-500 block truncate font-medium">{item.from}</span>
                    <span className="font-bold text-slate-900 block mt-0.5">{item.time}</span>
                    <span className="text-[10px] text-[#0984E3] block">({item.dist})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Contact & Quick Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
              <a
                href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition shadow-xs"
              >
                <Phone className="w-4 h-4" />
                Call {SHOP_LOCATION_INFO.phonePrimary}
              </a>

              <a
                href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Maranatha%20Tyre%20Centre,%20I%20am%20heading%20to%20your%20shop%20in%20Pichelin`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Directions
              </a>
            </div>
          </div>
        </div>

        {/* Right: Opening Hours & Service Coverage Areas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
            <div className="space-y-1">
              <span className="text-[#0984E3] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Workshop Schedule
              </span>
              <h3 className="text-xl font-bold text-white">
                Opening Hours
              </h3>
            </div>

            {/* Hours List */}
            <div className="space-y-2 text-xs">
              {WORKSHOP_HOURS.map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    item.status === 'On-Call'
                      ? 'bg-slate-950/80 border-blue-500/40 text-blue-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-semibold text-white">{item.day}</span>
                  <span>{item.hours}</span>
                </div>
              ))}
            </div>

            {/* Service Coverage Radius */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3] block">
                Mobile Roadside Rescue Coverage:
              </span>
              <ul className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
                {SHOP_LOCATION_INFO.serviceAreas.map((area, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-[#0984E3]" />
                <span>Print Service & Tyre Menu</span>
              </button>

              {onNavigateToServices && (
                <button
                  type="button"
                  onClick={() => onNavigateToServices('disposal')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs py-2.5 rounded-xl border border-emerald-500/30 transition"
                >
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Eco Tyre Disposal & Shredder (Pichelin)</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Printer-Friendly Service & Tyre Price Menu Modal */}
      <PrintServiceMenuModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </section>
  );
};
