import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Mountain, 
  Wrench, 
  Disc, 
  CircleDot, 
  ShoppingBag, 
  MessageSquare, 
  MapPin, 
  Info,
  Layers,
  Gauge,
  Bell
} from 'lucide-react';
import { Tyre } from '../types';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { getRepresentativeVehicleForTyre } from '../data/tyresData';

interface TireDetailModalProps {
  tyre: Tyre | null;
  onClose: () => void;
  servicePrices: Record<string, number>;
  onAddToCartWithServices: (
    tyre: Tyre, 
    qty: number, 
    includeMounting: boolean, 
    includeValves: boolean,
    includeShredding: boolean
  ) => void;
}

export const TireDetailModal: React.FC<TireDetailModalProps> = ({
  tyre,
  onClose,
  servicePrices,
  onAddToCartWithServices,
}) => {
  if (!tyre) return null;

  const [quantity, setQuantity] = useState(2);
  const [includeMounting, setIncludeMounting] = useState(true);
  const [includeValves, setIncludeValves] = useState(true);
  const [includeShredding, setIncludeShredding] = useState(true);
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail && !notifyPhone) return;
    const existing = JSON.parse(localStorage.getItem('max_executive_price_alerts') || '[]');
    existing.push({
      tyreId: tyre.id,
      tyreName: `${tyre.brand} ${tyre.modelName} (${tyre.size})`,
      email: notifyEmail,
      phone: notifyPhone,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('max_executive_price_alerts', JSON.stringify(existing));
    setNotifySubmitted(true);
  };

  const mountingCostXCD = servicePrices['mounting'] ?? 20;
  const valveCostXCD = servicePrices['valves'] ?? 15;
  const shreddingCostXCD = servicePrices['shredding'] ?? 1;

  const unitServiceCostXCD = 
    (includeMounting ? mountingCostXCD : 0) +
    (includeValves ? valveCostXCD : 0) +
    (includeShredding ? shreddingCostXCD : 0);

  const totalCostXCD = (tyre.priceXCD + unitServiceCostXCD) * quantity;

  const handleAdd = () => {
    onAddToCartWithServices(
      tyre, 
      quantity, 
      includeMounting, 
      includeValves,
      includeShredding
    );
    onClose();
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Max Executive Tires! I am interested in reserving ${quantity}x ${tyre.brand} ${tyre.modelName} (${tyre.size}) [${tyre.condition === 'new' ? 'New' : 'Used'}] at Maranatha Square, Pichelin. Please confirm availability.`
  );

  const repPreset = getRepresentativeVehicleForTyre(tyre);
  const repVehicle = {
    vehicleName: repPreset.name,
    photo: repPreset.photo || tyre.image,
    caption: `Size ${tyre.size} is the recommended fitment for ${repPreset.name} navigating Dominica's mountain grades and roads.`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        id="tyre-detail-modal-box"
        className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-xl border border-slate-200 my-8 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header with Close */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md ${
              tyre.condition === 'new' 
                ? 'bg-blue-50 text-[#0984E3] border border-blue-200/80' 
                : 'bg-slate-900 text-white'
            }`}>
              {tyre.condition === 'new' ? '✨ Brand New' : `🔍 Tested Used Tyre`}
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Maranatha Square Stock ID: {tyre.id}
            </span>
          </div>

          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Title & Image Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 h-56 rounded-xl overflow-hidden relative bg-slate-950">
              <img
                src={tyre.image}
                alt={`${tyre.brand} ${tyre.modelName}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-2xl font-bold font-mono">{tyre.size}</div>
                <div className="text-xs text-slate-300 font-semibold">{tyre.brand} • {tyre.modelName}</div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tyre.category}</div>
              <h3 className="text-2xl font-bold text-[#2D3436] leading-tight">
                {tyre.brand} {tyre.modelName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {tyre.shortDescription}
              </p>

              {/* Price Display */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Unit Tyre Price:</span>
                  <span className="text-2xl font-black text-[#2D3436]">
                    EC$ {tyre.priceXCD}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifyForm(!showNotifyForm)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0984E3] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notify Me (Price Drop & Restock)</span>
                </button>
              </div>

              {showNotifyForm && (
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>🔔 Set Price & Restock Alert for {tyre.brand} {tyre.size}</span>
                    <button 
                      type="button" 
                      onClick={() => setShowNotifyForm(false)} 
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {notifySubmitted ? (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
                      ✓ Success! You will receive instant notifications when this tyre goes on sale or is restocked at Maranatha Square.
                    </div>
                  ) : (
                    <form onSubmit={handleNotifySubmit} className="space-y-2">
                      <p className="text-slate-600">Get notified instantly via email or WhatsApp SMS when price drops or new shipment arrives.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                        />
                        <input
                          type="text"
                          placeholder="WhatsApp / Phone (e.g. 767...)"
                          value={notifyPhone}
                          onChange={(e) => setNotifyPhone(e.target.value)}
                          className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="submit"
                          className="bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold px-4 py-2 rounded-lg transition"
                        >
                          Enable Alert
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Representative Vehicle Representation Photo Card */}
          <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-md border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
              <div className="sm:col-span-5 h-44 sm:h-full relative bg-slate-950">
                <img
                  src={repVehicle.photo}
                  alt={repVehicle.vehicleName}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
                  <span>🚗</span>
                  <span>Representative Vehicle Fitment</span>
                </div>
              </div>
              <div className="sm:col-span-7 p-5 space-y-2">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                  Tyre Size Description: {tyre.size}
                </span>
                <h4 className="text-lg font-bold text-white">
                  {repVehicle.vehicleName}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {repVehicle.caption}
                </p>
              </div>
            </div>
          </div>

            {/* Inspection Checklist */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pressure tank tested at 55 PSI</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero sidewall bulges or cuts</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bead seating edge clean & sealed</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{tyre.warranty}</span>
                </div>
              </div>
            </div>

          {/* Technical Specs & Dominica Suitability */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-100/70 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Speed Rating</span>
              <span className="font-bold text-slate-800">{tyre.speedRating}</span>
            </div>
            <div className="bg-slate-100/70 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Load Index</span>
              <span className="font-bold text-slate-800">{tyre.loadIndex}</span>
            </div>
            <div className="bg-slate-100/70 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Wet Grip</span>
              <span className="font-bold text-emerald-700">Class {tyre.wetGripRating} (Rain Master)</span>
            </div>
            <div className="bg-slate-100/70 p-3 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pothole Shield</span>
              <span className="font-bold text-slate-800 truncate block">{tyre.potholeResistance}</span>
            </div>
          </div>

          {/* Key Engineering Features */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Key Road Performance Features:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {tyre.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0984E3] mt-1.5 shrink-0"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Workshop Service Add-on Options */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h4 className="text-sm font-bold text-[#2D3436] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#0984E3]" />
              <span>Add Pichelin Workshop Services (Optional)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                includeMounting ? 'bg-blue-50 border-blue-200 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={includeMounting}
                  onChange={(e) => setIncludeMounting(e.target.checked)}
                  className="rounded text-[#0984E3] focus:ring-[#0984E3] w-4 h-4 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="font-bold">Mounting & Fitting</div>
                  <div className="text-[11px] text-slate-500 font-normal">+EC$ 20/tyre</div>
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    Professional rim mounting, bead sealing, and high-speed precision computer dynamic balancing.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                includeValves ? 'bg-blue-50 border-blue-200 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={includeValves}
                  onChange={(e) => setIncludeValves(e.target.checked)}
                  className="rounded text-[#0984E3] focus:ring-[#0984E3] w-4 h-4 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="font-bold">New Valve Stem</div>
                  <div className="text-[11px] text-slate-500 font-normal">+EC$ 15/tyre</div>
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    Brand-new high-pressure brass/rubber valve stem installation to prevent slow air leaks.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                includeShredding ? 'bg-emerald-50 border-emerald-200 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={includeShredding}
                  onChange={(e) => setIncludeShredding(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-800">Eco Tyre Shredder</div>
                  <div className="text-[11px] text-slate-500 font-normal">+EC$ 1/tyre (Green)</div>
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    Eco-friendly old tyre disposal fee supporting Dominica safe waste recycling and shredding.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer / Reservation Bar */}
        <div className="p-5 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {/* Quantity Selector */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <span className="text-xs text-slate-400 px-2 font-medium">Qty:</span>
              {[1, 2, 4].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    quantity === q 
                      ? 'bg-[#0984E3] text-white shadow-xs' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Total Price */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated Total:</div>
              <div className="text-xl sm:text-2xl font-black text-white">
                EC$ {totalCostXCD.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* WhatsApp Direct */}
            <a
              href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-5 h-5" />
            </a>

            {/* Add to Cart Button */}
            <button
              type="button"
              id="confirm-modal-reserve-btn"
              onClick={handleAdd}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-sm px-6 py-3 rounded-lg shadow-xs transition transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Reserve & Book Fitting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
