import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Check, 
  Copy, 
  FileText, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Car, 
  Award,
  Hash
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { jsPDF } from 'jspdf';

interface CustomerOrderInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
  servicePrices?: Record<string, number>;
}

export const CustomerOrderInvoiceModal: React.FC<CustomerOrderInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  servicePrices = { mounting: 20, valves: 15, shredding: 1 }
}) => {
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  // Calculate itemized breakdown
  const items = order.items || [];
  
  const tyresSubtotal = items.reduce((acc, it) => {
    const p = it.tyre?.priceXCD || 0;
    const q = it.quantity || 1;
    return acc + (p * q);
  }, 0);

  const servicesDetails: { name: string; qty: number; unitPrice: number; total: number }[] = [];
  
  let totalMountingQty = 0;
  let totalValvesQty = 0;
  let totalShreddingQty = 0;

  items.forEach(it => {
    const q = it.quantity || 1;
    if (it.includeMounting) totalMountingQty += q;
    if (it.includeNewValves) totalValvesQty += q;
    if (it.includeShredding) totalShreddingQty += q;
  });

  const mountingUnit = servicePrices['mounting'] ?? 20;
  const valvesUnit = servicePrices['valves'] ?? 15;
  const shreddingUnit = servicePrices['shredding'] ?? 1;

  if (totalMountingQty > 0) {
    servicesDetails.push({
      name: 'Pneumatic Bead Mounting & Computer Spin Balancing',
      qty: totalMountingQty,
      unitPrice: mountingUnit,
      total: totalMountingQty * mountingUnit
    });
  }

  if (totalValvesQty > 0) {
    servicesDetails.push({
      name: 'High-Pressure Solid Rubber Valve Stems',
      qty: totalValvesQty,
      unitPrice: valvesUnit,
      total: totalValvesQty * valvesUnit
    });
  }

  if (totalShreddingQty > 0) {
    servicesDetails.push({
      name: 'Eco-Friendly Tyre Disposal & Shredding Surcharge',
      qty: totalShreddingQty,
      unitPrice: shreddingUnit,
      total: totalShreddingQty * shreddingUnit
    });
  }

  const servicesSubtotal = servicesDetails.reduce((acc, s) => acc + s.total, 0);
  const calculatedGrandTotal = tyresSubtotal + servicesSubtotal;
  const finalTotalXCD = order.totalXCD || calculatedGrandTotal;
  
  // Dominica VAT calculation (15% inclusive or extracted for tax compliance)
  // Standard Dominica Inland Revenue VAT rate is 15%
  const vatRate = 0.15;
  const netBeforeTax = Number((finalTotalXCD / (1 + vatRate)).toFixed(2));
  const vatAmount = Number((finalTotalXCD - netBeforeTax).toFixed(2));
  const usdEquivalent = (finalTotalXCD / 2.70).toFixed(2);

  const invoiceNumber = `INV-${order.reservationCode || order.id?.substring(0, 8).toUpperCase()}`;
  const invoiceDate = order.timestamp || new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines = [
      `MAX EXECUTIVE TIRES — TAX INVOICE #${invoiceNumber}`,
      `Dominica Inland Revenue Tax ID: #1281761`,
      `Maranatha Square, Pichelin, Dominica | Tel: +1 (767) 616-0155`,
      `----------------------------------------`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone || 'N/A'}`,
      `Vehicle: ${order.vehicleInfo || 'N/A'}`,
      `Date: ${invoiceDate}`,
      `Status: ${order.dispatchStatus || 'Ready for Fitting'}`,
      `----------------------------------------`,
      `Tyres Subtotal: EC$ ${tyresSubtotal.toFixed(2)}`,
      `Fitted Services: EC$ ${servicesSubtotal.toFixed(2)}`,
      `Net Taxable (Excl. VAT): EC$ ${netBeforeTax.toFixed(2)}`,
      `Dominica VAT (15%): EC$ ${vatAmount.toFixed(2)}`,
      `GRAND TOTAL: EC$ ${finalTotalXCD.toFixed(2)} (US$ ${usdEquivalent})`,
      `Payment Method: ${order.paymentMethod || 'Cash at Workshop Counter'}`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = 20;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('MAX EXECUTIVE TIRES', 20, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    y += 5;
    doc.text('High-Performance & Commercial Tyre Specialists • Maranatha Square, Pichelin, Dominica', 20, y);
    y += 4;
    doc.text('Tel: +1 (767) 616-0155 • Email: sales@maxexecutivetires.dm • VAT / Tax ID: #1281761', 20, y);

    y += 8;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);

    // Invoice Title & Meta
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(9, 132, 227);
    doc.text('TAX INVOICE', 20, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Invoice No: ${invoiceNumber}`, 130, y);
    
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${invoiceDate}`, 130, y);
    y += 5;
    doc.text(`Inland Revenue Tax ID: #1281761`, 130, y);
    y += 5;
    doc.text(`Payment: ${order.paymentMethod || 'Cash at Counter'}`, 130, y);

    // Customer info block
    y -= 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('BILLED TO:', 20, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(order.customerName, 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Phone: ${order.customerPhone || 'Not Provided'}`, 20, y);
    y += 5;
    if (order.customerEmail) {
      doc.text(`Email: ${order.customerEmail}`, 20, y);
      y += 5;
    }
    if (order.vehicleInfo) {
      doc.text(`Vehicle: ${order.vehicleInfo}`, 20, y);
      y += 5;
    }
    doc.text(`Status: ${order.dispatchStatus || 'Ready for Fitting'}`, 20, y);

    // Items table header
    y += 12;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, y - 4, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Description', 24, y + 1);
    doc.text('Qty', 120, y + 1);
    doc.text('Unit Price (EC$)', 135, y + 1);
    doc.text('Total (EC$)', 168, y + 1);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    // Tyres lines
    items.forEach((it) => {
      const brand = it.tyre?.brand || 'Tyre';
      const model = it.tyre?.modelName || '';
      const size = it.tyre?.size || '';
      const cond = it.tyre?.condition === 'new' ? 'Brand New' : 'Inspected Used';
      const desc = `${brand} ${model} (${size}) - ${cond}`;
      const qty = it.quantity || 1;
      const unit = (it.tyre?.priceXCD || 0).toFixed(2);
      const lineTot = ((it.tyre?.priceXCD || 0) * qty).toFixed(2);

      doc.text(desc, 24, y);
      doc.text(qty.toString(), 124, y);
      doc.text(`$${unit}`, 142, y);
      doc.text(`$${lineTot}`, 172, y);
      y += 6;
    });

    // Services lines
    servicesDetails.forEach((srv) => {
      doc.text(srv.name, 24, y);
      doc.text(srv.qty.toString(), 124, y);
      doc.text(`$${srv.unitPrice.toFixed(2)}`, 142, y);
      doc.text(`$${srv.total.toFixed(2)}`, 172, y);
      y += 6;
    });

    // Divider
    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y, 190, y);
    y += 8;

    // Totals section
    const rightX = 140;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    doc.text('Tyres Subtotal:', rightX, y);
    doc.text(`EC$ ${tyresSubtotal.toFixed(2)}`, 190, y, { align: 'right' });
    y += 5;

    if (servicesSubtotal > 0) {
      doc.text('Fitting Services:', rightX, y);
      doc.text(`EC$ ${servicesSubtotal.toFixed(2)}`, 190, y, { align: 'right' });
      y += 5;
    }

    doc.text('Net Taxable (Excl. VAT):', rightX, y);
    doc.text(`EC$ ${netBeforeTax.toFixed(2)}`, 190, y, { align: 'right' });
    y += 5;

    doc.text('Dominica VAT (15%):', rightX, y);
    doc.text(`EC$ ${vatAmount.toFixed(2)}`, 190, y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Grand Total:', rightX, y);
    doc.text(`EC$ ${finalTotalXCD.toFixed(2)}`, 190, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`(USD Equivalent: US$ ${usdEquivalent})`, 190, y, { align: 'right' });

    // Footer terms
    y += 18;
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, y, 170, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('TERMS & DOMINICA MOUNTAIN ROAD WARRANTY:', 24, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('• 3-Year Factory Warranty on new tyres; 100% bead and pressure inspection on tested pre-owned tyres.', 24, y + 10);
    doc.text('• Free 1,000 km wheel nut torque and tyre pressure check at Maranatha Square, Pichelin workshop bay.', 24, y + 14);
    doc.text('• Registered business under the Commonwealth of Dominica Inland Revenue Division (Tax ID: #1281761).', 24, y + 18);

    doc.save(`MaxExecutiveTires_Invoice_${invoiceNumber}.pdf`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      id="customer-order-invoice-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Print-specific style block */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-order-invoice, #printable-order-invoice * {
            visibility: visible;
          }
          #printable-order-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Official Tax Invoice
                <span className="text-[10px] bg-slate-800 text-blue-300 font-mono font-bold px-2 py-0.5 rounded-full border border-slate-700">
                  {invoiceNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Inland Revenue Tax ID: #1281761 • Formatted for customer accounting & records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer"
              title="Copy invoice details to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer"
              title="Download PDF invoice"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Print clean invoice on A4 or Letter paper"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto p-6 sm:p-8 bg-slate-50 flex-1">
          <div 
            ref={printAreaRef}
            id="printable-order-invoice"
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-2xl mx-auto text-slate-800 space-y-6"
          >
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-950 uppercase">
                    MAX EXECUTIVE TIRES
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-sm">
                    DOMINICA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  High-Performance & Commercial Tyre Specialists
                </p>
                <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Maranatha Square, Main Highway, Pichelin, Dominica
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    +1 (767) 616-0155 • WhatsApp: +1 (767) 616-0155
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    sales@maxexecutivetires.dm • maxexecutivetires.dm
                  </p>
                </div>
              </div>

              {/* Tax ID & Invoice Badge */}
              <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
                <span className="text-xs font-black uppercase text-blue-700 tracking-wider block">
                  TAX INVOICE / RECEIPT
                </span>
                <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
                  {invoiceNumber}
                </span>
                
                {/* Official Business Tax ID */}
                <div className="mt-2 inline-flex flex-col sm:items-end">
                  <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-950 font-black font-mono text-[11px] px-2.5 py-1 rounded-md shadow-2xs">
                    <Hash className="w-3 h-3 text-amber-700" />
                    Inland Revenue Tax ID: #1281761
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                    Commonwealth of Dominica VAT Reg: #1281761
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-6">
              {/* Billed To */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Billed To Customer:
                </span>
                <p className="font-extrabold text-sm text-slate-950">{order.customerName}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {order.customerPhone || 'Phone not registered'}
                </p>
                {order.customerEmail && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {order.customerEmail}
                  </p>
                )}
                {order.vehicleInfo && (
                  <p className="text-slate-700 font-medium flex items-center gap-1.5 mt-1">
                    <Car className="w-3 h-3 text-slate-400" />
                    Fitment: {order.vehicleInfo}
                  </p>
                )}
              </div>

              {/* Order Meta & Status */}
              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Invoice Details:
                </span>
                <p className="text-slate-700">
                  <strong>Date:</strong> {invoiceDate}
                </p>
                <p className="text-slate-700">
                  <strong>Payment Terms:</strong> {order.paymentMethod || 'Cash at Counter'}
                </p>
                <p className="text-slate-700">
                  <strong>Workshop Bay Status:</strong>{' '}
                  <span className="inline-block bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                    {order.dispatchStatus || 'Ready for Fitting'}
                  </span>
                </p>
                {order.preferredDate && (
                  <p className="text-slate-600 text-[11px]">
                    Fitting Date: {order.preferredDate}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Itemized Tyres & Fitted Services
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2 text-center">Condition</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (EC$)</th>
                      <th className="py-2.5 px-3 text-right">Amount (EC$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => {
                      const brand = it.tyre?.brand || 'Tyre';
                      const model = it.tyre?.modelName || '';
                      const size = it.tyre?.size || '';
                      const isNew = it.tyre?.condition === 'new';
                      const unit = it.tyre?.priceXCD || 0;
                      const q = it.quantity || 1;
                      const lineTot = unit * q;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-extrabold text-slate-900 block">
                              {brand} {model}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              Size: {size} {it.tyre?.plyRating ? `• ${it.tyre.plyRating}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              isNew ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isNew ? 'Brand New' : 'Inspected Used'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                            {q}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            EC$ {unit.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                            EC$ {lineTot.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Fitted Workshop Services */}
                    {servicesDetails.map((srv, idx) => (
                      <tr key={`srv-${idx}`} className="bg-slate-50/40">
                        <td colSpan={2} className="py-2 px-3 text-slate-700 italic">
                          ↳ {srv.name}
                        </td>
                        <td className="py-2 px-2 text-center font-medium text-slate-600">
                          {srv.qty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          EC$ {srv.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                          EC$ {srv.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formatted Totals & Tax Calculation Box */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2 border-t border-slate-200">
              {/* Payment & Tax Compliance Note */}
              <div className="text-xs text-slate-500 space-y-1.5 max-w-xs">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tax Compliant Invoice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Issued in compliance with Dominica Inland Revenue Division statutory guidelines. All tyre sales include environmental compliance and disposal certification.
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  Tax Registration: #1281761 • Official Peg: 2.70 XCD = 1.00 USD
                </p>
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tyres Subtotal:</span>
                  <span className="font-mono font-medium">EC$ {tyresSubtotal.toFixed(2)}</span>
                </div>

                {servicesSubtotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Workshop Fitting Services:</span>
                    <span className="font-mono font-medium">EC$ {servicesSubtotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Net Taxable (Excl. VAT):</span>
                  <span className="font-mono font-medium">EC$ {netBeforeTax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Dominica VAT (15%):</span>
                  <span className="font-mono font-medium">EC$ {vatAmount.toFixed(2)}</span>
                </div>

                <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline text-slate-950 font-black">
                  <span className="text-sm">TOTAL AMOUNT:</span>
                  <span className="text-base font-mono text-blue-700">
                    EC$ {finalTotalXCD.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Equivalent in US$:</span>
                  <span className="font-mono font-semibold">US$ {usdEquivalent}</span>
                </div>
              </div>
            </div>

            {/* Signature & Workshop Bay Stamp Block */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
              <div className="space-y-4">
                <p className="font-bold text-slate-700">Workshop Bay Technician / Cashier:</p>
                <div className="border-b border-slate-400 h-8 w-44"></div>
                <p className="text-[10px] text-slate-400">Max Executive Tires • Maranatha Square, Pichelin</p>
              </div>

              <div className="space-y-4 text-right">
                <p className="font-bold text-slate-700">Customer Acceptance & Signature:</p>
                <div className="border-b border-slate-400 h-8 w-44 ml-auto"></div>
                <p className="text-[10px] text-slate-400">Tyres & Fitting Received in Satisfactory Condition</p>
              </div>
            </div>

            {/* Footer Bottom Notice */}
            <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
              Thank you for trusting Max Executive Tires! Safe driving on Dominica's roads. Free 1,000 km wheel nut re-torque available at our workshop bay.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
