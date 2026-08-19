import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Wrench, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Car, 
  Calendar, 
  MapPin, 
  ShieldCheck
} from 'lucide-react';
import { CartItem, Currency } from '../types';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleService: (id: string, serviceKey: 'mounting' | 'balancing' | 'valves') => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onToggleService,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reservationCode, setReservationCode] = useState('');

  // Calculate totals
  const calculateItemSubtotalXCD = (item: CartItem) => {
    let unitServices = 0;
    if (item.includeMounting) unitServices += 20;
    if (item.includeBalancing) unitServices += 25;
    if (item.includeNewValves) unitServices += 15;
    return (item.tyre.priceXCD + unitServices) * item.quantity;
  };

  const totalCartXCD = cartItems.reduce((sum, item) => sum + calculateItemSubtotalXCD(item), 0);
  const totalCartUSD = totalCartXCD / 2.70;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!customerName || !customerPhone) {
      alert('Please enter your name and phone number for the reservation.');
      return;
    }

    const code = 'MTC-' + Math.floor(100000 + Math.random() * 900000);
    setReservationCode(code);
    setIsSubmitted(true);
  };

  const getWhatsAppReservationUrl = () => {
    let text = `🚗 *TYRE RESERVATION & WORKSHOP BOOKING* 🚗\n` +
      `*Reservation Code:* ${reservationCode}\n` +
      `*Name:* ${customerName}\n` +
      `*Phone:* ${customerPhone}\n` +
      `*Vehicle:* ${vehicleInfo || 'General'}\n` +
      `*Date:* ${preferredDate || 'Today (Fast Lane)'}\n\n` +
      `*RESERVED TYRES:*\n`;

    cartItems.forEach((item, index) => {
      const services = [];
      if (item.includeMounting) services.push('Mounting');
      if (item.includeBalancing) services.push('Balancing');
      if (item.includeNewValves) services.push('Valves');

      text += `${index + 1}. ${item.quantity}x ${item.tyre.brand} ${item.tyre.modelName} (${item.tyre.size}) [${item.tyre.condition === 'new' ? 'New' : 'Used'}]\n` +
        `   Services: ${services.length > 0 ? services.join(', ') : 'Tyre Only'}\n` +
        `   Subtotal: EC$ ${calculateItemSubtotalXCD(item)}\n`;
    });

    text += `\n*ESTIMATED TOTAL:* EC$ ${totalCartXCD} ($${totalCartUSD.toFixed(2)} USD)\n` +
      `*Shop Location:* Maranatha Square, Pichelin, Dominica\n` +
      `Please reserve my stock for fitting!`;

    return `https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div 
        id="cart-reservation-drawer-box"
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0984E3] text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D3436] leading-none">
                Reserved Tyres & Fitting
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Maranatha Square Workshop • Pichelin, Dominica
              </p>
            </div>
          </div>

          <button
            id="close-cart-drawer-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-[#2D3436]">
                Reservation Ready!
              </h4>
              <p className="text-xs sm:text-sm text-slate-700">
                Your reservation reference code is <span className="font-mono font-bold text-[#0984E3] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{reservationCode}</span>.
                Your tyres will be set aside in our Pichelin shop. Pay upon fitting or pickup!
              </p>

              <div className="p-3.5 bg-white rounded-lg border border-emerald-200 text-xs text-slate-600">
                <div className="font-bold text-slate-800">Estimated Total:</div>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  {currency === 'XCD' ? `EC$ ${totalCartXCD}` : `$${totalCartUSD.toFixed(2)} USD`}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={getWhatsAppReservationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-xs transition text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send to WhatsApp for Fast Lane Fitting
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClearCart();
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="w-full text-xs font-bold text-slate-600 hover:text-slate-900 py-2"
                >
                  Done / Close Reservation
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Your reservation is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Browse our brand new or inspected used tyres in Pichelin and click "Reserve Fitting".
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#0984E3] text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-[#0873c4] transition shadow-xs"
              >
                Browse Tyres Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Item List */}
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const isNew = item.tyre.condition === 'new';
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3"
                    >
                      {/* Top Item Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isNew ? 'bg-blue-50 text-[#0984E3] border border-blue-200' : 'bg-slate-900 text-slate-100'
                          }`}>
                            {isNew ? '✨ Brand New' : '🔍 Tested Used'}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">
                            {item.tyre.brand} {item.tyre.modelName}
                          </h4>
                          <span className="text-xs font-mono font-bold text-slate-600 block">
                            {item.tyre.size}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Remove tyre"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Workshop Services Checkboxes */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Workshop Services (per tyre):
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeMounting}
                              onChange={() => onToggleService(item.id, 'mounting')}
                              className="rounded text-[#0984E3] w-3.5 h-3.5"
                            />
                            <span>Mount (+EC$20)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeBalancing}
                              onChange={() => onToggleService(item.id, 'balancing')}
                              className="rounded text-[#0984E3] w-3.5 h-3.5"
                            />
                            <span>Balance (+EC$25)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeNewValves}
                              onChange={() => onToggleService(item.id, 'valves')}
                              className="rounded text-[#0984E3] w-3.5 h-3.5"
                            />
                            <span>Valve (+EC$15)</span>
                          </label>
                        </div>
                      </div>

                      {/* Quantity & Subtotal */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center bg-white rounded-md border border-slate-300 p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            {currency === 'XCD' 
                              ? `EC$ ${calculateItemSubtotalXCD(item)}` 
                              : `$${(calculateItemSubtotalXCD(item) / 2.70).toFixed(2)} USD`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Contact Form */}
              <form id="drawer-reserve-form" onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Pickup & Fitting Information:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Johnathan Bell"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. (767) 275-8973"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Model / Plate</label>
                    <input
                      type="text"
                      placeholder="e.g. Hilux Vigo / TD 3491"
                      value={vehicleInfo}
                      onChange={(e) => setVehicleInfo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Fitting Date</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0984E3] shrink-0" />
                  <span>No upfront payment required! Pay upon fitting or inspection in Pichelin.</span>
                </div>

                <button
                  type="submit"
                  id="drawer-confirm-btn"
                  className="w-full bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-sm py-3 px-4 rounded-lg shadow-xs transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Reservation (EC$ {totalCartXCD})</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Drawer Footer summary if not submitted */}
        {!isSubmitted && cartItems.length > 0 && (
          <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Total Items: {cartItems.reduce((s, i) => s + i.quantity, 0)} tyres</span>
              <span className="text-base font-bold text-[#0984E3]">
                {currency === 'XCD' ? `EC$ ${totalCartXCD}` : `$${totalCartUSD.toFixed(2)} USD`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Maranatha Square, Pichelin
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
