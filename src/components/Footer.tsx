import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  Wrench, 
  Truck, 
  Clock, 
  Heart
} from 'lucide-react';
import { SHOP_LOCATION_INFO, WORKSHOP_HOURS } from '../data/servicesData';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onOpenSOS: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenSOS }) => {
  return (
    <footer style={{ backgroundColor: '#23706e' }} className="text-slate-100 border-t border-emerald-900/40 w-full">
      <div 
        style={{ backgroundColor: '#23706e' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12"
      >
        
        {/* Main Footer Grid */}
        <div 
          style={{ backgroundColor: '#23706e' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => { setActiveTab('inventory'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <BrandLogo variant="navbar" showTagline={true} />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Southern Dominica’s premier centre for brand new and pressure-tested pre-owned tyres, pneumatic mounting, and 24/7 emergency roadside rescue.
            </p>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#E17055] shrink-0" />
                <span>Maranatha Square, Pichelin, Dominica</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Phone className="w-3.5 h-3.5 text-[#0984E3] shrink-0" />
                <span>{SHOP_LOCATION_INFO.phonePrimary}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3" style={{ paddingLeft: '26px' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Shop & Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => { setActiveTab('inventory'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-[#0984E3] transition"
                >
                  New & Used Tyre Inventory
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('services'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-[#0984E3] transition"
                >
                  Precision Tyre Fitting
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('services'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-[#0984E3] transition"
                >
                  Heavy Radial Puncture Patching
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('guide'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-[#0984E3] transition"
                >
                  Dominica Mountain Road Guide
                </button>
              </li>

            </ul>
          </div>

          {/* Col 3: Workshop Schedule */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Pichelin Workshop Hours
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex justify-between">
                <span>Mon – Fri:</span>
                <span className="text-white font-semibold">7:30 AM – 6:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday:</span>
                <span className="text-white font-semibold">7:30 AM – 5:30 PM</span>
              </li>
              <li className="flex justify-between text-[#0984E3] font-bold">
                <span>Sunday:</span>
                <span>Emergency On-Call</span>
              </li>
            </ul>
            <div className="pt-2">
              <button
                onClick={onOpenSOS}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Call SOS Roadside Rescue</span>
              </button>
            </div>
          </div>

          {/* Col 4: Community & Dominica Service Areas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Parish Service Coverage
            </h4>
            <p className="text-xs text-slate-400">
              Proudly servicing drivers, taxi associations, and agricultural fleets across:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {SHOP_LOCATION_INFO.serviceAreas.map((area, i) => (
                <span key={i} className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {area}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-teal-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-teal-100/70">
          <p>
            © {new Date().getFullYear()} Max Executive Tires. Maranatha Square, Pichelin, Commonwealth of Dominica. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span style={{ color: '#2d66b8' }}>Prices displayed in EC$ (XCD)</span>
            <span>•</span>
            <span className="text-amber-300 font-semibold">Nature Isle Motoring Excellence</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
