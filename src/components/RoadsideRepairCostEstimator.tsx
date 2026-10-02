import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  MapPin, 
  Wrench, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneCall, 
  MessageSquare, 
  ShieldCheck, 
  DollarSign, 
  ArrowRight,
  HelpCircle,
  Car,
  Zap,
  Info
} from 'lucide-react';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

export type PunctureComplexity = 'simple' | 'radial_cut' | 'bead_valve' | 'blowout_mount';

interface ComplexityOption {
  id: PunctureComplexity;
  title: string;
  badge: string;
  badgeColor: string;
  basePriceXCD: number;
  description: string;
  included: string[];
  recommendedFor: string;
}

const COMPLEXITY_TIERS: ComplexityOption[] = [
  {
    id: 'simple',
    title: 'Standard Tread Nail or Screw',
    badge: 'Fast Plug & Patch',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    basePriceXCD: 35,
    description: 'Clean puncture in center tread caused by nails, wire, or sheet metal screws.',
    included: ['High-tensile vulcanizing plug', 'Tire bead pressure reseal', 'Valve inspection'],
    recommendedFor: 'Tire is intact and leak is recent'
  },
  {
    id: 'radial_cut',
    title: 'Deep Cut / Large Puncture',
    badge: 'Heavy Radial Patch',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    basePriceXCD: 55,
    description: 'Punctures over 5mm, sharp basalt rock cuts, or twin nail penetrations.',
    included: ['Internal radial cord patch', 'Chemical vulcanizing fluid', 'Puncture reaming & sealing'],
    recommendedFor: 'Rough mountain roads & deep stone penetrations'
  },
  {
    id: 'bead_valve',
    title: 'Rim Bead Leak or Torn Valve',
    badge: 'Rim & Valve Overhaul',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    basePriceXCD: 65,
    description: 'Air leaking between alloy rim edge and tire bead, or snapped rubber valve stem.',
    included: ['Bead cleaning & rust prep', 'Industrial liquid rubber bead sealer', 'New heavy-duty brass valve stem (TR413)'],
    recommendedFor: 'Tire goes flat overnight or rim lip struck pothole'
  },
  {
    id: 'blowout_mount',
    title: 'Sidewall Rupture / Emergency Spare Mount',
    badge: 'Full Roadside Rescue',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    basePriceXCD: 60,
    description: 'Sidewall blowouts cannot safely be plugged; we jack vehicle, swap spare rim, & secure lugs.',
    included: ['3-Ton hydraulic mobile jacking', 'Impact lug removal & torque to spec', 'Spare inflation & safety check'],
    recommendedFor: 'Sidewall tears, shattered rims, or total deflation'
  }
];

const DOMINICA_LOCATION_PRESETS = [
  { name: 'Pichelin / Mitchum', km: 1.5, notes: 'Free Mobile Dispatch Radius' },
  { name: 'Bellevue Chopin', km: 5.5, notes: '5-8 mins dispatch' },
  { name: 'Grand Bay (Berekua)', km: 7.0, notes: '8-12 mins dispatch' },
  { name: 'Soufriere / Scotts Head', km: 11.5, notes: '15-20 mins dispatch' },
  { name: 'Roseau / Bath Estate', km: 13.5, notes: '18-25 mins dispatch' },
  { name: 'Canefield / Massacre', km: 18.0, notes: '25-30 mins dispatch' },
  { name: 'Portsmouth / Cabrits', km: 46.0, notes: 'Island cross-dispatch' },
];

interface RoadsideRepairCostEstimatorProps {
  detectedGpsDistanceKm?: number | null;
  onOpenSOS: () => void;
}

