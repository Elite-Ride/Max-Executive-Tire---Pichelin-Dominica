import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  Download,
  X,
  Wrench,
  CheckCircle2,
  FileSpreadsheet,
  Copy,
  Check,
  Search,
  Filter,
  Car,
  Phone,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { jsPDF } from 'jspdf';

interface DailyServiceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: AdminOrder[];
  servicePrices?: Record<string, number>;
  onUpdateOrderStatus?: (orderId: string, status: 'Pending' | 'Ready for Fitting' | 'Completed') => void;
}

export const DailyServiceScheduleModal: React.FC<DailyServiceScheduleModalProps> = ({
  isOpen,
  onClose,
  orders,
  servicePrices = { mounting: 20, valves: 15, shredding: 1 },
  onUpdateOrderStatus
}) => {
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedBay, setSelectedBay] = useState<'all' | 'bay1' | 'bay2' | 'fastlane'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Clean print state on body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('is-service-schedule-open');
    } else {
      document.body.classList.remove('is-service-schedule-open');
    }
    return () => {
      document.body.classList.remove('is-service-schedule-open');
    };
  }, [isOpen]);

  // Check if an order is for the current day (today)
  const isTodayOrder = (order: AdminOrder): boolean => {
    const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const pref = (order.preferredDate || '').toLowerCase();
    const ts = (order.timestamp || '').toLowerCase();
    const dispatch = (order.dispatchDate || '').toLowerCase();

    // Check keyword "today"
    if (pref.includes('today') || ts.includes('today') || dispatch.includes('today')) {
      return true;
    }

    // Check date matches
    if (
      pref.includes(todayStr) ||
      ts.includes(todayStr) ||
      pref.includes(todayIso) ||
      dispatch.includes(todayIso)
    ) {
      return true;
    }

    // Custom date match if user chose specific date
    if (customDate) {
      if (pref.includes(customDate) || dispatch.includes(customDate) || ts.includes(customDate)) {
        return true;
      }
    }

    return false;
  };

  // Assign deterministic bay based on order code/vehicle to simulate workshop distribution
  const getAssignedBay = (order: AdminOrder): { bay: string; bayCode: 'bay1' | 'bay2' | 'fastlane'; techLead: string } => {
    const v = (order.vehicleInfo || '').toLowerCase();
    if (v.includes('truck') || v.includes('hilux') || v.includes('d-max') || v.includes('commercial') || v.includes('van') || v.includes('hiace')) {
      return { bay: 'Bay 2 (Commercial & 4x4 Heavy Lift)', bayCode: 'bay2', techLead: 'D. Shillingford (Senior Master Tech)' };
    }
    if ((order.preferredDate || '').toLowerCase().includes('fast-lane') || (order.preferredDate || '').toLowerCase().includes('fast lane')) {
      return { bay: 'Express Fast-Lane Bay (Quick Mount)', bayCode: 'fastlane', techLead: 'J. Joseph (Rapid Turnaround)' };
    }
    return { bay: 'Bay 1 (Light Passenger & Sedan Bay)', bayCode: 'bay1', techLead: 'K. Emanuel (Lead Wheel Specialist)' };
  };

  // Filter orders that are 'Ready for Fitting'
  const scheduleOrders = useMemo(() => {
    return orders.filter(order => {
      // Must be Ready for Fitting (or Scheduled in queue for fitting)
      const status = order.dispatchStatus || 'Pending';
      const isReady = status === 'Ready for Fitting' || status === 'Scheduled';
      if (!isReady) return false;

      // Filter by date
      if (selectedDateFilter === 'today' && !isTodayOrder(order)) {
        return false;
      }

      // Filter by bay
      if (selectedBay !== 'all') {
        const assigned = getAssignedBay(order);
        if (assigned.bayCode !== selectedBay) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesCode = order.reservationCode.toLowerCase().includes(q);
        const matchesVehicle = (order.vehicleInfo || '').toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.includes(q);
        const matchesTyres = (order.items || []).some(
          it =>
            (it.tyre?.brand || '').toLowerCase().includes(q) ||
            (it.tyre?.size || '').toLowerCase().includes(q)
        );
        if (!matchesName && !matchesCode && !matchesVehicle && !matchesPhone && !matchesTyres) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedDateFilter, customDate, selectedBay, searchTerm]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalTyres = 0;
    let totalMounting = 0;
    let totalValves = 0;
    let totalShredding = 0;
    let totalRevenue = 0;
    const tyreBreakdown: Record<string, number> = {};

    scheduleOrders.forEach(order => {
      totalRevenue += order.totalXCD || 0;
      (order.items || []).forEach(item => {
        const qty = item.quantity || 1;
        totalTyres += qty;
        if (item.includeMounting) totalMounting += qty;
        if (item.includeNewValves) totalValves += qty;
        if (item.includeShredding) totalShredding += qty;

        const label = `${item.tyre?.brand || 'Tyre'} ${item.tyre?.size || ''} (${item.tyre?.condition ? item.tyre.condition.toUpperCase() : 'USED'})`;
        tyreBreakdown[label] = (tyreBreakdown[label] || 0) + qty;
      });
    });

    return {
      orderCount: scheduleOrders.length,
      totalTyres,
      totalMounting,
      totalValves,
      totalShredding,
      totalRevenue,
      tyreBreakdown
    };
  }, [scheduleOrders]);

  // All Ready for fitting count regardless of date
  const totalAllReadyInSystem = useMemo(() => {
    return orders.filter(o => o.dispatchStatus === 'Ready for Fitting' || o.dispatchStatus === 'Scheduled').length;
  }, [orders]);

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Copy schedule text summary
  const handleCopySummary = () => {
    const dateLabel = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const text = `MAX EXECUTIVE TIRES LTD — DAILY SERVICE SCHEDULE
Date: ${dateLabel}
Maranatha Square, Pichelin, Dominica | Tel: +1 (767) 616-0155 | Tax ID: #1281761
------------------------------------------------------------------------
AGGREGATE SUMMARY (READY FOR FITTING):
Vehicles Scheduled: ${metrics.orderCount}
Total Tyres Staged: ${metrics.totalTyres} (Used - Inspected)
Mounting & Computer Balancing: ${metrics.totalMounting}
New Valves: ${metrics.totalValves}
Disposal / Shredding: ${metrics.totalShredding}
Total Estimated Value: EC$ ${metrics.totalRevenue.toFixed(2)}
------------------------------------------------------------------------
WORK ORDERS:
${scheduleOrders
  .map((order, idx) => {
    const bayInfo = getAssignedBay(order);
    const tyreList = (order.items || [])
      .map(it => `${it.quantity || 1}x ${it.tyre?.brand || 'Tyre'} ${it.tyre?.size || ''} [${(it.tyre?.condition || 'used').toUpperCase()}]`)
      .join(', ');
    return `${idx + 1}. [${order.reservationCode}] ${order.customerName} (${order.customerPhone})
   Vehicle: ${order.vehicleInfo || 'Customer Vehicle'} | Time: ${order.preferredDate || 'Today'}
   Bay: ${bayInfo.bay} | Lead: ${bayInfo.techLead}
   Tyres: ${tyreList}
   Services: Mounting (${order.items.some(i => i.includeMounting) ? 'YES' : 'NO'}), Valves (${order.items.some(i => i.includeNewValves) ? 'YES' : 'NO'}), Eco-Shred (${order.items.some(i => i.includeShredding) ? 'YES' : 'NO'})
   Payment: ${order.paymentStatus === 'Confirmed' ? 'PAID' : 'COLLECT AT SHOP'} (EC$ ${order.totalXCD.toFixed(2)})
`;
  })
  .join('\n')}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Slot #',
      'Reservation Code',
      'Customer Name',
      'Phone Number',
      'Vehicle Info',
      'Preferred Time/Slot',
      'Assigned Bay',
      'Lead Technician',
      'Tyre Details',
      'Tyre Qty',
      'Mounting Svc',
      'Valves Svc',
      'Disposal Svc',
      'Total Amount (EC$)',
      'Payment Status',
      'Dispatch Status'
    ];

    const rows = scheduleOrders.map((o, idx) => {
      const bay = getAssignedBay(o);
      const tyreDesc = (o.items || [])
        .map(i => `${i.quantity || 1}x ${i.tyre?.brand || ''} ${i.tyre?.size || ''} (${i.tyre?.condition || 'used'})`)
        .join('; ');
      const totalQty = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
      const hasMounting = (o.items || []).some(it => it.includeMounting) ? 'Yes' : 'No';
      const hasValves = (o.items || []).some(it => it.includeNewValves) ? 'Yes' : 'No';
      const hasShred = (o.items || []).some(it => it.includeShredding) ? 'Yes' : 'No';

      return [
        `Slot ${idx + 1}`,
        `"${o.reservationCode}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerPhone}"`,
        `"${(o.vehicleInfo || 'Standard').replace(/"/g, '""')}"`,
        `"${(o.preferredDate || 'Today').replace(/"/g, '""')}"`,
        `"${bay.bay}"`,
        `"${bay.techLead}"`,
        `"${tyreDesc.replace(/"/g, '""')}"`,
        totalQty,
        hasMounting,
        hasValves,
        hasShred,
        o.totalXCD.toFixed(2),
        o.paymentStatus === 'Confirmed' ? 'PAID' : 'COLLECT AT SHOP',
        o.dispatchStatus || 'Ready for Fitting'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Service_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const todayStr = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Header
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('MAX EXECUTIVE TIRES LTD — DAILY SERVICE SCHEDULE', 14, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Maranatha Square, Main Highway, Pichelin, Dominica | Tel: +1 (767) 616-0155 | Inland Revenue Tax ID: #1281761`,
      14,
      19
    );

    doc.text(
      `Date: ${todayStr} | Generated: ${new Date().toLocaleTimeString()} | Filter: Ready for Fitting Orders`,
      14,
      24
    );

    // Divider
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.line(14, 27, 283, 27);

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 30, 269, 13, 1, 1, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Scheduled Vehicles: ${metrics.orderCount}   |   Staged Tyres: ${metrics.totalTyres} (Used Inspected)   |   Mounting & Balancing: ${metrics.totalMounting}   |   Valves: ${metrics.totalValves}   |   Disposal: ${metrics.totalShredding}   |   Total Value: EC$ ${metrics.totalRevenue.toFixed(2)}`,
      18,
      38
    );

    // Table Header
    let y = 49;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 269, 7, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);

    doc.text('SLOT / TIME', 16, y + 4.5);
    doc.text('RESERVATION & CUSTOMER', 45, y + 4.5);
    doc.text('VEHICLE', 105, y + 4.5);
    doc.text('ASSIGNED BAY & TECH', 145, y + 4.5);
    doc.text('TYRES STAGED (USED)', 195, y + 4.5);
    doc.text('SERVICES', 245, y + 4.5);
    doc.text('SIGN-OFF', 270, y + 4.5);

    y += 7;

    // Table Rows
    scheduleOrders.forEach((order, idx) => {
      if (y > 185) {
        doc.addPage();
        y = 15;
      }

      const bay = getAssignedBay(order);
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 269, 14, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, y + 14, 283, y + 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`#${idx + 1}  ${order.preferredDate || 'Today'}`, 16, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(order.dispatchStatus || 'Ready for Fitting', 16, y + 9);

      // Customer
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(order.customerName, 45, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${order.reservationCode} • ${order.customerPhone}`, 45, y + 9);

      // Vehicle
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(order.vehicleInfo || 'Customer Vehicle', 105, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(order.paymentStatus === 'Confirmed' ? 'PAID ONLINE' : 'COLLECT AT SHOP', 105, y + 9);

      // Bay & Tech
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(bay.bay.split(' (')[0], 145, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(bay.techLead, 145, y + 9);

      // Tyres
      const tyreSummary = (order.items || [])
        .map(i => `${i.quantity || 1}x ${i.tyre?.brand || ''} ${i.tyre?.size || ''} [USED]`)
        .join(', ');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(doc.splitTextToSize(tyreSummary, 48), 195, y + 5);

      // Services
      const svcs = [];
      if (order.items.some(i => i.includeMounting)) svcs.push('Mount & Bal');
      if (order.items.some(i => i.includeNewValves)) svcs.push('Valves');
      if (order.items.some(i => i.includeShredding)) svcs.push('Eco-Shred');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(svcs.join(' + ') || 'Mount Only', 245, y + 6);

      // Checkbox
      doc.rect(273, y + 4, 4, 4);

      y += 14;
    });

    // Signature Footer
    if (y > 175) {
      doc.addPage();
      y = 20;
    } else {
      y += 10;
    }

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(16, y + 10, 80, y + 10);
    doc.line(110, y + 10, 174, y + 10);
    doc.line(205, y + 10, 269, y + 10);

    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Bay 1 Lead Tech Sign-Off', 16, y + 14);
    doc.text('Bay 2 Lead Tech Sign-Off', 110, y + 14);
    doc.text('Workshop Supervisor Sign-Off', 205, y + 14);

    doc.save(`Daily_Service_Schedule_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const toggleItemComplete = (id: string) => {
    setCompletedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <div
      id="daily-service-schedule-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-7xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-slate-100">
        {/* Modal Header & Controls Toolbar */}
        <div className="bg-slate-900/95 border-b border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Daily Service Schedule
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ready for Fitting ({metrics.orderCount})
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  Dominica Tax ID: #1281761
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured workshop bay schedule aggregating customer orders staged and ready for tyre fitment today in Pichelin
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Filter Toggle: Today vs All */}
            <div className="inline-flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedDateFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View only orders scheduled or marked for today"
              >
                Today's Schedule
              </button>
              <button
                type="button"
                onClick={() => setSelectedDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedDateFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View all Ready for Fitting orders currently in the workshop queue"
              >
                All Queue ({totalAllReadyInSystem})
              </button>
            </div>

            {/* Print Button */}
            <button
              id="print-daily-service-schedule-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Print official structured service schedule with shop sign-offs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Schedule</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="download-daily-service-schedule-pdf-btn"
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Download vector PDF document"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* CSV Export */}
            <button
              id="export-daily-service-schedule-csv-btn"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Export schedule to CSV / Excel spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Copy Summary */}
            <button
              id="copy-daily-service-schedule-summary-btn"
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
              title="Copy WhatsApp / Text summary of daily schedule"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Close Button */}
            <button
              id="close-daily-service-schedule-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Schedule Window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Filter & Bay Bar */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Bay Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedBay('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedBay === 'all' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Bays
            </button>
            <button
              type="button"
              onClick={() => setSelectedBay('bay1')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedBay === 'bay1' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bay 1 (Light & Sedan)
            </button>
            <button
              type="button"
              onClick={() => setSelectedBay('bay2')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedBay === 'bay2' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bay 2 (Truck & 4x4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedBay('fastlane')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedBay === 'fastlane' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Express Fast-Lane
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search vehicle, customer, tyre size..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-48 sm:w-64"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Showing <strong>{scheduleOrders.length}</strong> matching work orders
            </div>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 print:p-0 print:bg-white print:overflow-visible">
          {/* Paper Document Container */}
          <div
            id="printable-service-schedule-content"
            className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 max-w-6xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
          >
            {/* Official Shop Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-1 rounded tracking-wider uppercase">
                    MAX EXECUTIVE TIRES LTD
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Dominica Workshop Operations
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1.5 uppercase">
                  DAILY SERVICE SCHEDULE
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Maranatha Square, Main Highway, Pichelin, Commonwealth of Dominica
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct / WhatsApp: <strong>+1 (767) 616-0155</strong> • maxexecutivetires.dm@gmail.com •{' '}
                  <strong>Inland Revenue Tax ID: #1281761</strong>
                </p>
              </div>

              <div className="md:text-right border-l-2 md:border-l-0 pl-3 md:pl-0 border-slate-300">
                <div className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-1">
                  Ready for Fitting Dispatch
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Target Date:{' '}
                  <span className="text-blue-700">
                    {new Date().toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Schedule Run Time: {new Date().toLocaleTimeString()}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Queue Scope: {selectedDateFilter === 'today' ? 'Current Day Fitting Roster' : 'Complete Fitting Backlog'}
                </div>
              </div>
            </div>

            {/* Executive KPI Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-slate-50 print:border-slate-300">
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Scheduled Jobs</div>
                <div className="text-xl font-black text-slate-900">{metrics.orderCount} Vehicles</div>
                <div className="text-[10px] text-emerald-700 font-semibold">100% Staged in Bays</div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Tyres to Mount</div>
                <div className="text-xl font-black text-blue-700">{metrics.totalTyres} Tyres</div>
                <div className="text-[10px] text-slate-500">Condition: <strong>Used Inspected</strong></div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Mount & Balance</div>
                <div className="text-xl font-black text-slate-900">{metrics.totalMounting} Fitted</div>
                <div className="text-[10px] text-slate-500">Dual-Plane Dynamic</div>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Valves & Shred</div>
                <div className="text-xl font-black text-slate-900">{metrics.totalValves} V / {metrics.totalShredding} S</div>
                <div className="text-[10px] text-slate-500">Brass Valves & Eco</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Work Order Value</div>
                <div className="text-xl font-black text-emerald-700">EC$ {metrics.totalRevenue.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">US$ {(metrics.totalRevenue / 2.70).toFixed(2)}</div>
              </div>
            </div>

            {/* Empty state warning if no orders found */}
            {scheduleOrders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl my-6">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800">No "Ready for Fitting" Orders Found for Current Filter</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-4">
                  {selectedDateFilter === 'today'
                    ? 'There are no active orders matching today’s date with status "Ready for Fitting". You can toggle to view all ready orders in the backlog queue.'
                    : 'No orders match your search criteria.'}
                </p>
                {selectedDateFilter === 'today' && totalAllReadyInSystem > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter('all')}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    <span>View All {totalAllReadyInSystem} Ready for Fitting Orders in Queue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              /* Structured Timetable / Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10.5px] tracking-wider print:bg-slate-900 print:text-white">
                      <th className="p-2.5 border border-slate-700 w-24 text-center">Time / Slot</th>
                      <th className="p-2.5 border border-slate-700">Customer & Res #</th>
                      <th className="p-2.5 border border-slate-700">Vehicle Info</th>
                      <th className="p-2.5 border border-slate-700">Assigned Bay & Tech</th>
                      <th className="p-2.5 border border-slate-700">Staged Tyres (Used)</th>
                      <th className="p-2.5 border border-slate-700">Services</th>
                      <th className="p-2.5 border border-slate-700 text-right">Payment</th>
                      <th className="p-2.5 border border-slate-700 text-center w-28">QA & Sign-Off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {scheduleOrders.map((order, idx) => {
                      const bay = getAssignedBay(order);
                      const isComplete = !!completedItems[order.id];

                      return (
                        <tr
                          key={order.id}
                          className={`${
                            idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                          } hover:bg-emerald-50/40 transition print:hover:bg-transparent ${
                            isComplete ? 'opacity-70 bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Slot & Time */}
                          <td className="p-2.5 border border-slate-200 align-top text-center">
                            <div className="font-black text-slate-900 text-xs">Slot {idx + 1}</div>
                            <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                              {order.preferredDate || 'Fast Lane'}
                            </div>
                            <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                              READY
                            </span>
                          </td>

                          {/* Customer & Code */}
                          <td className="p-2.5 border border-slate-200 align-top">
                            <div className="font-bold text-slate-950 text-sm">{order.customerName}</div>
                            <div className="text-[11px] font-mono text-slate-600 font-bold flex items-center gap-1 mt-0.5">
                              <span>#{order.reservationCode}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 inline" />
                              <span>{order.customerPhone}</span>
                            </div>
                            {order.customerEmail && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {order.customerEmail}
                              </div>
                            )}
                          </td>

                          {/* Vehicle */}
                          <td className="p-2.5 border border-slate-200 align-top">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
                              <span>{order.vehicleInfo || 'Customer Vehicle'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Pichelin Bay Check: Standard Rim Hubs
                            </div>
                          </td>

                          {/* Assigned Bay */}
                          <td className="p-2.5 border border-slate-200 align-top">
                            <div className="font-black text-slate-900 text-xs">{bay.bay}</div>
                            <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-emerald-600 inline shrink-0" />
                              <span>{bay.techLead}</span>
                            </div>
                          </td>

                          {/* Tyres */}
                          <td className="p-2.5 border border-slate-200 align-top">
                            <div className="space-y-1">
                              {(order.items || []).map((item, itemIdx) => (
                                <div key={itemIdx} className="bg-slate-100/80 p-1.5 rounded border border-slate-200">
                                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                                    <span>
                                      {item.quantity || 1}x {item.tyre?.brand || 'Tyre'} {item.tyre?.size || ''}
                                    </span>
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1 rounded ml-1 uppercase">
                                      {item.tyre?.condition || 'USED'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-600">
                                    Model: {item.tyre?.modelName || 'Radial Touring'} • Tread: {item.tyre?.treadDepthMm || 7.5}mm
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Services */}
                          <td className="p-2.5 border border-slate-200 align-top text-[11px]">
                            <ul className="space-y-0.5 text-slate-700">
                              <li className="flex items-center gap-1">
                                <span className={order.items.some(i => i.includeMounting) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                  ✓
                                </span>
                                <span>Mount & Dynamic Balance</span>
                              </li>
                              <li className="flex items-center gap-1">
                                <span className={order.items.some(i => i.includeNewValves) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                  ✓
                                </span>
                                <span>High-Temp Brass Valves</span>
                              </li>
                              <li className="flex items-center gap-1">
                                <span className={order.items.some(i => i.includeShredding) ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                  ✓
                                </span>
                                <span>Disposal & Eco Shred</span>
                              </li>
                            </ul>
                          </td>

                          {/* Payment */}
                          <td className="p-2.5 border border-slate-200 align-top text-right">
                            <div className="font-black text-slate-900 text-sm">
                              EC$ {order.totalXCD.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              US$ {(order.totalXCD / 2.70).toFixed(2)}
                            </div>
                            <span
                              className={`inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                order.paymentStatus === 'Confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {order.paymentStatus === 'Confirmed' ? 'PAID ONLINE' : 'COLLECT AT SHOP'}
                            </span>
                          </td>

                          {/* QA Checklist / Technician Sign-Off */}
                          <td className="p-2.5 border border-slate-200 align-top text-center">
                            <div className="space-y-1 text-left text-[10px] text-slate-600">
                              <label className="flex items-center gap-1 cursor-pointer print:cursor-default">
                                <input
                                  type="checkbox"
                                  className="w-3 h-3 rounded border-slate-300 text-emerald-600"
                                  defaultChecked={true}
                                />
                                <span>Staged</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer print:cursor-default">
                                <input
                                  type="checkbox"
                                  className="w-3 h-3 rounded border-slate-300 text-emerald-600"
                                />
                                <span>Balanced</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer print:cursor-default">
                                <input
                                  type="checkbox"
                                  className="w-3 h-3 rounded border-slate-300 text-emerald-600"
                                />
                                <span>Torqued</span>
                              </label>
                            </div>
                            <div className="mt-1.5 pt-1 border-t border-slate-200 text-[9px] text-slate-400 font-mono">
                              Tech Init: _____
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Staged Tyre Inventory Summary Box */}
            <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Staged Tyres By Size & Model (Rack Pull List)
                </h4>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {Object.entries(metrics.tyreBreakdown).map(([tyreLabel, qty], i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-200/60">
                      <span className="text-slate-700 font-medium truncate pr-2">{tyreLabel}</span>
                      <span className="bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded text-[10px]">
                        {qty} tyres
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Workshop Bay Protocols & Safety Standards
                  </h4>
                  <ul className="text-[10.5px] text-slate-600 space-y-1">
                    <li>• <strong>Condition Guarantee:</strong> All fitted tyres are strictly inspected high-grade Used tyres.</li>
                    <li>• <strong>Bead Sealing:</strong> Clean rim flange thoroughly to prevent slow air leaks on mountain roads.</li>
                    <li>• <strong>Torque Specs:</strong> Torque all wheel lug nuts using calibrated torque wrench (80–110 ft-lbs).</li>
                    <li>• <strong>Air Pressure:</strong> Inflate to factory door-jamb placard cold PSI specifications.</li>
                  </ul>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 italic">
                  Max Executive Tires Inc. • Maranatha Square, Pichelin, Dominica • Tel: +1 (767) 616-0155
                </div>
              </div>
            </div>

            {/* Official Sign-Off Footer */}
            <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-slate-400 mb-1.5"></div>
                <div className="font-bold text-slate-900">Lead Technician (Bay 1)</div>
                <div className="text-[10px] text-slate-500">K. Emanuel / Mounting Specialist</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 mb-1.5"></div>
                <div className="font-bold text-slate-900">Lead Technician (Bay 2)</div>
                <div className="text-[10px] text-slate-500">D. Shillingford / Commercial 4x4</div>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 mb-1.5"></div>
                <div className="font-bold text-slate-900">Workshop Supervisor</div>
                <div className="text-[10px] text-slate-500">Final Inspection & Vehicle Release</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Real-time synchronization with Dominica POS & Admin Work Orders database.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300">
              Tax ID: <strong>#1281761</strong>
            </span>
            <span>•</span>
            <span className="font-mono text-slate-300">
              Tel: <strong>+1 (767) 616-0155</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
