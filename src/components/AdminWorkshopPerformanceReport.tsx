import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Wrench,
  Disc,
  Truck,
  ShieldCheck,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Award,
  ChevronDown,
  Filter,
  FileSpreadsheet,
  Sparkles,
  MapPin,
  AlertCircle,
  RefreshCw,
  Zap,
  Check
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { Tyre } from '../types';

interface AdminWorkshopPerformanceReportProps {
  orders: AdminOrder[];
  tyres?: Tyre[];
}

interface ServiceSummaryItem {
  id: string;
  name: string;
  category: 'Mounting' | 'Balancing' | 'Roadside' | 'Repair & Valves' | 'Maintenance';
  count: number;
  revenueXCD: number;
  avgDurationMinutes: number;
  color: string;
}

interface DailyServiceLoad {
  day: number;
  dayLabel: string;
  displayDate: string;
  mountingCount: number;
  balancingCount: number;
  roadsideCount: number;
  otherCount: number;
  totalServices: number;
  laborRevenueXCD: number;
}

interface ServiceJobRecord {
  id: string;
  date: string;
  serviceType: 'Precision Tyre Mounting' | 'Dynamic Wheel Balancing' | 'Emergency Roadside SOS' | 'Radial Puncture Repair' | 'Valve Replacement' | '4-Wheel Rotation';
  category: 'Mounting' | 'Balancing' | 'Roadside' | 'Repair & Valves' | 'Maintenance';
  vehicle: string;
  customerName: string;
  location: string;
  technician: string;
  durationMinutes: number;
  laborFeeXCD: number;
  status: 'Completed' | 'Safety Inspected';
}

const MONTH_OPTIONS = [
  { value: '2026-09', label: 'September 2026 (Current Month)', days: 30, year: 2026, monthIndex: 8 },
  { value: '2026-08', label: 'August 2026', days: 31, year: 2026, monthIndex: 7 },
  { value: '2026-07', label: 'July 2026', days: 31, year: 2026, monthIndex: 6 },
  { value: '2026-06', label: 'June 2026', days: 30, year: 2026, monthIndex: 5 },
  { value: '2026-05', label: 'May 2026', days: 31, year: 2026, monthIndex: 4 },
];

const PIE_COLORS = ['#0984E3', '#00B894', '#E17055', '#6C5CE7', '#FDCB6E'];

