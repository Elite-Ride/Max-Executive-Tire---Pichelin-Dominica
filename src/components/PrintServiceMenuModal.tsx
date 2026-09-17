import React from 'react';
import { 
  Printer, 
  X, 
  Wrench, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Car,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { TYRE_SERVICES, SHOP_LOCATION_INFO, WORKSHOP_HOURS } from '../data/servicesData';
import { Tyre } from '../types';

interface PrintServiceMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tyres?: Tyre[];
  servicePrices?: Record<string, number>;
}

export const PrintServiceMenuModal: React.FC<PrintServiceMenuModalProps> = ({
  isOpen,
  onClose,
  tyres = [],
  servicePrices = {},
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Group popular tyres by category for a concise pricing menu
  const tyreCategories = [
    {
      title: 'Passenger & Small Hatchbacks (12" – 14")',
      description: 'Toyota Vitz, Yaris, Swift, Alto, Fit',
      sizes: [
        { size: '155/70 R12', newPrice: 85, usedPrice: 45 },
        { size: '175/65 R13', newPrice: 95, usedPrice: 50 },
        { size: '175/70 R13', newPrice: 100, usedPrice: 55 },
        { size: '175/65 R14', newPrice: 110, usedPrice: 60 },
        { size: '185/65 R14', newPrice: 115, usedPrice: 65 },
      ]
    },
    {
      title: 'Sedans & Crossovers (15" – 16")',
      description: 'Corolla, Civic, Sylphy, Crosstrek, HR-V',
      sizes: [
        { size: '195/65 R15', newPrice: 125, usedPrice: 70 },
        { size: '205/65 R15', newPrice: 135, usedPrice: 75 },
        { size: '205/55 R16', newPrice: 145, usedPrice: 80 },
        { size: '215/60 R16', newPrice: 160, usedPrice: 90 },
      ]
    },
    {
      title: 'SUVs & 4x4 Off-Road (16" – 18")',
      description: 'RAV4, CR-V, Hilux, D-Max, Land Cruiser, Prado',
      sizes: [
        { size: '225/65 R17', newPrice: 195, usedPrice: 110 },
        { size: '265/70 R16', newPrice: 245, usedPrice: 135 },
        { size: '265/65 R17', newPrice: 260, usedPrice: 140 },
        { size: '265/70 R17 (A/T)', newPrice: 285, usedPrice: 150 },
        { size: '265/60 R18', newPrice: 320, usedPrice: 165 },
      ]
    },
    {
      title: 'Commercial Minibuses & Cargo Vans',
      description: 'Toyota HiAce Commuter, Nissan Caravan, TownAce',
      sizes: [
        { size: '195/80 R15C (8-Ply)', newPrice: 155, usedPrice: 85 },
        { size: '195 R14C (8-Ply)', newPrice: 140, usedPrice: 80 },
        { size: '185 R14C', newPrice: 130, usedPrice: 75 },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* On-Screen Action Bar (Hidden during actual print) */}
        <div className="sticky top-0 bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between z-20 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0984E3] rounded-lg text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Printer-Friendly Service & Price Menu</h3>
              <p className="text-[11px] text-slate-300">Format optimized for standard 8.5" x 11" paper (Letter / A4)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Service Menu</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div id="printable-service-menu" className="p-6 sm:p-10 text-slate-900 font-sans print:p-8 space-y-6">
          
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#0984E3]">
                Workshop Service & Retail Rates
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                MAX EXECUTIVE TIRES & FITMENT WORKSHOP
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Maranatha Square, Main Highway, Pichelin, Dominica
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#0984E3]" />
                  +1 (767) 616-0155
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 text-xs text-slate-600">
              <div className="font-bold text-slate-900">Valid As Of: {currentDate}</div>
              <div>Currency: Eastern Caribbean Dollar (EC$)</div>
            </div>
          </div>

          {/* Business Hours & Emergency Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <strong className="block text-slate-900 font-bold">Workshop Bays:</strong>
              <span className="text-slate-600">Mon – Sat: 7:30 AM – 6:00 PM</span>
            </div>
            <div>
              <strong className="block text-slate-900 font-bold">Roadside Mobile Rescue:</strong>
              <span className="text-slate-600">Daily Rapid Dispatch (SOS Hotline)</span>
            </div>
            <div>
              <strong className="block text-slate-900 font-bold">Quality Standard:</strong>
              <span className="text-slate-600">BSAU159 Radial Vulcanization</span>
            </div>
          </div>

          {/* SECTION 1: WORKSHOP LABOUR & TYRE SERVICES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0984E3]" />
                1. Workshop Services & Labour Rates
              </h2>
              <span className="text-xs text-slate-500 font-medium">Per Wheel / Service Rate</span>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-2.5 border-r border-slate-200">Service Description</th>
                  <th className="p-2.5 border-r border-slate-200 hidden sm:table-cell">Key Inclusions</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">Duration</th>
                  <th className="p-2.5 text-right">Workshop Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {TYRE_SERVICES.map((srv) => {
                  const price = servicePrices[srv.id] ?? srv.priceXCD;
                  return (
                    <tr key={srv.id} className="hover:bg-slate-50">
                      <td className="p-2.5 border-r border-slate-200 align-top">
                        <div className="font-bold text-slate-900">{srv.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{srv.description}</div>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] text-slate-600 align-top hidden sm:table-cell">
                        <ul className="list-disc list-inside space-y-0.5">
                          {srv.inclusions.slice(0, 2).map((inc, i) => (
                            <li key={i}>{inc}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-center align-top whitespace-nowrap text-slate-600">
                        {srv.durationMinutes} mins
                      </td>
                      <td className="p-2.5 text-right align-top whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">EC$ {price}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SECTION 2: POPULAR TYRE SIZES & ESTIMATED PRICING */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#0984E3]" />
                2. Popular Tyre Sizing & Pricing Schedule
              </h2>
              <span className="text-xs text-slate-500 font-medium">Stock Subject to Daily Availability</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tyreCategories.map((cat, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                  <div className="border-b border-slate-100 pb-1">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">{cat.title}</h3>
                    <p className="text-[10px] text-slate-500">{cat.description}</p>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase tracking-wider text-left border-b border-slate-100">
                        <th className="pb-1">Size Spec</th>
                        <th className="pb-1 text-right">Brand New</th>
                        <th className="pb-1 text-right">Inspected Used</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cat.sizes.map((s, sIdx) => (
                        <tr key={sIdx} className="py-1">
                          <td className="py-1 font-mono font-bold text-slate-800">{s.size}</td>
                          <td className="py-1 text-right font-semibold text-slate-900">
                            EC$ {s.newPrice}
                          </td>
                          <td className="py-1 text-right text-emerald-700 font-semibold">
                            EC$ {s.usedPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: WORKSHOP GUARANTEES & SAFETY POLICY */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs text-slate-700">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Max Executive Tires Quality Guarantee & Safety Policy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div>
                <strong className="block text-slate-900">1. Certified BSAU159 Puncture Repairs:</strong>
                All punctures are repaired from the inside using permanent mushroom vulcanizing patches. We never perform risky exterior-only string plugs that compromise casing integrity.
              </div>
              <div>
                <strong className="block text-slate-900">2. Free Balancing & Valve Check:</strong>
                Complimentary rim lip corrosion cleaning, high-speed computerized wheel balancing calibration, and valve pressure tests included with new tyre purchases.
              </div>
              <div>
                <strong className="block text-slate-900">3. Factory Warranty Coverage:</strong>
                Brand new tyres come with a 12-month manufacturer defect warranty. Inspected used tyres carry a 30-day structural casing guarantee.
              </div>
              <div>
                <strong className="block text-slate-900">4. Eco-Green Recycling Commitment:</strong>
                Old scrap tyres can be shredded on-site via our industrial mechanical shredder, preventing landfill accumulation and mosquito breeding in Dominica.
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500 space-y-1">
            <p>
              Max Executive Tires Inc. • Maranatha Square, Main Highway, Pichelin, Dominica • WhatsApp / Direct: +1 (767) 616-0155
            </p>
            <p className="italic">
              Prices subject to change without prior notice based on international shipping and rubber commodity indices. Printed on {currentDate}.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
