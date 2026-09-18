import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  X,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Car,
  Phone,
  AlertCircle,
  FileText,
  Wrench,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { jsPDF } from 'jspdf';

interface DailyManifestPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: AdminOrder[];
  servicePrices?: Record<string, number>;
}

export const DailyManifestPrintPreviewModal: React.FC<DailyManifestPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  orders,
  servicePrices = { mounting: 20, valves: 15, shredding: 1 }
}) => {
  const [filterMode, setFilterMode] = useState<'all_active' | 'pending' | 'ready'>('all_active');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [densityMode, setDensityMode] = useState<'normal' | 'compact'>('normal');
  const [copied, setCopied] = useState(false);

  // Manage print class on body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('is-manifest-preview-open');
    } else {
      document.body.classList.remove('is-manifest-preview-open');
    }
    return () => {
      document.body.classList.remove('is-manifest-preview-open');
    };
  }, [isOpen]);

  // Filter orders needing shop floor attention
  const manifestOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = order.dispatchStatus || 'Pending Dispatch';
      const isCompleted = status === 'Dispatched' || status === 'Completed';
      if (isCompleted) return false;

      if (filterMode === 'pending') {
        return status === 'Pending' || status === 'Pending Dispatch';
      }
      if (filterMode === 'ready') {
        return status === 'Ready for Fitting' || status === 'Scheduled';
      }
      return true; // all_active
    });
  }, [orders, filterMode]);

  // Totals calculations
  const totals = useMemo(() => {
    let totalTyres = 0;
    let totalMounting = 0;
    let totalValves = 0;
    let totalShredding = 0;
    const tyreSummaryMap: Record<string, number> = {};

    manifestOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        totalTyres += qty;
        if (item.includeMounting) totalMounting += qty;
        if (item.includeNewValves) totalValves += qty;
        if (item.includeShredding) totalShredding += qty;

        const tyreLabel = `${item.tyre?.brand || 'Tyre'} ${item.tyre?.size || ''} (${item.tyre?.condition || 'New'})`;
        tyreSummaryMap[tyreLabel] = (tyreSummaryMap[tyreLabel] || 0) + qty;
      });
    });

    return {
      totalOrders: manifestOrders.length,
      totalTyres,
      totalMounting,
      totalValves,
      totalShredding,
      tyreSummary: Object.entries(tyreSummaryMap).sort((a, b) => b[1] - a[1])
    };
  }, [manifestOrders]);

  if (!isOpen) return null;

  const handleTriggerPrint = () => {
    document.body.classList.add('is-printing-manifest');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('is-printing-manifest');
    }, 1000);
  };

  const handleCopySummary = () => {
    const text = `MAX EXECUTIVE TIRES — DAILY SHOP FLOOR MANIFEST (${new Date().toLocaleDateString()})
Total Active Orders: ${totals.totalOrders} | Total Tyres: ${totals.totalTyres}
Mounting & Balancing: ${totals.totalMounting} | Valves: ${totals.totalValves} | Eco-Shred: ${totals.totalShredding}

${manifestOrders
  .map(
    (o, i) =>
      `${i + 1}. #${o.reservationCode} - ${o.customerName} (${o.customerPhone}) | Vehicle: ${o.vehicleInfo} | Tyres: ${(o.items || []).map(it => `${it.quantity}x ${it.tyre?.brand} ${it.tyre?.size}`).join(', ')} | Status: ${o.dispatchStatus || 'Pending'}`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('MAX EXECUTIVE TIRES — DAILY SHOP FLOOR MANIFEST', 10, 15);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Maranatha Square, Pichelin, Dominica | Tel: (767) 616-0155 | Generated: ${new Date().toLocaleString()}`, 10, 20);

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(10, 23, 200, 23);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Active Orders: ${totals.totalOrders}   |   Total Tyres: ${totals.totalTyres}   |   Mounting: ${totals.totalMounting}   |   Valves: ${totals.totalValves}`, 10, 29);

    let y = 36;
    manifestOrders.forEach((order, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. #${order.reservationCode} - ${order.customerName} (${order.customerPhone})`, 10, y);
      doc.text(`Vehicle: ${order.vehicleInfo || 'Standard'} | Scheduled: ${order.preferredDate || 'Today'}`, 10, y + 4);

      const itemsStr = (order.items || []).map(i => `${i.quantity}x ${i.tyre?.brand} ${i.tyre?.size}`).join(', ');
      doc.setTextColor(71, 85, 105);
      doc.text(`Tyres: ${itemsStr}`, 10, y + 8);
      y += 14;
    });

    doc.save(`MaxExecutiveTires_DailyManifest_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div
      id="daily-manifest-preview-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Preview Chrome / Toolbar */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-400/30 flex items-center justify-center shadow-inner">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Daily Manifest — A4 Print Preview
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md">
                  ISO A4 Portrait (210 × 297 mm)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrated print layout for shop floor rack staging & workshop bay technician sign-offs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="manifest-trigger-print-btn"
              type="button"
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
              title="Send directly to printer or save as PDF via system print dialog"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Manifest</span>
            </button>

            <button
              id="manifest-download-pdf-btn"
              type="button"
              onClick={handleDownloadPDF}
              className="hidden sm:inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Download standalone PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              id="manifest-copy-text-btn"
              type="button"
              onClick={handleCopySummary}
              className="hidden md:inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              id="close-manifest-preview-btn"
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close Preview"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Filter & Zoom Controls Bar */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Order Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterMode('all_active')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterMode === 'all_active'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Active ({orders.filter((o) => o.dispatchStatus !== 'Dispatched' && o.dispatchStatus !== 'Completed').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterMode === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Pending ({orders.filter((o) => (o.dispatchStatus || 'Pending').includes('Pending')).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ready')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterMode === 'ready'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Ready for Fitting ({orders.filter((o) => (o.dispatchStatus || '').includes('Ready') || (o.dispatchStatus || '').includes('Scheduled')).length})
            </button>
          </div>

          {/* Density & Zoom Tools */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Density:
            </span>
            <button
              type="button"
              onClick={() => setDensityMode('normal')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                densityMode === 'normal' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setDensityMode('compact')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                densityMode === 'compact' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Fit more rows per page"
            >
              Compact (Dense)
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Scale:
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(70, prev - 10))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-slate-300 font-mono text-xs w-10 text-center">
              {zoomScale}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(130, prev + 10))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(100)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded text-[10px] font-bold"
              title="Reset zoom to 100%"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Scrollable Preview Stage displaying the physical A4 Paper */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/80 flex justify-center items-start">
          {/* A4 Paper Sheet Wrapper */}
          <div
            id="daily-manifest-print-sheet"
            className="daily-manifest-a4-sheet bg-white text-slate-900 shadow-2xl rounded-xs border border-slate-300 origin-top transition-transform"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '10mm',
              transform: `scale(${zoomScale / 100})`,
              transformOrigin: 'top center',
              boxSizing: 'border-box'
            }}
          >
            {/* Manifest Header */}
            <div className="header border-b-2 border-slate-900 pb-2.5 mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                    Official Workshop Work Order
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    DOC-A4-MAN-01
                  </span>
                </div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 mt-1">
                  MAX EXECUTIVE TIRES — SHOP FLOOR DAILY MANIFEST
                </h1>
                <p className="text-[10.5px] text-slate-600 font-medium leading-tight">
                  Maranatha Square, Pichelin, Commonwealth of Dominica • Emergency Roadside & Workshop Bay Services • Tel: (767) 616-0155
                </p>
              </div>

              <div className="text-right text-[10.5px] text-slate-600">
                <div className="font-bold text-slate-900">
                  {new Date().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <div>Generated: {new Date().toLocaleTimeString()}</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  Filter: <strong className="uppercase">{filterMode.replace('_', ' ')}</strong>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar on A4 Header */}
            <div className="kpis grid grid-cols-5 gap-2 mb-3">
              <div className="kpi bg-slate-50 border border-slate-300 p-2 rounded text-center">
                <div className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                  Active Orders
                </div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {totals.totalOrders}
                </div>
              </div>
              <div className="kpi bg-slate-50 border border-slate-300 p-2 rounded text-center">
                <div className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                  Tyres Needed
                </div>
                <div className="text-base font-black text-blue-900 leading-tight">
                  {totals.totalTyres}
                </div>
              </div>
              <div className="kpi bg-slate-50 border border-slate-300 p-2 rounded text-center">
                <div className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                  Mounting & Balance
                </div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {totals.totalMounting}
                </div>
              </div>
              <div className="kpi bg-slate-50 border border-slate-300 p-2 rounded text-center">
                <div className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                  Valve Stems
                </div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {totals.totalValves}
                </div>
              </div>
              <div className="kpi bg-slate-50 border border-slate-300 p-2 rounded text-center">
                <div className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                  Eco-Shredding
                </div>
                <div className="text-base font-black text-emerald-800 leading-tight">
                  {totals.totalShredding}
                </div>
              </div>
            </div>

            {/* Main Manifest Table — Optimized specifically for A4 Printable Dimensions */}
            <table className="w-full border-collapse border border-slate-300 mb-3.5 text-[10px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[8.5px] tracking-wider">
                  <th className="border border-slate-900 p-1.5 text-center w-[28px]">#</th>
                  <th className="border border-slate-900 p-1.5 text-left w-[78px]">Res. Code</th>
                  <th className="border border-slate-900 p-1.5 text-left w-[135px]">Customer & Vehicle</th>
                  <th className="border border-slate-900 p-1.5 text-left w-[75px]">Scheduled</th>
                  <th className="border border-slate-900 p-1.5 text-left">Tyres to Pull & Mount</th>
                  <th className="border border-slate-900 p-1.5 text-left w-[70px]">Services</th>
                  <th className="border border-slate-900 p-1.5 text-left w-[75px]">Payment</th>
                  <th className="border border-slate-900 p-1.5 text-left w-[130px]">Workshop Sign-Off</th>
                </tr>
              </thead>
              <tbody>
                {manifestOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 font-medium">
                      No active shop floor orders matching selected filter.
                    </td>
                  </tr>
                ) : (
                  manifestOrders.map((order, idx) => {
                    const isPaid = order.paymentStatus === 'Confirmed';
                    const status = order.dispatchStatus || 'Pending';

                    const services: string[] = [];
                    if (order.items?.some(i => i.includeMounting)) services.push('Mounting');
                    if (order.items?.some(i => i.includeNewValves)) services.push('Valves');
                    if (order.items?.some(i => i.includeShredding)) services.push('Eco-Shred');

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-slate-300 avoid-break ${
                          idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                        }`}
                      >
                        {/* # */}
                        <td className={`border border-slate-300 font-bold text-center align-top ${densityMode === 'compact' ? 'py-1 px-1' : 'py-1.5 px-1.5'}`}>
                          {idx + 1}
                        </td>

                        {/* Res. Code & Status */}
                        <td className={`border border-slate-300 align-top ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          <div className="font-mono font-black text-slate-900 text-[10.5px]">
                            {order.reservationCode}
                          </div>
                          <span
                            className={`inline-block text-[8px] font-black uppercase px-1 py-0.5 rounded mt-0.5 ${
                              status.includes('Ready')
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* Customer & Vehicle */}
                        <td className={`border border-slate-300 align-top leading-tight ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          <div className="font-bold text-slate-900">{order.customerName}</div>
                          <div className="text-slate-600 text-[9px] font-mono">{order.customerPhone}</div>
                          <div className="text-slate-500 text-[9px] truncate max-w-[130px] font-medium">
                            🚗 {order.vehicleInfo || 'Standard'}
                          </div>
                        </td>

                        {/* Scheduled Preferred Time */}
                        <td className={`border border-slate-300 align-top text-[9.5px] font-semibold text-slate-800 ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          {order.preferredDate || 'Today'}
                        </td>

                        {/* Tyres to Pull & Mount */}
                        <td className={`border border-slate-300 align-top leading-tight ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          <div className="space-y-0.5">
                            {(order.items || []).map((it, itemIdx) => (
                              <div key={itemIdx} className="text-slate-900">
                                <span className="font-black text-blue-900">{it.quantity}x</span>{' '}
                                <span className="font-bold">{it.tyre?.brand}</span> {it.tyre?.modelName || ''}{' '}
                                <span className="font-mono text-slate-700">({it.tyre?.size})</span>{' '}
                                <span className="text-[8.5px] text-slate-500">[{it.tyre?.condition || 'New'}]</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Services */}
                        <td className={`border border-slate-300 align-top text-[9px] font-semibold text-slate-700 ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          {services.length > 0 ? (
                            <div className="space-y-0.5">
                              {services.map((s, si) => (
                                <div key={si}>• {s}</div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">Tyres Only</span>
                          )}
                        </td>

                        {/* Payment & Amount */}
                        <td className={`border border-slate-300 align-top ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          <span
                            className={`inline-block text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isPaid ? 'CONFIRMED' : 'DUE AT SHOP'}
                          </span>
                          <div className="font-black text-slate-900 mt-1 text-[10.5px]">
                            EC$ {order.totalXCD}
                          </div>
                        </td>

                        {/* Shop Floor Sign-Off Checkboxes */}
                        <td className={`border border-slate-300 align-top text-[8.5px] text-slate-700 space-y-1 ${densityMode === 'compact' ? 'py-1 px-1.5' : 'py-1.5 px-1.5'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 border border-slate-400 rounded-xs bg-white flex-shrink-0" />
                            <span>Rack Pulled</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 border border-slate-400 rounded-xs bg-white flex-shrink-0" />
                            <span>Bead & Rim OK</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 border border-slate-400 rounded-xs bg-white flex-shrink-0" />
                            <span>Torqued (90-110 lb·ft)</span>
                          </div>
                          <div className="text-[8px] text-slate-500 pt-0.5 border-t border-slate-200">
                            Tech: ____________
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Bulk Tyre Staging Summary for Rack Pullers */}
            <div className="tyre-summary-box border border-slate-300 bg-slate-50 p-2.5 rounded mb-4 text-[9.5px]">
              <div className="font-black uppercase tracking-wider text-slate-900 text-[9px] mb-1">
                Tyre Warehouse Staging Summary for Rack Pullers:
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                {totals.tyreSummary.map(([label, qty], i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 border border-slate-400 rounded-2xs bg-white" />
                    <span className="font-black text-slate-900">{qty}x</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official 3-Tier Sign-Off Footer */}
            <div className="signoff-section border-t border-dashed border-slate-400 pt-3 mt-auto">
              <div className="grid grid-cols-3 gap-6 text-[9.5px]">
                <div>
                  <div className="font-bold text-slate-900">1. Shift Lead / Workshop Supervisor:</div>
                  <div className="mt-6 border-b border-slate-800 w-full" />
                  <div className="text-[8px] text-slate-500 mt-1">Signature & Badge #</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">2. Lead Tyre Fitting Technician:</div>
                  <div className="mt-6 border-b border-slate-800 w-full" />
                  <div className="text-[8px] text-slate-500 mt-1">Calibration & Torque Verification</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">3. Front Desk / Counter Cashier:</div>
                  <div className="mt-6 border-b border-slate-800 w-full" />
                  <div className="text-[8px] text-slate-500 mt-1">Customer Release & Invoice Check</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[8px] text-slate-400 mt-4 pt-2 border-t border-slate-200">
                <span>Max Executive Tires • Pichelin, Commonwealth of Dominica</span>
                <span>Optimized for A4 Standard Print (210mm × 297mm)</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              All table dimensions adhere strictly to standard A4 printable widths (190mm usable) with no horizontal clipping.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Manifest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
