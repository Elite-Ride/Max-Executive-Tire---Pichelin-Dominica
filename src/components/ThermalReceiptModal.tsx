import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Copy, 
  Check, 
  MapPin, 
  Phone, 
  Receipt,
  FileCheck2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AdminOrder } from './AdminOrdersModal';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
  servicePrices?: Record<string, number>;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  servicePrices = { mounting: 20, valves: 15, shredding: 1 }
}) => {
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const items = order.items || [];

  // Item subtotals and service aggregations
  const tyresSubtotal = items.reduce((acc, it) => {
    const p = it.tyre?.priceXCD || 0;
    const q = it.quantity || 1;
    return acc + (p * q);
  }, 0);

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

  const servicesSubtotal = 
    (totalMountingQty * mountingUnit) + 
    (totalValvesQty * valvesUnit) + 
    (totalShreddingQty * shreddingUnit);

  const grandTotalXCD = order.totalXCD || (tyresSubtotal + servicesSubtotal);

  // Dominica VAT Breakdown (15% inclusive extraction standard for Inland Revenue)
  const vatRate = 0.15;
  const netTaxable = Number((grandTotalXCD / (1 + vatRate)).toFixed(2));
  const vatAmount = Number((grandTotalXCD - netTaxable).toFixed(2));
  const usdEquivalent = (grandTotalXCD / 2.70).toFixed(2);

  const receiptDate = order.timestamp || new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textReceipt = [
      `================================`,
      `      MAX EXECUTIVE TIRES       `,
      `      DOMINICA NATURE ISLE      `,
      ` Maranatha Square, Pichelin, DM `,
      `    Tel / WhatsApp: 616-0155    `,
      `  Inland Revenue Tax ID: 1281761`,
      `================================`,
      `RECEIPT: ${order.reservationCode}`,
      `DATE:    ${receiptDate}`,
      `CUSTOMER:${order.customerName}`,
      `PHONE:   ${order.customerPhone || 'N/A'}`,
      `VEHICLE: ${order.vehicleInfo || 'General Fitment'}`,
      `STATUS:  ${order.dispatchStatus || 'Ready for Fitting'}`,
      `PAYMENT: ${order.paymentMethod || 'Cash at Counter'}`,
      `--------------------------------`,
      ...items.map(it => {
        const itemLine = `${it.quantity}x ${it.tyre?.brand} ${it.tyre?.size}`;
        const itemTotal = `EC$ ${(it.tyre?.priceXCD * it.quantity).toFixed(2)}`;
        return `${itemLine.padEnd(20, ' ')} ${itemTotal.padStart(11, ' ')}`;
      }),
      ...(totalMountingQty > 0 ? [`Mounting & Balance (${totalMountingQty}x): EC$ ${(totalMountingQty * mountingUnit).toFixed(2)}`] : []),
      ...(totalValvesQty > 0 ? [`High-Press Valves (${totalValvesQty}x):   EC$ ${(totalValvesQty * valvesUnit).toFixed(2)}`] : []),
      ...(totalShreddingQty > 0 ? [`Eco-Shredder Fee (${totalShreddingQty}x):    EC$ ${(totalShreddingQty * shreddingUnit).toFixed(2)}`] : []),
      `--------------------------------`,
      `Subtotal (Excl. VAT): EC$ ${netTaxable.toFixed(2)}`,
      `Dominica VAT (15%):   EC$ ${vatAmount.toFixed(2)}`,
      `--------------------------------`,
      `TOTAL AMOUNT:         EC$ ${grandTotalXCD.toFixed(2)}`,
      `USD APPROX (2.70):    US$ ${usdEquivalent}`,
      `================================`,
      `  Dominica Inland Revenue Compliant `,
      ` Free 50-Mile Wheel Retorque In Bay `,
      `   Safe Motoring on Mountain Roads  `,
      `================================`
    ].join('\n');

    navigator.clipboard.writeText(textReceipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // 80mm thermal roll paper: width 80mm, dynamic height
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 220]
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text('MAX EXECUTIVE TIRES', 40, 10, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('Maranatha Square, Pichelin, Dominica', 40, 14, { align: 'center' });
    doc.text(`Tel: ${SHOP_LOCATION_INFO.phonePrimary}`, 40, 18, { align: 'center' });
    doc.setFont('courier', 'bold');
    doc.text('TAX ID: #1281761 (Dominica IRD)', 40, 22, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.text('------------------------------------------', 40, 26, { align: 'center' });

    let y = 31;
    doc.setFontSize(7.5);
    doc.text(`REF:     ${order.reservationCode}`, 5, y); y += 4;
    doc.text(`DATE:    ${receiptDate}`, 5, y); y += 4;
    doc.text(`CUST:    ${order.customerName}`, 5, y); y += 4;
    doc.text(`PHONE:   ${order.customerPhone || 'N/A'}`, 5, y); y += 4;
    doc.text(`VEHICLE: ${order.vehicleInfo || 'General Fitment'}`, 5, y); y += 4;
    doc.text(`STATUS:  ${order.dispatchStatus || 'Ready for Fitting'}`, 5, y); y += 4;
    doc.text(`PAY:     ${order.paymentMethod || 'Cash at Counter'}`, 5, y); y += 4;
    doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 5;

    doc.setFont('courier', 'bold');
    doc.text('QTY  DESCRIPTION              AMOUNT', 5, y); y += 4;
    doc.setFont('courier', 'normal');

    items.forEach(it => {
      const desc = `${it.quantity}x ${it.tyre?.brand} ${it.tyre?.size}`.substring(0, 22);
      const amt = `EC$${(it.tyre?.priceXCD * it.quantity).toFixed(2)}`;
      doc.text(desc, 5, y);
      doc.text(amt, 75, y, { align: 'right' });
      y += 4;
    });

    if (totalMountingQty > 0) {
      doc.text(` + Mounting (${totalMountingQty}x)`, 5, y);
      doc.text(`EC$${(totalMountingQty * mountingUnit).toFixed(2)}`, 75, y, { align: 'right' });
      y += 4;
    }
    if (totalValvesQty > 0) {
      doc.text(` + Valves (${totalValvesQty}x)`, 5, y);
      doc.text(`EC$${(totalValvesQty * valvesUnit).toFixed(2)}`, 75, y, { align: 'right' });
      y += 4;
    }
    if (totalShreddingQty > 0) {
      doc.text(` + Eco-Shred (${totalShreddingQty}x)`, 5, y);
      doc.text(`EC$${(totalShreddingQty * shreddingUnit).toFixed(2)}`, 75, y, { align: 'right' });
      y += 4;
    }

    doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 5;
    
    // Tax and VAT lines
    doc.text('Net Taxable (Excl. VAT):', 5, y);
    doc.text(`EC$ ${netTaxable.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
    doc.text('Dominica VAT (15%):', 5, y);
    doc.text(`EC$ ${vatAmount.toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL AMOUNT DUE:', 5, y);
    doc.text(`EC$ ${grandTotalXCD.toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`USD EQUIVALENT: US$ ${usdEquivalent}`, 5, y);
    y += 6;

    doc.text('==========================================', 40, y, { align: 'center' }); y += 5;
    doc.text('Dominica Inland Revenue Compliant', 40, y, { align: 'center' }); y += 4;
    doc.text('Free 50-Mile Wheel Retorque in Bay', 40, y, { align: 'center' }); y += 4;
    doc.text('Thank You for Choosing Max Executive!', 40, y, { align: 'center' });

    doc.save(`Thermal_Receipt_${order.reservationCode}.pdf`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Toolbar (Mobile friendly actions) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Thermal Receipt (58/80mm)</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-200 text-xs">
          <span className="text-[11px] text-slate-600 font-medium">
            Roll: <strong>80mm / 3-inch</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer active:scale-95"
              title="Copy receipt as plain text"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer active:scale-95"
              title="Download 80mm PDF"
            >
              <Download className="w-3 h-3 text-blue-400" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer active:scale-95"
              title="Print to thermal roll printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* The Thermal Paper Receipt View (Clean, Narrow, Monospace / High Contrast) */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] bg-slate-50 flex justify-center">
          <div 
            ref={receiptRef}
            id="thermal-receipt-print-area"
            style={{ width: '100%', maxWidth: '300px' }}
            className="bg-white border border-dashed border-slate-300 p-4 font-mono text-[11px] leading-relaxed text-slate-900 shadow-xs select-text"
          >
            {/* Store Banner */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <p className="font-bold text-[13px] tracking-wide text-black">MAX EXECUTIVE TIRES</p>
              <p className="text-[10px] text-slate-600">Maranatha Square, Pichelin</p>
              <p className="text-[10px] text-slate-600">Commonwealth of Dominica</p>
              <p className="text-[10px] text-slate-700">Tel: {SHOP_LOCATION_INFO.phonePrimary}</p>
              
              {/* Dominica Tax ID & IRD Compliance */}
              <div className="pt-1">
                <span className="inline-block bg-slate-100 text-slate-900 font-bold px-1.5 py-0.5 rounded text-[10px] border border-slate-300">
                  TAX ID: #1281761
                </span>
                <p className="text-[9px] text-slate-500 uppercase">Dominica Inland Revenue</p>
              </div>
            </div>

            {/* Essential Order Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Ref:</span>
                <span className="font-bold text-black">{order.reservationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-800">{receiptDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[170px] text-right">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800">{order.customerPhone}</span>
                </div>
              )}
              {order.vehicleInfo && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="text-slate-800 truncate max-w-[170px] text-right">{order.vehicleInfo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="text-slate-800">{order.paymentMethod || 'Cash at Counter'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-800">{order.dispatchStatus || 'Ready for Fitting'}</span>
              </div>
            </div>

            {/* Itemized Tyres & Services */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
              <div className="flex justify-between font-bold text-slate-700 text-[10px] border-b border-slate-200 pb-1">
                <span>ITEM / DESCRIPTION</span>
                <span>AMOUNT</span>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-black leading-tight">
                      {it.quantity}x {it.tyre?.brand} {it.tyre?.modelName || ''}
                    </span>
                    <span className="font-bold text-black shrink-0">
                      EC${(it.tyre?.priceXCD * it.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Size: {it.tyre?.size} ({it.tyre?.condition?.toUpperCase()})</span>
                    <span>@ EC${it.tyre?.priceXCD} ea</span>
                  </div>
                </div>
              ))}

              {/* Aggregated Workshop Services */}
              {totalMountingQty > 0 && (
                <div className="flex justify-between text-[10px] text-slate-700 pt-1">
                  <span>+ Mounting & Balancing ({totalMountingQty}x)</span>
                  <span className="font-medium">EC${(totalMountingQty * mountingUnit).toFixed(2)}</span>
                </div>
              )}
              {totalValvesQty > 0 && (
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>+ Valve Stems ({totalValvesQty}x)</span>
                  <span className="font-medium">EC${(totalValvesQty * valvesUnit).toFixed(2)}</span>
                </div>
              )}
              {totalShreddingQty > 0 && (
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>+ Eco-Disposal Surcharge ({totalShreddingQty}x)</span>
                  <span className="font-medium">EC${(totalShreddingQty * shreddingUnit).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* VAT & Grand Total Breakdown */}
            <div className="py-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Tyres Subtotal:</span>
                <span>EC$ {tyresSubtotal.toFixed(2)}</span>
              </div>
              {servicesSubtotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Services Subtotal:</span>
                  <span>EC$ {servicesSubtotal.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-slate-700">
                <span>Net Taxable (Excl. VAT):</span>
                <span>EC$ {netTaxable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Dominica VAT (15%):</span>
                <span>EC$ {vatAmount.toFixed(2)}</span>
              </div>

              {/* Total Due Highlight */}
              <div className="border-t-2 border-black pt-2 pb-1 flex justify-between items-baseline font-bold text-black text-sm">
                <span>TOTAL DUE:</span>
                <span>EC$ {grandTotalXCD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>USD Equivalent (x2.70):</span>
                <span>US$ {usdEquivalent}</span>
              </div>
            </div>

            {/* Bottom Certification & Footer */}
            <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-1 text-[9.5px] text-slate-600">
              <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                <FileCheck2 className="w-3 h-3 text-emerald-600" />
                <span>OFFICIAL TAX INVOICE RECEIPT</span>
              </div>
              <p>Certified for Dominica Inland Revenue Division (IRD)</p>
              <p className="font-semibold text-slate-900">Complimentary 50-Mile Wheel Retorque in Bay</p>
              <p className="pt-1 italic">Thank you for driving safely with Max Executive Tires!</p>
              <p className="text-[8px] text-slate-400">=== END OF THERMAL RECEIPT ===</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
          Formatted for standard 58mm & 80mm ESC/POS bluetooth & USB receipt printers.
        </div>
      </div>
    </div>
  );
};