export const RoadsideRepairCostEstimator: React.FC<RoadsideRepairCostEstimatorProps> = ({
  detectedGpsDistanceKm,
  onOpenSOS
}) => {
  const [distanceKm, setDistanceKm] = useState<number>(() => {
    return detectedGpsDistanceKm && detectedGpsDistanceKm > 0 ? Math.min(60, detectedGpsDistanceKm) : 6.5;
  });
  const [complexity, setComplexity] = useState<PunctureComplexity>('simple');
  const [vehicleClass, setVehicleClass] = useState<'sedan' | 'suv_4x4' | 'commercial'>('sedan');
  const [timeOfDay, setTimeOfDay] = useState<'standard' | 'night'>('standard');
  const [isCopied, setIsCopied] = useState(false);

  // Sync with detected GPS distance if user uses the GPS locator widget
  useEffect(() => {
    if (detectedGpsDistanceKm && detectedGpsDistanceKm > 0) {
      setDistanceKm(Math.min(60, Math.max(1, Math.round(detectedGpsDistanceKm * 10) / 10)));
    }
  }, [detectedGpsDistanceKm]);

  const selectedTier = COMPLEXITY_TIERS.find(t => t.id === complexity) || COMPLEXITY_TIERS[0];

  // Pricing formula tailored to Dominica's geography:
  // Base Puncture Fee
  const basePunctureFee = selectedTier.basePriceXCD;

  // Roadside mobile travel:
  // First 3 km from Maranatha Square, Pichelin is included in base emergency service!
  // Beyond 3 km: EC$ 2.50 per km (covering fuel & mountain transit wear on specialized rescue vehicle)
  const freeDistanceKm = 3.0;
  const billableKm = Math.max(0, distanceKm - freeDistanceKm);
  const mileageFee = Math.round(billableKm * 2.50);

  // Vehicle surcharge
  const vehicleSurcharge = vehicleClass === 'sedan' ? 0 : vehicleClass === 'suv_4x4' ? 15 : 25;

  // Time of day surcharge: Night/Emergency After-Hours (6 PM - 7 AM)
  const nightSurcharge = timeOfDay === 'night' ? 30 : 0;

  // Total
  const totalCostXCD = basePunctureFee + mileageFee + vehicleSurcharge + nightSurcharge;
  const totalCostUSD = (totalCostXCD / 2.70).toFixed(2);

  // Mountain drive ETA calculation (Dominica island average ~30 km/h on mountain turns + 10 mins dispatch prep)
  const estimatedArrivalMins = Math.max(10, Math.round(10 + distanceKm * 2.2));

  const formatWhatsAppMessage = () => {
    const text = `Hello Max Executive Tires! 🚗 I used your Roadside Repair Cost Estimator from Maranatha Square, Pichelin:
• Distance: ${distanceKm} km
• Puncture Type: ${selectedTier.title} (${selectedTier.badge})
• Vehicle Class: ${vehicleClass === 'sedan' ? 'Car / Hatchback' : vehicleClass === 'suv_4x4' ? '4x4 SUV / Pickup' : 'Commercial Van / Truck'}
• Time: ${timeOfDay === 'standard' ? 'Daytime (8am-6pm)' : 'Emergency After-Hours'}
• Estimated Total: EC$ ${totalCostXCD} (~US$ ${totalCostUSD})
• Est. Arrival Time: ~${estimatedArrivalMins} mins

Can a mobile roadside technician assist me? My location is:`;
    return `https://wa.me/17672855208?text=${encodeURIComponent(text)}`;
  };

  const handleCopyQuote = () => {
    const quoteText = `Max Executive Tires Roadside Repair Estimate:
Distance: ${distanceKm} km from Maranatha Square, Pichelin
Service: ${selectedTier.title} (EC$ ${basePunctureFee})
Mileage Fee (${distanceKm} km): EC$ ${mileageFee}
Vehicle Adj: EC$ ${vehicleSurcharge}
Timing Adj: EC$ ${nightSurcharge}
TOTAL ESTIMATED: EC$ ${totalCostXCD} (~US$ ${totalCostUSD})
ETA: ~${estimatedArrivalMins} mins
Call / WhatsApp: ${SHOP_LOCATION_INFO.phonePrimary}`;

    navigator.clipboard.writeText(quoteText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0984E3] to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0984E3] bg-[#0984E3]/10 px-2.5 py-0.5 rounded-full border border-[#0984E3]/20">
                Pichelin Mobile Dispatch
              </span>
              <span className="text-xs text-slate-400 font-medium">Maranatha Square HQ</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Roadside Repair & Puncture Cost Estimator
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Accurate, transparent quotes for on-site tire plugs, radial patches, and emergency rim servicing anywhere in Dominica.
            </p>
          </div>
        </div>

        {/* Call shop quick button */}
        <a
          href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition shrink-0 self-start md:self-center"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hotline: {SHOP_LOCATION_INFO.phonePrimary}</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTROLS & SELECTION */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Distance Selector */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0984E3]" />
                <span>1. Distance from Maranatha Square, Pichelin</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#0984E3]">{distanceKm} km</span>
                <span className="text-xs text-slate-400">({(distanceKm * 0.621371).toFixed(1)} miles)</span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0984E3]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>0.5 km (Pichelin Local)</span>
                <span>15 km (Roseau)</span>
                <span>30 km (Layou)</span>
                <span>50 km (Portsmouth)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 block">Quick Island Landmarks:</span>
              <div className="flex flex-wrap gap-1.5">
                {DOMINICA_LOCATION_PRESETS.map((preset) => {
                  const isSelected = Math.abs(distanceKm - preset.km) < 0.8;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setDistanceKm(preset.km)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition border cursor-pointer ${
                        isSelected
                          ? 'bg-[#0984E3] text-white border-[#0984E3] shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {preset.name} ({preset.km} km)
                    </button>
                  );
                })}
              </div>
            </div>

            {detectedGpsDistanceKm && detectedGpsDistanceKm > 0 && (
              <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-blue-300 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  Live GPS detected: <strong>{detectedGpsDistanceKm} km</strong> from shop
                </span>
                <button
                  type="button"
                  onClick={() => setDistanceKm(Math.round(detectedGpsDistanceKm * 10) / 10)}
                  className="text-xs font-bold text-[#0984E3] hover:underline"
                >
                  Apply GPS
                </button>
              </div>
            )}
          </div>

          {/* 2. Puncture Complexity Tier */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>2. Select Puncture or Damage Severity</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMPLEXITY_TIERS.map((tier) => {
                const isSelected = complexity === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setComplexity(tier.id)}
                    className={`text-left p-4 rounded-2xl transition border cursor-pointer relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-[#0984E3] ring-1 ring-[#0984E3] shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tier.badgeColor}`}>
                          {tier.badge}
                        </span>
                        <span className="text-sm font-black text-white">
                          EC$ {tier.basePriceXCD}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {tier.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {tier.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/70 text-[10px] text-slate-400 space-y-1">
                      {tier.included.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Vehicle & Service Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle Class */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-400" />
                <span>Vehicle Type</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setVehicleClass('sedan')}
                  className={`text-[11px] font-bold py-2 px-1 rounded-xl text-center border transition ${
                    vehicleClass === 'sedan'
                      ? 'bg-blue-600/20 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Car / Hatch
                  <span className="block text-[9px] text-slate-400 font-normal">Standard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleClass('suv_4x4')}
                  className={`text-[11px] font-bold py-2 px-1 rounded-xl text-center border transition ${
                    vehicleClass === 'suv_4x4'
                      ? 'bg-blue-600/20 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  SUV / 4x4
                  <span className="block text-[9px] text-amber-400 font-normal">+EC$ 15</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleClass('commercial')}
                  className={`text-[11px] font-bold py-2 px-1 rounded-xl text-center border transition ${
                    vehicleClass === 'commercial'
                      ? 'bg-blue-600/20 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Van / Truck
                  <span className="block text-[9px] text-amber-400 font-normal">+EC$ 25</span>
                </button>
              </div>
            </div>

            {/* Time of Day */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Service Time</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimeOfDay('standard')}
                  className={`text-[11px] font-bold py-2 px-2 rounded-xl text-center border transition ${
                    timeOfDay === 'standard'
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Regular (8am - 6pm)
                  <span className="block text-[9px] text-emerald-500/80 font-normal">Standard Rates</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimeOfDay('night')}
                  className={`text-[11px] font-bold py-2 px-2 rounded-xl text-center border transition ${
                    timeOfDay === 'night'
                      ? 'bg-rose-600/20 text-rose-400 border-rose-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Night / Emergency
                  <span className="block text-[9px] text-rose-400 font-normal">+EC$ 30 (6pm-7am)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ESTIMATE SUMMARY & ACTIONS */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Quote Breakdown
              </span>
              <h4 className="text-base font-bold text-white">Estimated Cost</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                EC$ {totalCostXCD}
              </span>
              <span className="text-xs text-slate-400 block">
                ≈ US$ {totalCostUSD}
              </span>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0984E3]"></span>
                <span>Base Service ({selectedTier.title})</span>
              </div>
              <strong className="text-white">EC$ {basePunctureFee}.00</strong>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Mobile Mileage ({distanceKm} km from Pichelin)</span>
              </div>
              <strong className="text-white">
                {mileageFee === 0 ? (
                  <span className="text-emerald-400 font-bold">FREE (within 3km)</span>
                ) : (
                  `EC$ ${mileageFee}.00`
                )}
              </strong>
            </div>

            {vehicleSurcharge > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Vehicle Heavy Duty Surcharge</span>
                </div>
                <strong className="text-white">EC$ {vehicleSurcharge}.00</strong>
              </div>
            )}

            {nightSurcharge > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Emergency Night Dispatch Fee</span>
                </div>
                <strong className="text-rose-400">EC$ {nightSurcharge}.00</strong>
              </div>
            )}

            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Estimated Total:</span>
              <span className="text-emerald-400 text-sm font-black">EC$ {totalCostXCD}.00</span>
            </div>
          </div>

          {/* Dispatch Details Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Est. Arrival: ~{estimatedArrivalMins} minutes</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mobile response vehicle departs directly from Maranatha Square, Pichelin. Equipped with compressed air, hydraulic jacks, vulcanizing patches, and torque wrenches.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onOpenSOS}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>🚨 Request Roadside Rescue Dispatch</span>
            </button>

            <a
              href={formatWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Estimate & Share Location</span>
            </a>

            <button
              type="button"
              onClick={handleCopyQuote}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Quote Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Itemized Quote Summary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
