import React, { useEffect } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  Car, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CartItem } from '../types';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

export interface PrintableOrderData {
  id?: string;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleInfo?: string;
  preferredDate?: string;
  timestamp?: string;
  paymentMethod: string;
  paymentStatus?: string;
  dispatchStatus?: string;
  items: CartItem[];
  totalXCD: number;
}

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PrintableOrderData | null;
  servicePrices: Record<string, number>;
  autoPrint?: boolean;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  servicePrices,
  autoPrint = false,
}) => {
  useEffect(() => {
    if (isOpen && autoPrint && order) {
      const timer = setTimeout(() => {
        handleTriggerPrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, order]);

  // Handle adding/removing body print class
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('is-receipt-modal-open');
    } else {
      document.body.classList.remove('is-receipt-modal-open');
    }
    return () => {
      document.body.classList.remove('is-receipt-modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const calculateItemSubtotalXCD = (item: CartItem) => {
    let unitServices = 0;
    if (item.includeMounting) unitServices += (servicePrices['mounting'] ?? 20);
    if (item.includeNewValves) unitServices += (servicePrices['valves'] ?? 15);
    if (item.includeShredding) unitServices += (servicePrices['shredding'] ?? 1);
    return (item.tyre.priceXCD + unitServices) * item.quantity;
  };

  const tyresSubtotalXCD = order.items.reduce((acc, item) => acc + (item.tyre.priceXCD * item.quantity), 0);
  const servicesSubtotalXCD = order.items.reduce((acc, item) => {
    let s = 0;
    if (item.includeMounting) s += (servicePrices['mounting'] ?? 20) * item.quantity;
    if (item.includeNewValves) s += (servicePrices['valves'] ?? 15) * item.quantity;
    if (item.includeShredding) s += (servicePrices['shredding'] ?? 1) * item.quantity;
    return acc + s;
  }, 0);

  const grandTotalXCD = order.totalXCD || (tyresSubtotalXCD + servicesSubtotalXCD);
  const approxUSD = (grandTotalXCD / 2.70).toFixed(2);
  const issueDate = order.timestamp || new Date().toLocaleString();

  const handleTriggerPrint = () => {
    document.body.classList.add('is-printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('is-printing-receipt');
    }, 1000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(9, 132, 227);
    doc.text("MAX EXECUTIVE TIRES & SERVICES", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Maranatha Square, Pichelin, Dominica | Tel: +1 767 616 0155", 14, 26);
    doc.text("Official Workshop Sales & Service Invoice", 14, 31);

    doc.setLineWidth(0.5);
    doc.line(14, 34, 196, 34);

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Receipt Reference: ${order.reservationCode}`, 14, 42);
    doc.text(`Date & Time: ${issueDate}`, 14, 48);
    doc.text(`Customer Name: ${order.customerName || 'Valued Customer'}`, 14, 54);
    doc.text(`Phone / WhatsApp: ${order.customerPhone || 'N/A'}`, 14, 60);
    doc.text(`Vehicle Info: ${order.vehicleInfo || 'Standard Vehicle'}`, 14, 66);
    doc.text(`Scheduled Fitting: ${order.preferredDate || 'Fast Lane Priority'}`, 14, 72);
    doc.text(`Payment Method: ${order.paymentMethod}`, 14, 78);
    doc.text(`Dispatch / Fitting Status: ${order.dispatchStatus || 'Pending Dispatch'}`, 14, 84);

    let y = 94;
    doc.setFontSize(11);
    doc.setTextColor(9, 132, 227);
    doc.text("Itemized Tyres & Workshop Services:", 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);

    order.items.forEach((item, idx) => {
      const svcs: string[] = [];
      if (item.includeMounting) svcs.push('Mounting');
      if (item.includeNewValves) svcs.push('Valves');
      if (item.includeShredding) svcs.push('Eco-Shredder');

      const itemTotal = calculateItemSubtotalXCD(item);
      doc.text(`${idx + 1}. ${item.quantity}x ${item.tyre.brand} ${item.tyre.modelName} (${item.tyre.size}) [${item.tyre.condition.toUpperCase()}]`, 14, y);
      doc.text(`EC$ ${itemTotal}`, 170, y, { align: 'right' });
      y += 5;

      if (svcs.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`   Included Services: ${svcs.join(', ')}`, 18, y);
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        y += 5;
      }

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    y += 6;
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Tyres Subtotal:`, 14, y);
    doc.text(`EC$ ${tyresSubtotalXCD}`, 170, y, { align: 'right' });
    y += 6;

    doc.text(`Workshop Services Subtotal:`, 14, y);
    doc.text(`EC$ ${servicesSubtotalXCD}`, 170, y, { align: 'right' });
    y += 7;

    doc.setFontSize(12);
    doc.setTextColor(9, 132, 227);
    doc.text(`Total Payable:`, 14, y);
    doc.text(`EC$ ${grandTotalXCD} (approx US$ ${approxUSD})`, 170, y, { align: 'right' });

    doc.save(`Receipt_${order.reservationCode}.pdf`);
  };

  return (
    <div 
      id="receipt-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      {/* Container holding action controls (screen-only) and the clean printable receipt sheet */}
      <div className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* On-screen Modal Header Action Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0984E3] text-white flex items-center justify-center font-bold shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Official Receipt Preview
              </h3>
              <p className="text-[11px] text-slate-400">
                Maranatha Square Workshop • Ready to Print
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition transform hover:scale-105"
              title="Open browser print dialog for paper receipt"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition"
              title="Download as PDF file"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              aria-label="Close receipt preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body (Targeted for printer layout) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
          
          {/* THE PRINTABLE RECEIPT SHEET */}
          <div 
            id="printable-receipt-sheet"
            className="printable-receipt-sheet bg-white p-6 sm:p-10 rounded-xl border border-slate-200 text-slate-900 shadow-sm max-w-2xl mx-auto font-sans"
          >
            {/* Header Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                      MAX EXECUTIVE TIRES
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">
                    {SHOP_LOCATION_INFO.address}
                  </div>
                  <div className="text-xs text-slate-600">
                    {SHOP_LOCATION_INFO.parish}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Hotline: <strong>{SHOP_LOCATION_INFO.phonePrimary}</strong> • WhatsApp: {SHOP_LOCATION_INFO.whatsapp}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded">
                    Official Workshop Receipt
                  </span>
                  <div className="font-mono text-base font-extrabold text-[#0984E3] mt-1.5">
                    {order.reservationCode}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Issued: {issueDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer, Vehicle & Appointment Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 avoid-break">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Customer & Contact
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {order.customerName || 'Valued Customer'}
                </div>
                <div className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{order.customerPhone || 'N/A'}</span>
                </div>
                {order.customerEmail && (
                  <div className="text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{order.customerEmail}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Vehicle & Workshop Schedule
                </span>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{order.vehicleInfo || 'General Vehicle Fitment'}</span>
                </div>
                <div className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Date: {order.preferredDate || 'Fast Lane Priority (Today)'}</span>
                </div>
                <div className="text-slate-600 mt-0.5">
                  Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus || 'Pending at Workshop'})
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="mb-6 avoid-break">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1.5 mb-2">
                Purchased Tyres & Workshop Services
              </h4>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                    <th className="py-2 px-2 text-left font-bold">Item / Tyre Model</th>
                    <th className="py-2 px-2 text-center font-bold">Type</th>
                    <th className="py-2 px-2 text-center font-bold">Qty</th>
                    <th className="py-2 px-2 text-right font-bold">Unit (XCD)</th>
                    <th className="py-2 px-2 text-right font-bold">Total (XCD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.items.map((item, idx) => {
                    const services: string[] = [];
                    if (item.includeMounting) services.push(`Wheel Mounting (+EC$${servicePrices['mounting'] ?? 20})`);
                    if (item.includeNewValves) services.push(`New Rubber Valve (+EC$${servicePrices['valves'] ?? 15})`);
                    if (item.includeShredding) services.push(`Eco Tyre Shredding (+EC$${servicePrices['shredding'] ?? 1})`);

                    const itemTotal = calculateItemSubtotalXCD(item);

                    return (
                      <tr key={idx} className="align-top">
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-900">
                            {item.tyre.brand} {item.tyre.modelName}
                          </div>
                          <div className="text-slate-600 font-mono text-[11px]">
                            Size: {item.tyre.size}
                          </div>
                          {services.length > 0 && (
                            <div className="mt-1 text-[10px] text-blue-700 font-medium bg-blue-50/80 px-2 py-0.5 rounded inline-block">
                              Includes: {services.join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold uppercase text-[10px]">
                          <span className={item.tyre.condition === 'new' ? 'text-emerald-700' : 'text-slate-700'}>
                            {item.tyre.condition}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                          EC$ {item.tyre.priceXCD}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                          EC$ {itemTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="border-t-2 border-slate-900 pt-3 mb-6 avoid-break">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-xs text-slate-600 max-w-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dominica Road Guarantee & Quality Assurance</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    All tyres are inspected for bead seal integrity and optimal tread depth before drive-away. 
                    Complimentary wheel nut re-torque check available after 50 miles of driving.
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Tyres Subtotal:</span>
                    <span className="font-mono font-semibold">EC$ {tyresSubtotalXCD}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Workshop Services:</span>
                    <span className="font-mono font-semibold">EC$ {servicesSubtotalXCD}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>VAT / Environmental Duty:</span>
                    <span className="font-mono font-semibold">Included</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-black text-slate-900">
                    <span className="text-sm uppercase">Total Amount:</span>
                    <span className="text-base font-mono text-[#0984E3]">EC$ {grandTotalXCD}</span>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    Approx. US$ {approxUSD} (EC$ 2.70 = $1 USD)
                  </div>
                </div>
              </div>
            </div>

            {/* Signature, Stamp & Workshop Verification Footer */}
            <div className="border-t border-slate-200 pt-6 mt-6 avoid-break">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Award className="w-4 h-4 text-[#0984E3]" />
                    <span>Maranatha Square Fitting Workshop</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Maranatha Square, Main Highway, Pichelin, Dominica.<br />
                    Mon–Fri: 7:30 AM – 6:00 PM • Sat: 7:30 AM – 5:30 PM
                  </p>
                  <div className="font-mono text-[9px] text-slate-400 pt-1">
                    System Record ID: {order.id || order.reservationCode}
                  </div>
                </div>

                <div className="space-y-6 text-right">
                  <div className="inline-block w-48 border-b-2 border-slate-800 pb-1">
                    <span className="text-transparent select-none text-[10px]">authorized_signature</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Workshop Manager / Certified Technician
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Action Bar (Screen only) */}
        <div className="no-print bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Pichelin Workshop Verified.</span>
            <span>Click Print Receipt to print via your browser or printer.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
            >
              Close
            </button>
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