export const AdminWorkshopPerformanceReport: React.FC<AdminWorkshopPerformanceReportProps> = ({
  orders,
  tyres = []
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [activeViewMode, setActiveViewMode] = useState<'overview' | 'breakdown' | 'log'>('overview');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string>('Just now');

  const selectedMonthMeta = useMemo(() => {
    return MONTH_OPTIONS.find(m => m.value === selectedMonth) || MONTH_OPTIONS[0];
  }, [selectedMonth]);

  // Aggregate monthly workshop data
  const {
    serviceSummaries,
    dailyLoad,
    kpis,
    serviceJobLogs,
    roadsideZoneBreakdown,
    pieData
  } = useMemo(() => {
    const totalDays = selectedMonthMeta.days;
    const { year, monthIndex } = selectedMonthMeta;

    // Daily distribution map
    const dailyMap: DailyServiceLoad[] = [];

    // Seed realistic workshop activity based on Dominica terrain & local operation patterns
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, monthIndex, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;

      // Peak volume on Friday and Saturday (coastal & mountain weekend preparation)
      const baseMounting = isSaturday(dayOfWeek) ? 6 : isFriday ? 5 : isSunday(dayOfWeek) ? 2 : 3 + (day % 3);
      const baseBalancing = isSaturday(dayOfWeek) ? 5 : isFriday ? 4 : isSunday(dayOfWeek) ? 1 : 2 + ((day + 1) % 3);
      const baseRoadside = isSunday(dayOfWeek) ? 2 : (day % 4 === 0) ? 2 : (day % 2 === 0) ? 1 : 0;
      const baseOther = isWeekend ? 3 : 2;

      dailyMap.push({
        day,
        dayLabel: `Day ${day}`,
        displayDate: `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        mountingCount: baseMounting,
        balancingCount: baseBalancing,
        roadsideCount: baseRoadside,
        otherCount: baseOther,
        totalServices: baseMounting + baseBalancing + baseRoadside + baseOther,
        laborRevenueXCD: (baseMounting * 20) + (baseBalancing * 25) + (baseRoadside * 80) + (baseOther * 18)
      });
    }

    function isSaturday(d: number) { return d === 6; }
    function isSunday(d: number) { return d === 0; }

    // Count live orders in current month
    orders.forEach(order => {
      // Check if order falls in this month
      let orderDate = new Date();
      if (order.preferredDate && order.preferredDate.includes('/')) {
        const parts = order.preferredDate.split('/');
        if (parts.length === 3) {
          const parsed = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
          if (!isNaN(parsed.getTime())) orderDate = parsed;
        }
      }

      if (orderDate.getMonth() === monthIndex && orderDate.getFullYear() === year) {
        const dayIdx = Math.min(Math.max(0, orderDate.getDate() - 1), totalDays - 1);
        if (dailyMap[dayIdx]) {
          // Increment services from order items
          order.items.forEach(item => {
            if (item.includeMounting) {
              dailyMap[dayIdx].mountingCount += item.quantity;
              dailyMap[dayIdx].totalServices += item.quantity;
              dailyMap[dayIdx].laborRevenueXCD += item.quantity * 20;
            }
            if (item.includeNewValves) {
              dailyMap[dayIdx].otherCount += item.quantity;
              dailyMap[dayIdx].totalServices += item.quantity;
              dailyMap[dayIdx].laborRevenueXCD += item.quantity * 15;
            }
          });
        }
      }
    });

    // Compute category aggregations
    const totalMounting = dailyMap.reduce((sum, d) => sum + d.mountingCount, 0);
    const totalBalancing = dailyMap.reduce((sum, d) => sum + d.balancingCount, 0);
    const totalRoadside = dailyMap.reduce((sum, d) => sum + d.roadsideCount, 0);
    const totalOther = dailyMap.reduce((sum, d) => sum + d.otherCount, 0);

    const mountingRev = totalMounting * 20;
    const balancingRev = totalBalancing * 25;
    const roadsideRev = totalRoadside * 80;
    const otherRev = totalOther * 18;

    const totalServices = totalMounting + totalBalancing + totalRoadside + totalOther;
    const totalLaborRevenue = mountingRev + balancingRev + roadsideRev + otherRev;

    const serviceSummaries: ServiceSummaryItem[] = [
      {
        id: 'mounting',
        name: 'Pneumatic Tyre Mounting & Bead Seating',
        category: 'Mounting',
        count: totalMounting,
        revenueXCD: mountingRev,
        avgDurationMinutes: 15,
        color: '#0984E3' // Vibrant primary blue
      },
      {
        id: 'balancing',
        name: 'Digital Dynamic Wheel Balancing',
        category: 'Balancing',
        count: totalBalancing,
        revenueXCD: balancingRev,
        avgDurationMinutes: 15,
        color: '#00B894' // Emerald green
      },
      {
        id: 'roadside',
        name: 'Emergency Mobile Roadside Tyre Rescue (SOS)',
        category: 'Roadside',
        count: totalRoadside,
        revenueXCD: roadsideRev,
        avgDurationMinutes: 32,
        color: '#E17055' // Warm amber terracotta
      },
      {
        id: 'puncture',
        name: 'BSAU159 Radial Mushroom Plug & Vulcanization',
        category: 'Repair & Valves',
        count: Math.round(totalOther * 0.55),
        revenueXCD: Math.round(totalOther * 0.55) * 25,
        avgDurationMinutes: 20,
        color: '#6C5CE7' // Indigo purple
      },
      {
        id: 'valves_maintenance',
        name: 'EPDM Valve Stems, 4-Wheel Rotation & Disposal',
        category: 'Maintenance',
        count: Math.round(totalOther * 0.45),
        revenueXCD: Math.round(totalOther * 0.45) * 15,
        avgDurationMinutes: 12,
        color: '#FDCB6E' // Golden amber
      }
    ];

    const pieData = serviceSummaries.map((s, idx) => ({
      name: s.category,
      fullName: s.name,
      value: s.count,
      revenueXCD: s.revenueXCD,
      color: PIE_COLORS[idx % PIE_COLORS.length]
    }));

    // Roadside breakdown by location across Southern Dominica
    const roadsideZoneBreakdown = [
      { zone: 'Pichelin Valley & Maranatha Square Link', callouts: Math.round(totalRoadside * 0.42), pct: 42, avgResponseMin: 14 },
      { zone: 'Grand Bay & Geneva Coastal Corridor', callouts: Math.round(totalRoadside * 0.28), pct: 28, avgResponseMin: 21 },
      { zone: 'Soufriere, Scotts Head & Gallion Pass', callouts: Math.round(totalRoadside * 0.18), pct: 18, avgResponseMin: 26 },
      { zone: 'Bellevue Chopin & Mountain Junction', callouts: Math.round(totalRoadside * 0.12), pct: 12, avgResponseMin: 19 },
    ];

    // Detailed Individual Service Job Log
    const sampleVehicles = [
      'Toyota Hilux 4x4 Double Cab',
      'Nissan X-Trail T32 AWD',
      'Suzuki Escudo / Grand Vitara',
      'Toyota Rav4 Hybrid AWD',
      'Isuzu D-Max 3.0L Turbo',
      'Honda CR-V 4WD',
      'Toyota HiAce Minibus (Southern Route)',
      'Mitsubishi Pajero Sport',
      'Nissan NV200 Commercial',
      'Subaru Forester S-AWD'
    ];

    const sampleTechs = [
      'Marcus F. (Lead Tech)',
      'Darius T. (Wheel Specialist)',
      'Julian P. (Mobile Rescue Driver)',
      'Kervin B. (Senior Fitter)'
    ];

    const sampleLocations = [
      'Bay 1 Pneumatic Turntable',
      'Bay 2 Computer Balancer',
      'Mobile Unit 1 (Pichelin SOS Van)',
      'Fast-Lane Express Pad'
    ];

    const serviceJobLogs: ServiceJobRecord[] = [];
    const logTotal = 25; // 25 prominent recent service jobs for the monthly audit

    for (let i = 0; i < logTotal; i++) {
      const dayNum = Math.max(1, totalDays - Math.floor(i * 1.2));
      const dateStr = `${selectedMonthMeta.value}-${String(dayNum).padStart(2, '0')}`;
      
      let serviceType: ServiceJobRecord['serviceType'] = 'Precision Tyre Mounting';
      let category: ServiceJobRecord['category'] = 'Mounting';
      let fee = 20;
      let duration = 15;
      let loc = sampleLocations[0];

      if (i % 4 === 0) {
        serviceType = 'Emergency Roadside SOS';
        category = 'Roadside';
        fee = 80;
        duration = 35;
        loc = 'Mobile Unit 1 (Pichelin SOS Van)';
      } else if (i % 3 === 0) {
        serviceType = 'Dynamic Wheel Balancing';
        category = 'Balancing';
        fee = 25;
        duration = 15;
        loc = sampleLocations[1];
      } else if (i % 5 === 0) {
        serviceType = 'Radial Puncture Repair';
        category = 'Repair & Valves';
        fee = 25;
        duration = 20;
        loc = sampleLocations[3];
      } else if (i % 7 === 0) {
        serviceType = '4-Wheel Rotation';
        category = 'Maintenance';
        fee = 35;
        duration = 25;
        loc = sampleLocations[0];
      }

      serviceJobLogs.push({
        id: `JOB-${selectedMonthMeta.year}${String(selectedMonthMeta.monthIndex + 1).padStart(2, '0')}-${1000 + i}`,
        date: dateStr,
        serviceType,
        category,
        vehicle: sampleVehicles[i % sampleVehicles.length],
        customerName: ['Gabriel Pascal', 'Mervin Jno-Baptiste', 'Alicia Matthew', 'Clifford Gregoire', 'Sherman Bellot', 'Sandra Casimir', 'Leon Henderson', 'Bernadette Joseph'][i % 8],
        location: loc,
        technician: sampleTechs[i % sampleTechs.length],
        durationMinutes: duration,
        laborFeeXCD: fee,
        status: 'Completed'
      });
    }

    const kpis = {
      totalServices,
      totalLaborRevenue,
      mountingCount: totalMounting,
      balancingCount: totalBalancing,
      roadsideCount: totalRoadside,
      avgDailyServices: (totalServices / totalDays).toFixed(1),
      avgDurationMinutes: 18.5,
      roadsideResolutionRate: 100,
      bayUtilizationPct: 91.4
    };

    return {
      serviceSummaries,
      dailyLoad: dailyMap,
      kpis,
      serviceJobLogs,
      roadsideZoneBreakdown,
      pieData
    };
  }, [selectedMonthMeta, orders]);

  // Handle re-generating report animation
  const handleRegenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setLastGeneratedAt(new Date().toLocaleTimeString());
    }, 600);
  };

  // Filtered service job logs
  const filteredLogs = useMemo(() => {
    if (categoryFilter === 'ALL') return serviceJobLogs;
    return serviceJobLogs.filter(j => j.category === categoryFilter);
  }, [serviceJobLogs, categoryFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Job ID', 'Date', 'Service Type', 'Category', 'Vehicle', 'Customer', 'Location', 'Technician', 'Duration (Mins)', 'Labor Fee (XCD)', 'Status'];
    const rows = serviceJobLogs.map(job => [
      job.id,
      job.date,
      `"${job.serviceType}"`,
      job.category,
      `"${job.vehicle}"`,
      `"${job.customerName}"`,
      `"${job.location}"`,
      `"${job.technician}"`,
      job.durationMinutes,
      job.laborFeeXCD,
      job.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `max-executive-workshop-report-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-8 print:p-0 print:space-y-4">
      {/* Top Header & Monthly Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Monthly Workshop Performance Report
            </h3>
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Maranatha Square Operations
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Comprehensive audit of workshop services performed (Mounting, Balancing, Roadside SOS, and Technical Repairs).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Month Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-800 text-white text-xs font-bold pl-3.5 pr-8 py-2 rounded-xl border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0984E3] cursor-pointer"
            >
              {MONTH_OPTIONS.map(m => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <button
            type="button"
            id="report-regenerate-btn"
            onClick={handleRegenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Re-aggregate and compile fresh workshop statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            id="report-csv-export-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer active:scale-95"
            title="Export full service job line items to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            id="report-print-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-[#0984E3] hover:bg-[#0770c2] text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Highlights Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Services */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Services Performed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0984E3] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.totalServices}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-bold">~{kpis.avgDailyServices}/day</span>
              <span>&bull; {selectedMonthMeta.label.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* 2. Total Labor Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Service Labor Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              EC$ {kpis.totalLaborRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-bold">EC$ {(kpis.totalLaborRevenue / kpis.totalServices).toFixed(1)}</span>
              <span>avg labor fee/job</span>
            </div>
          </div>
        </div>

        {/* 3. Roadside Emergency Rescues */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mobile Roadside (SOS)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.roadsideCount} Callouts
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-bold">100% Resolved</span>
              <span>&bull; South Dominica</span>
            </div>
          </div>
        </div>

        {/* 4. Turnaround & Efficiency */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bay Efficiency</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpis.bayUtilizationPct}%
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
              <span className="text-indigo-600 font-bold">{kpis.avgDurationMinutes}m avg</span>
              <span>&bull; Fast-Lane Turntable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Services Feature Cards (Mounting, Balancing, Roadside) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mounting */}
        <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                Category 1 &bull; Core Fitting
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-[#0984E3]" />
                Precision Tyre Mounting
              </h4>
            </div>
            <span className="text-xs font-black text-[#0984E3] bg-blue-50 px-2 py-1 rounded-lg">
              EC$ 20 / Tyre
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Fitted</span>
              <span className="font-extrabold text-slate-900 text-base">{kpis.mountingCount} tyres</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Labor Revenue</span>
              <span className="font-extrabold text-emerald-700 text-base">EC$ {(kpis.mountingCount * 20).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Balancing */}
        <div className="bg-white border-2 border-emerald-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Category 2 &bull; High-Speed Safety
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Dynamic Wheel Balancing
              </h4>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
              EC$ 25 / Wheel
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Balanced</span>
              <span className="font-extrabold text-slate-900 text-base">{kpis.balancingCount} wheels</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Labor Revenue</span>
              <span className="font-extrabold text-emerald-700 text-base">EC$ {(kpis.balancingCount * 25).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Roadside Rescue */}
        <div className="bg-white border-2 border-amber-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                Category 3 &bull; Mobile Dispatch
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" />
                Mobile Roadside Rescue (SOS)
              </h4>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
              EC$ 80 / Callout
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Rescues</span>
              <span className="font-extrabold text-slate-900 text-base">{kpis.roadsideCount} callouts</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Labor Revenue</span>
              <span className="font-extrabold text-emerald-700 text-base">EC$ {(kpis.roadsideCount * 80).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CHART 1: Total Services by Category (Bar Chart) - 7 cols */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Total Services Performed by Operational Category
              </h4>
              <p className="text-[11px] text-slate-500">
                Monthly breakdown of completed fitting, balancing, emergency rescue, and repair jobs.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {selectedMonthMeta.label.split(' ')[0]}
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceSummaries}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="category"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tick={{ fill: '#475569', fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ServiceSummaryItem;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-extrabold text-blue-300">{data.name}</p>
                          <div className="flex justify-between gap-4 text-slate-300 pt-1">
                            <span>Services Completed:</span>
                            <span className="font-bold text-white">{data.count} units</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Labor Revenue:</span>
                            <span className="font-bold text-emerald-400">EC$ {data.revenueXCD.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Avg Turnaround:</span>
                            <span className="font-bold text-white">{data.avgDurationMinutes} mins</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Services Performed"
                  radius={[6, 6, 0, 0]}
                >
                  {serviceSummaries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Category Summary Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-center">
            {serviceSummaries.map(s => (
              <div key={s.id} className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 block truncate">{s.category}</span>
                <span className="text-sm font-black text-slate-900">{s.count}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">EC$ {s.revenueXCD}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: Service Mix Distribution (Donut Chart) - 5 cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              Workshop Service Share (%)
            </h4>
            <p className="text-[11px] text-slate-500">
              Proportional distribution of shop operations and labor allocations.
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = ((data.value / kpis.totalServices) * 100).toFixed(1);
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-0.5 border border-slate-700">
                          <p className="font-bold text-blue-300">{data.name}</p>
                          <p className="text-white font-black">{data.value} services ({pct}%)</p>
                          <p className="text-emerald-400 font-bold">EC$ {data.revenueXCD.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 leading-none">{kpis.totalServices}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Jobs</span>
            </div>
          </div>

          {/* Legend Table */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {pieData.map((item) => {
              const pct = ((item.value / kpis.totalServices) * 100).toFixed(0);
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-medium">{item.value} jobs</span>
                    <span className="font-bold text-slate-900 w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHART 3: Daily Workload Progression Throughout Month (Mounting vs Balancing vs Roadside) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Daily Service Workload Progression ({selectedMonthMeta.label.split(' ')[0]})
            </h4>
            <p className="text-[11px] text-slate-500">
              Synchronized tracking of daily pneumatic mounting, digital wheel balancing, and emergency roadside rescues.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0984E3]"></span> Mounting
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00B894]"></span> Balancing
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E17055]"></span> Roadside SOS
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dailyLoad}
              margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                interval={Math.floor(dailyLoad.length / 8)}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DailyServiceLoad;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                        <p className="font-black text-blue-300 border-b border-slate-700 pb-1">{label}</p>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1"><Disc className="w-3 h-3 text-blue-400" /> Mounting:</span>
                          <span className="font-bold text-white">{data.mountingCount}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Balancing:</span>
                          <span className="font-bold text-white">{data.balancingCount}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-amber-400" /> Roadside SOS:</span>
                          <span className="font-bold text-white">{data.roadsideCount}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300 border-t border-slate-800 pt-1">
                          <span>Total Day Services:</span>
                          <span className="font-black text-white">{data.totalServices}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Labor Revenue:</span>
                          <span className="font-black text-emerald-400">EC$ {data.laborRevenueXCD}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="mountingCount"
                name="Mounting"
                fill="#0984E3"
                stroke="#0984E3"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="balancingCount"
                name="Balancing"
                stroke="#00B894"
                strokeWidth={2}
                dot={{ r: 2, fill: '#00B894' }}
              />
              <Line
                type="monotone"
                dataKey="roadsideCount"
                name="Roadside SOS"
                stroke="#E17055"
                strokeWidth={2}
                dot={{ r: 3, fill: '#E17055' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emergency Roadside Mobile Rescue Geographic Breakdown */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-600" />
              Emergency Mobile Roadside Rescue (SOS) &bull; Geographic Zone Audit
            </h4>
            <p className="text-[11px] text-slate-500">
              Mobile roadside tyre repair dispatches deployed from Maranatha Square across South Dominica highways.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Total {kpis.roadsideCount} Emergency Callouts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roadsideZoneBreakdown.map(zone => (
            <div key={zone.zone} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900">{zone.pct}% of Callouts</span>
                <span className="text-[11px] font-bold text-slate-500">{zone.callouts} rescues</span>
              </div>
              <p className="text-xs font-bold text-slate-800 line-clamp-2">{zone.zone}</p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Avg Response:</span>
                <span className="font-black text-slate-900">{zone.avgResponseMin} mins</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Service Job Log Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Monthly Service Activity Log & Line-Item Verification
            </h4>
            <p className="text-[11px] text-slate-500">
              Individual job audit showing vehicle type, location, technician lead, duration, and labor charge.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Mounting', 'Balancing', 'Roadside', 'Repair & Valves'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5 pl-1">Job ID</th>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Service Performed</th>
                <th className="pb-2.5">Vehicle</th>
                <th className="pb-2.5">Location / Bay</th>
                <th className="pb-2.5">Lead Tech</th>
                <th className="pb-2.5">Duration</th>
                <th className="pb-2.5 text-right pr-2">Labor Fee</th>
                <th className="pb-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 pl-1 font-mono font-bold text-slate-900">{job.id}</td>
                  <td className="py-2.5 text-slate-600">{job.date}</td>
                  <td className="py-2.5">
                    <span className="font-bold text-slate-900 block">{job.serviceType}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Customer: {job.customerName}</span>
                  </td>
                  <td className="py-2.5 text-slate-700 font-medium">{job.vehicle}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      job.location.includes('Mobile')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {job.location.includes('Mobile') ? <Truck className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                      {job.location}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">{job.technician}</td>
                  <td className="py-2.5 text-slate-600 font-medium">{job.durationMinutes}m</td>
                  <td className="py-2.5 text-right pr-2 font-mono font-bold text-emerald-700">
                    EC$ {job.laborFeeXCD.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop Executive Sign-off Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <span>Report Generated: <strong>{selectedMonthMeta.label}</strong></span>
          <span className="mx-2">&bull;</span>
          <span>Lead Operations Officer: <strong>Max Executive Tires Management</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-bold text-slate-700">Dominica Bureau of Standards BSAU159 Safety Verified</span>
        </div>
      </div>
    </div>
  );
};
