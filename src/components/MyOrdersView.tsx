import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Phone, 
  User, 
  Car, 
  MapPin, 
  Printer, 
  Download, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { Currency } from '../types';
import { jsPDF } from 'jspdf';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface MyOrdersViewProps {
  orders: AdminOrder[];
  currency: Currency;
  servicePrices: Record<string, number>;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  orders,
  currency,
  servicePrices,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrders, setSearchedOrders] = useState<AdminOrder[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchedOrders(null);
      setHasSearched(false);
      return;
    }

    const q = searchQuery.trim().toLowerCase();
    const filtered = orders.filter(ord => 
      ord.reservationCode.toLowerCase().includes(q) ||
      ord.customerPhone.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q)
    );
    setSearchedOrders(filtered);
    setHasSearched(true);
  };

  const handleExportPDF = (order: AdminOrder) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(9, 132, 227);
    doc.text("MAX EXECUTIVE TIRES - RESERVATION RECEIPT", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Maranatha Square, Pichelin, Dominica | Tel: (767) 275-8973", 14, 26);
    
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Reservation Code: ${order.reservationCode}`, 14, 40);
    doc.text(`Customer Name: ${order.customerName}`, 14, 46);
    doc.text(`Phone / WhatsApp: ${order.customerPhone}`, 14, 52);
    doc.text(`Vehicle Info: ${order.vehicleInfo || 'General Fitment'}`, 14, 58);
    doc.text(`Preferred Date: ${order.preferredDate || 'Today (Fast Lane)'}`, 14, 64);
    doc.text(`Payment Method: ${order.paymentMethod}`, 14, 70);
    doc.text(`Status: ${order.dispatchStatus || 'Pending Dispatch'}`, 14, 76);
    
    let y = 86;
    doc.setFontSize(12);
    doc.setTextColor(9, 132, 227);
    doc.text("Reserved Items & Services:", 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    order.items.forEach((item, idx) => {
      let itemSvc = 0;
      const svcs = [];
      if (item.includeMounting) { itemSvc += (servicePrices['mounting'] ?? 20) * item.quantity; svcs.push('Mounting'); }
      if (item.includeNewValves) { itemSvc += (servicePrices['valves'] ?? 15) * item.quantity; svcs.push('Valves'); }
      if (item.includeShredding) { itemSvc += (servicePrices['shredding'] ?? 1) * item.quantity; svcs.push('Shredder'); }

      const itemSubtotal = (item.tyre.priceXCD + (item.includeMounting ? 20 : 0) + (item.includeNewValves ? 15 : 0) + (item.includeShredding ? 1 : 0)) * item.quantity;

      doc.text(`${idx + 1}. ${item.quantity}x ${item.tyre.brand} ${item.tyre.modelName} (${item.tyre.size})`, 14, y);
      doc.text(`EC$ ${itemSubtotal}`, 170, y, { align: 'right' });
      y += 6;
      if (svcs.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`   Services: ${svcs.join(', ')}`, 18, y);
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        y += 6;
      }
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    y += 6;
    doc.setLineWidth(0.2);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(9, 132, 227);
    doc.text("Total Amount:", 14, y);
    doc.text(`EC$ ${order.totalXCD} ($${order.totalUSD.toFixed(2)} USD)`, 170, y, { align: 'right' });
    
    doc.save(`Reservation_${order.reservationCode}.pdf`);
  };

  const displayOrders = searchedOrders !== null ? searchedOrders : orders;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0984E3] to-[#076bc1] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10 pointer-events-none">
          <ShoppingBag className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Pichelin Workshop Reservation Tracker</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Track Your Tyre Reservations</h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Enter your <strong>Reservation Code</strong> (e.g. MTC-849201) or phone number below to check your fitting status, scheduled dates, and download official PDF receipts.
          </p>

          {/* Search Bar Form */}
          <form onSubmit={handleSearch} className="flex gap-2 pt-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Reservation Code (e.g. MTC-...) or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition shrink-0"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>

      {/* Orders List / Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>{hasSearched ? `Search Results (${displayOrders.length})` : `Recent Workshop Reservations (${orders.length})`}</span>
          </h3>
          {hasSearched && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchedOrders(null);
                setHasSearched(false);
              }}
              className="text-xs font-bold text-[#0984E3] hover:underline"
            >
              Clear Search & Show All
            </button>
          )}
        </div>

        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No Reservations Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasSearched 
                ? `No reservations match "${searchQuery}". Please verify your reservation code or phone number.`
                : 'You have not placed any reservations yet. Browse our inventory and reserve your tyres for fast-lane fitting in Pichelin!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => {
              const statusColor = order.dispatchStatus === 'Dispatched' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : order.dispatchStatus === 'Scheduled'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-amber-100 text-amber-800 border-amber-300';

              return (
                <div 
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-blue-50 text-[#0984E3] px-2.5 py-1 rounded-md border border-blue-200">
                          {order.reservationCode}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {order.dispatchStatus || 'Pending Dispatch'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Placed on {order.timestamp}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportPDF(order)}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>Download PDF Receipt</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer Details</span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle & Fitting Schedule</span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.vehicleInfo || 'General Vehicle'}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.preferredDate ? `Fitting: ${order.preferredDate}` : 'Fast Lane Priority'}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/60 space-y-1">
                      <span className="text-blue-600 text-[10px] uppercase font-bold block">Payment & Total</span>
                      <div className="font-bold text-slate-800">
                        {order.paymentMethod}
                      </div>
                      <div className="text-emerald-700 font-bold text-sm">
                        {currency === 'XCD' ? `EC$ ${order.totalXCD}` : `$${order.totalUSD.toFixed(2)} USD`}
                      </div>
                    </div>
                  </div>

                  {/* Reserved Items */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Reserved Tyres & Services ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {order.items.map((item, idx) => {
                        const svcs = [];
                        if (item.includeMounting) svcs.push('Mounting');
                        if (item.includeNewValves) svcs.push('Valves');
                        if (item.includeShredding) svcs.push('Eco-Shredder');

                        const itemTotal = (item.tyre.priceXCD + (item.includeMounting ? 20 : 0) + (item.includeNewValves ? 15 : 0) + (item.includeShredding ? 1 : 0)) * item.quantity;

                        return (
                          <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-slate-800">{item.quantity}x</span>
                              <div>
                                <span className="font-bold text-slate-900">{item.tyre.brand} {item.tyre.modelName}</span>
                                <span className="text-slate-500 ml-1.5">({item.tyre.size})</span>
                                {svcs.length > 0 && (
                                  <div className="text-[10px] text-blue-600 font-medium">
                                    Services: {svcs.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-800">
                              EC$ {itemTotal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#0984E3]" />
                      <span>{SHOP_LOCATION_INFO.name} • {SHOP_LOCATION_INFO.address}</span>
                    </div>
                    <span className="text-slate-400">Tel: {SHOP_LOCATION_INFO.phonePrimary}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
