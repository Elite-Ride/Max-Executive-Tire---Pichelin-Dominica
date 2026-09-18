import React, { useState, useMemo } from 'react';
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
  Eye
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { DailyManifestPrintPreviewModal } from './DailyManifestPrintPreviewModal';

interface DailyManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: AdminOrder[];
  servicePrices?: Record<string, number>;
}

export const DailyManifestModal: React.FC<DailyManifestModalProps> = ({
  isOpen,
  onClose,
  orders,
  servicePrices = { mounting: 20, valves: 15, shredding: 1 }
}) => {
  const [filterMode, setFilterMode] = useState<'pending' | 'ready' | 'all_active'>('all_active');
  const [copied, setCopied] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

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
      order.items.forEach((item) => {
        const qty = item.quantity || 1;
        totalTyres += qty;
        if (item.includeMounting) totalMounting += qty;
        if (item.includeNewValves) totalValves += qty;
        if (item.includeShredding) totalShredding += qty;

        const tyreLabel = `${item.tyre?.brand} ${item.tyre?.size || ''} (${item.tyre?.condition || 'New'})`;
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Shop Floor Manifest — Max Executive Tires Pichelin</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 10px;
              font-size: 11px;
              line-height: 1.3;
            }
            .header {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .header h1 {
              margin: 0 0 4px 0;
              font-size: 18px;
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }
            .header .meta {
              font-size: 10px;
              color: #475569;
            }
            .kpis {
              display: flex;
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              border-radius: 4px;
              background: #f8fafc;
              flex: 1;
            }
            .kpi-title {
              font-size: 9px;
              text-transform: uppercase;
              font-weight: bold;
              color: #64748b;
            }
            .kpi-val {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th {
              background: #0f172a;
              color: #ffffff;
              font-size: 9px;
              text-transform: uppercase;
              padding: 6px 5px;
              text-align: left;
              border: 1px solid #0f172a;
            }
            td {
              padding: 6px 5px;
              border: 1px solid #cbd5e1;
              vertical-align: top;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
            }
            .badge-ready { background: #dbeafe; color: #1e40af; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-unpaid { background: #fee2e2; color: #991b1b; }
            .check-box {
              display: inline-block;
              width: 12px;
              height: 12px;
              border: 1px solid #64748b;
              border-radius: 2px;
              margin-right: 2px;
              vertical-align: middle;
            }
            .signoff {
              margin-top: 20px;
              border-top: 1px dashed #94a3b8;
              padding-top: 10px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
            }
            .signoff-line {
              width: 180px;
              border-bottom: 1px solid #0f172a;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Max Executive Tires — Shop Floor Daily Manifest</h1>
              <div class="meta">
                Maranatha Square, Pichelin, Dominica | Emergency & Workshop Bay Services | Tel: (767) 616-0155
              </div>
            </div>
            <div style="text-align: right; font-size: 10px;">
              <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}<br/>
              <strong>Generated:</strong> ${new Date().toLocaleTimeString()}
            </div>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-title">Active Orders to Stage</div>
              <div class="kpi-val">${totals.totalOrders}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Total Tyres Required</div>
              <div class="kpi-val">${totals.totalTyres}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Mounting & Balancing</div>
              <div class="kpi-val">${totals.totalMounting}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Valves & Stems</div>
              <div class="kpi-val">${totals.totalValves}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Eco-Shredding</div>
              <div class="kpi-val">${totals.totalShredding}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th style="width: 70px;">Res. Code</th>
                <th style="width: 130px;">Customer & Vehicle</th>
                <th style="width: 80px;">Preferred Time</th>
                <th>Tyres to Pull & Mount</th>
                <th style="width: 75px;">Services</th>
                <th style="width: 70px;">Payment</th>
                <th style="width: 130px;">Shop Floor Sign-Off</th>
              </tr>
            </thead>
            <tbody>
              ${manifestOrders.map((order, idx) => {
                const isPaid = order.paymentStatus === 'Confirmed';
                const status = order.dispatchStatus || 'Pending';
                
                const tyreList = order.items.map(it => 
                  `• <strong>${it.quantity}x</strong> ${it.tyre?.brand} ${it.tyre?.modelName} (${it.tyre?.size}) [${it.tyre?.condition}]`
                ).join('<br/>');

                const services = [];
                if (order.items.some(i => i.includeMounting)) services.push('Mount');
                if (order.items.some(i => i.includeNewValves)) services.push('Valves');
                if (order.items.some(i => i.includeShredding)) services.push('Eco');

                return `
                  <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td>
                      <span style="font-family: monospace; font-weight: bold;">${order.reservationCode}</span>
                      <br/>
                      <span class="badge ${status.includes('Ready') ? 'badge-ready' : 'badge-pending'}">${status}</span>
                    </td>
                    <td>
                      <strong>${order.customerName}</strong><br/>
                      <span style="color: #475569;">${order.customerPhone}</span><br/>
                      <small>Vehicle: ${order.vehicleInfo || 'Standard'}</small>
                    </td>
                    <td>${order.preferredDate || 'Today'}</td>
                    <td>${tyreList}</td>
                    <td>${services.join(', ') || 'Tyres Only'}</td>
                    <td>
                      <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">
                        ${isPaid ? 'CONFIRMED' : 'DUE AT COUNTER'}
                      </span>
                      <br/>
                      <small>EC$ ${order.totalXCD}</small>
                    </td>
                    <td>
                      <div><span class="check-box"></span> Rack Pulled</div>
                      <div><span class="check-box"></span> Inspected</div>
                      <div><span class="check-box"></span> Mounted / Torqued</div>
                      <div style="margin-top: 3px; font-size: 8px; color: #64748b;">Tech: ____________</div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="margin-bottom: 12px; font-size: 10px;">
            <strong>Tyre Staging Summary for Rack Pullers:</strong><br/>
            ${totals.tyreSummary.map(([desc, count]) => `• [ &nbsp; ] <strong>${count}x</strong> ${desc}`).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
          </div>

          <div class="signoff">
            <div>
              <div>Shift Lead / Supervisor:</div>
              <div class="signoff-line"></div>
            </div>
            <div>
              <div>Lead Tyre Technician:</div>
              <div class="signoff-line"></div>
            </div>
            <div>
              <div>Counter Cashier Verification:</div>
              <div class="signoff-line"></div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleCopySummary = () => {
    const text = `MAX EXECUTIVE TIRES — DAILY SHOP MANIFEST (${new Date().toLocaleDateString()})
Total Active Orders: ${totals.totalOrders}
Total Tyres Required: ${totals.totalTyres}
Mounting Services: ${totals.totalMounting} | New Valves: ${totals.totalValves}

${manifestOrders.map((o, i) => `${i + 1}. #${o.reservationCode} - ${o.customerName} (${o.customerPhone}) | Vehicle: ${o.vehicleInfo} | Tyres: ${o.items.map(it => `${it.quantity}x ${it.tyre?.brand} ${it.tyre?.size}`).join(', ')} | Status: ${o.dispatchStatus || 'Pending'}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-400/30 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Daily Shop Floor Fitting Manifest
              </h3>
              <p className="text-xs text-slate-300">
                Formatted work order summary for Pichelin workshop bay technicians
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & KPIs Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all_active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterMode === 'all_active'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Active ({orders.filter((o) => o.dispatchStatus !== 'Dispatched' && o.dispatchStatus !== 'Completed').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterMode === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                Pending Only
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ready')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterMode === 'ready'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-800 hover:bg-blue-50'
                }`}
              >
                Ready for Fitting / Scheduled
              </button>
            </div>

            {/* Print & Copy Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="manifest-open-a4-preview-top-btn"
                type="button"
                onClick={() => setIsPrintPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                title="Preview calibrated A4 layout with print media styles"
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span>A4 Print Preview</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-2 rounded-xl transition shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied Text!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Daily Manifest</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Orders to Stage</span>
              <span className="text-base font-black text-slate-900">{totals.totalOrders}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Tyres Needed</span>
              <span className="text-base font-black text-blue-700">{totals.totalTyres}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mount & Balance</span>
              <span className="text-base font-black text-emerald-700">{totals.totalMounting}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">New Valves</span>
              <span className="text-base font-black text-purple-700">{totals.totalValves}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Eco Disposal</span>
              <span className="text-base font-black text-amber-700">{totals.totalShredding}</span>
            </div>
          </div>
        </div>

        {/* Printable Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {manifestOrders.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-800">All caught up! No active orders to stage.</p>
              <p className="text-xs text-slate-400">All pending orders have been completed or dispatched.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3 w-12">#</th>
                    <th className="p-3">Order & Code</th>
                    <th className="p-3">Customer & Vehicle</th>
                    <th className="p-3">Tyres Required</th>
                    <th className="p-3">Fitment Services</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 w-40">Shop Floor Checklist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {manifestOrders.map((order, idx) => {
                    const isPaid = order.paymentStatus === 'Confirmed';
                    const dispatchStatus = order.dispatchStatus || 'Pending Dispatch';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 space-y-1">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-[#0984E3] px-2 py-0.5 rounded border border-blue-200 block w-max">
                            {order.reservationCode}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
                            dispatchStatus === 'Ready for Fitting'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {dispatchStatus}
                          </span>
                          <div className="text-[10px] text-slate-400">{order.preferredDate || 'Fast-Lane'}</div>
                        </td>

                        <td className="p-3 space-y-0.5">
                          <div className="font-extrabold text-slate-900">{order.customerName}</div>
                          <div className="text-slate-600 font-medium">{order.customerPhone}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            🚗 {order.vehicleInfo || 'General Vehicle'}
                          </div>
                        </td>

                        <td className="p-3 space-y-1">
                          {order.items.map((it, itIdx) => (
                            <div key={itIdx} className="text-slate-800 text-[11px]">
                              <strong className="text-blue-700">{it.quantity}x</strong>{' '}
                              <span className="font-semibold">{it.tyre?.brand} {it.tyre?.modelName}</span>{' '}
                              <span className="text-slate-500">({it.tyre?.size || 'Standard'})</span>{' '}
                              <span className={`text-[9px] font-bold px-1 rounded ${
                                it.tyre?.condition === 'new' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {it.tyre?.condition === 'new' ? 'NEW' : 'USED'}
                              </span>
                            </div>
                          ))}
                        </td>

                        <td className="p-3 space-y-1">
                          {order.items.some(i => i.includeMounting) && (
                            <span className="inline-block text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded mr-1">
                              Mounting
                            </span>
                          )}
                          {order.items.some(i => i.includeNewValves) && (
                            <span className="inline-block text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded mr-1">
                              Valves
                            </span>
                          )}
                          {order.items.some(i => i.includeShredding) && (
                            <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Disposal
                            </span>
                          )}
                          {!order.items.some(i => i.includeMounting || i.includeNewValves || i.includeShredding) && (
                            <span className="text-[10px] text-slate-400">Tyre Supply Only</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {isPaid ? 'PAID / CONFIRMED' : 'COLLECT AT SHOP'}
                          </span>
                          <div className="font-bold text-slate-900 mt-1">EC$ {order.totalXCD}</div>
                        </td>

                        <td className="p-3 text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" className="rounded text-slate-700" readOnly />
                            <span>Rack Pulled</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" className="rounded text-slate-700" readOnly />
                            <span>Tread & Bead QC</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" className="rounded text-slate-700" readOnly />
                            <span>Mounted & Torqued</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Maranatha Square, Pichelin • Daily Shop Floor Work Allocation Manifest
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setIsPrintPreviewOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>A4 Print Preview</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Send to Printer</span>
            </button>
          </div>
        </div>
      </div>

      {/* A4 Dedicated Print Preview Modal */}
      <DailyManifestPrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        orders={orders}
        servicePrices={servicePrices}
      />
    </div>
  );
};
