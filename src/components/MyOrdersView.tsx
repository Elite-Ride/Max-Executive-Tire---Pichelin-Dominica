import React, { useState, useMemo } from 'react';
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
  AlertCircle,
  Wrench,
  Sparkles,
  Filter,
  Check,
  RotateCcw,
  FileText,
  Receipt,
  Bell,
  Mail,
  MessageSquare,
  Send,
  X,
  Trash2
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';

export interface TyreMaintenanceReminder {
  orderId: string;
  reservationCode: string;
  purchaseDate: string;
  intervalMonths: number;
  targetDate: string;
  serviceType: string;
  channel: 'email' | 'sms' | 'both';
  contact: string;
  status: 'Scheduled' | 'Sent';
}
import { jsPDF } from 'jspdf';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { CustomerOrderInvoiceModal } from './CustomerOrderInvoiceModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export type ReservationStatusKey = 'Pending' | 'Ready for Fitting' | 'Completed';

export interface StatusVisualConfig {
  key: ReservationStatusKey;
  label: string;
  badgeLabel: string;
  badgeClass: string;
  dotColor: string;
  pingColor: string;
  cardBorderLeft: string;
  cardBgGlow: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
  bannerIconBg: string;
  bannerIconColor: string;
  icon: React.ComponentType<{ className?: string }>;
  stepIndex: number; // 1 = Pending, 2 = Confirmed, 3 = Ready for Fitting, 4 = Completed
  headline: string;
  description: string;
  actionGuidance: string;
}

/**
 * Normalizes any reservation dispatchStatus string into one of the 3 primary
 * visual statuses: 'Pending', 'Ready for Fitting', or 'Completed'.
 */
export function getReservationStatusInfo(statusRaw?: string): StatusVisualConfig {
  const s = (statusRaw || 'Pending').toLowerCase().trim();

  // 1. Ready for Fitting (Fast-lane staged in Pichelin)
  if (s.includes('ready') || s.includes('fitting') || s.includes('scheduled')) {
    return {
      key: 'Ready for Fitting',
      label: 'Ready for Fitting',
      badgeLabel: 'Ready for Fitting',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30',
      dotColor: 'bg-blue-600',
      pingColor: 'bg-blue-400',
      cardBorderLeft: 'border-l-4 border-l-blue-600',
      cardBgGlow: 'bg-gradient-to-r from-blue-50/20 via-white to-white',
      bannerBg: 'bg-blue-50/90',
      bannerBorder: 'border-blue-200',
      bannerText: 'text-blue-950',
      bannerIconBg: 'bg-blue-100 text-blue-700',
      bannerIconColor: 'text-blue-600',
      icon: Wrench,
      stepIndex: 3,
      headline: 'Fast-Lane Bay Ready at Maranatha Square',
      description: 'Your tyres are inspected, balanced, and staged on our priority fitment rack in Pichelin.',
      actionGuidance: 'Drive into Maranatha Square Workshop (Mon-Sat 7:30 AM – 6:00 PM). Fast-Lane Bay is ready for your arrival!'
    };
  }

  // 2. Completed (Mounted, torqued, and dispatched/collected)
  if (s.includes('completed') || s.includes('dispatched') || s.includes('fitted') || s.includes('done')) {
    return {
      key: 'Completed',
      label: 'Completed & Fitted',
      badgeLabel: 'Completed',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30',
      dotColor: 'bg-emerald-600',
      pingColor: 'bg-emerald-400',
      cardBorderLeft: 'border-l-4 border-l-emerald-600',
      cardBgGlow: 'bg-gradient-to-r from-emerald-50/20 via-white to-white',
      bannerBg: 'bg-emerald-50/90',
      bannerBorder: 'border-emerald-200',
      bannerText: 'text-emerald-950',
      bannerIconBg: 'bg-emerald-100 text-emerald-700',
      bannerIconColor: 'text-emerald-600',
      icon: CheckCircle2,
      stepIndex: 4,
      headline: 'Fitment Completed & Factory Torqued',
      description: 'Professional pneumatic installation verified with dynamic wheel balancing and rim bead sealing.',
      actionGuidance: 'Order finalized. Covered under Max Executive 12-month manufacturer warranty & 30-day casing guarantee.'
    };
  }

  // 3. Pending (Default: Order received, undergoing workshop allocation)
  return {
    key: 'Pending',
    label: 'Pending Allocation',
    badgeLabel: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/30',
    dotColor: 'bg-amber-500',
    pingColor: 'bg-amber-400',
    cardBorderLeft: 'border-l-4 border-l-amber-500',
    cardBgGlow: 'bg-gradient-to-r from-amber-50/20 via-white to-white',
    bannerBg: 'bg-amber-50/90',
    bannerBorder: 'border-amber-200',
    bannerText: 'text-amber-950',
    bannerIconBg: 'bg-amber-100 text-amber-700',
    bannerIconColor: 'text-amber-600',
    icon: Clock,
    stepIndex: 1,
    headline: 'Order Received & Awaiting Bay Allocation',
    description: 'Tyres reserved in stock. Pichelin team is verifying rim offset and staging your vehicle in the queue.',
    actionGuidance: 'You will receive a WhatsApp/SMS alert as soon as your tyres are moved onto the fast-lane fitting rack.'
  };
}

interface MyOrdersViewProps {
  orders: AdminOrder[];
  servicePrices: Record<string, number>;
  compact?: boolean;
  onBrowseInventory?: () => void;
  onUpdateOrderStatus?: (orderId: string, status: 'Pending' | 'Ready for Fitting' | 'Completed') => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  orders,
  servicePrices,
  compact = false,
  onBrowseInventory,
  onUpdateOrderStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrders, setSearchedOrders] = useState<AdminOrder[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | ReservationStatusKey>('ALL');
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<AdminOrder | null>(null);
  const [autoPrintOrder, setAutoPrintOrder] = useState<boolean>(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<AdminOrder | null>(null);
  const [selectedThermalOrder, setSelectedThermalOrder] = useState<AdminOrder | null>(null);

  // Scheduled Tyre Maintenance Reminder state with localStorage persistence
  const [maintenanceReminders, setMaintenanceReminders] = useState<Record<string, TyreMaintenanceReminder>>(() => {
    try {
      const saved = localStorage.getItem('max_executive_maintenance_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const [activeReminderOrder, setActiveReminderOrder] = useState<AdminOrder | null>(null);
  const [reminderInterval, setReminderInterval] = useState<number>(3); // 3, 6, 12 months
  const [reminderChannel, setReminderChannel] = useState<'email' | 'sms' | 'both'>('email');
  const [reminderContact, setReminderContact] = useState<string>('');
  const [reminderNotification, setReminderNotification] = useState<string | null>(null);

  const handleOpenReminderModal = (order: AdminOrder) => {
    setActiveReminderOrder(order);
    const existing = maintenanceReminders[order.id];
    if (existing) {
      setReminderInterval(existing.intervalMonths);
      setReminderChannel(existing.channel);
      setReminderContact(existing.contact);
    } else {
      setReminderInterval(3);
      setReminderChannel('email');
      setReminderContact(order.customerPhone || '');
    }
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReminderOrder) return;

    if (!reminderContact.trim()) {
      alert('Please enter an email address or mobile phone number for your reminder notification.');
      return;
    }

    const purchaseBaseDate = activeReminderOrder.timestamp ? new Date(activeReminderOrder.timestamp) : new Date();
    const target = new Date(purchaseBaseDate);
    target.setMonth(target.getMonth() + reminderInterval);

    const formattedTarget = target.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const serviceTypes: Record<number, string> = {
      3: '3-Month Tyre Rotation & Pressure Balancing Inspection',
      6: '6-Month Computerized Dynamic Wheel Balancing & Alignment',
      12: '12-Month Comprehensive Tread Depth Analysis & Re-Mounting'
    };

    const newReminder: TyreMaintenanceReminder = {
      orderId: activeReminderOrder.id,
      reservationCode: activeReminderOrder.reservationCode,
      purchaseDate: purchaseBaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      intervalMonths: reminderInterval,
      targetDate: formattedTarget,
      serviceType: serviceTypes[reminderInterval] || 'Scheduled Tyre Checkup',
      channel: reminderChannel,
      contact: reminderContact.trim(),
      status: 'Scheduled'
    };

    const updated = { ...maintenanceReminders, [activeReminderOrder.id]: newReminder };
    setMaintenanceReminders(updated);
    try {
      localStorage.setItem('max_executive_maintenance_reminders', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setReminderNotification(`Maintenance reminder set for ${formattedTarget} via ${reminderChannel.toUpperCase()}!`);
    setTimeout(() => setReminderNotification(null), 5000);
    setActiveReminderOrder(null);
  };

  const handleDeleteReminder = (orderId: string) => {
    const updated = { ...maintenanceReminders };
    delete updated[orderId];
    setMaintenanceReminders(updated);
    try {
      localStorage.setItem('max_executive_maintenance_reminders', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setReminderNotification('Maintenance reminder cancelled.');
    setTimeout(() => setReminderNotification(null), 4000);
  };

  // Local status overrides for immediate responsive testing in UI
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, 'Pending' | 'Ready for Fitting' | 'Completed'>>({});

  const handlePrintReceipt = (order: AdminOrder) => {
    setSelectedPrintOrder(order);
    setAutoPrintOrder(true);
  };

  const handleStatusChange = (orderId: string, newStatus: 'Pending' | 'Ready for Fitting' | 'Completed') => {
    setLocalStatusOverrides(prev => ({ ...prev, [orderId]: newStatus }));
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }
  };

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
    const effectiveStatus = localStatusOverrides[order.id] || order.dispatchStatus || 'Pending';
    
    doc.setFontSize(16);
    doc.setTextColor(9, 132, 227);
    doc.text("MAX EXECUTIVE TIRES - RESERVATION RECEIPT", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Maranatha Square, Pichelin, Dominica | Tel: (767) 616-0155", 14, 26);
    
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
    doc.text(`Dispatch Status: ${effectiveStatus}`, 14, 76);
    
    let y = 86;
    doc.setFontSize(12);
    doc.setTextColor(9, 132, 227);
    doc.text("Reserved Items & Services:", 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    order.items.forEach((item, idx) => {
      const svcs = [];
      if (item.includeMounting) { svcs.push('Mounting'); }
      if (item.includeNewValves) { svcs.push('Valves'); }
      if (item.includeShredding) { svcs.push('Eco-Shredder'); }

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
    doc.text(`EC$ ${order.totalXCD}`, 170, y, { align: 'right' });
    
    doc.save(`Reservation_${order.reservationCode}.pdf`);
  };

  const baseOrders = searchedOrders !== null ? searchedOrders : orders;

  // Filter orders by the selected status filter tab
  const displayOrders = useMemo(() => {
    if (selectedStatusFilter === 'ALL') return baseOrders;
    return baseOrders.filter(ord => {
      const eff = localStatusOverrides[ord.id] || ord.dispatchStatus;
      const info = getReservationStatusInfo(eff);
      return info.key === selectedStatusFilter;
    });
  }, [baseOrders, selectedStatusFilter, localStatusOverrides]);

  // Compute status counts for the filter chips
  const statusCounts = useMemo(() => {
    const counts = { ALL: baseOrders.length, Pending: 0, 'Ready for Fitting': 0, Completed: 0 };
    baseOrders.forEach(ord => {
      const eff = localStatusOverrides[ord.id] || ord.dispatchStatus;
      const info = getReservationStatusInfo(eff);
      if (info.key === 'Pending') counts.Pending++;
      else if (info.key === 'Ready for Fitting') counts['Ready for Fitting']++;
      else if (info.key === 'Completed') counts.Completed++;
    });
    return counts;
  }, [baseOrders, localStatusOverrides]);

  return (
    <div id="my-orders-view" className={`${compact ? 'space-y-5 animate-fade-in' : 'max-w-4xl mx-auto space-y-8 animate-fade-in py-4'}`}>
      {/* Header Banner */}
      <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} text-white shadow-md relative overflow-hidden border border-slate-800`}>
        <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10 pointer-events-none">
          <ShoppingBag className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-[#0984E3]/20 border border-[#0984E3]/40 text-[#0984E3] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pichelin Workshop Live Tracker</span>
            </div>
            <span className="text-xs text-slate-400">Maranatha Square • Dominica</span>
          </div>

          <h2 className={`${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-extrabold leading-tight`}>
            Track Reservations & Dispatch Status
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Monitor real-time progress of your tyre reservations in Pichelin. Visual status indicators update as your tyres transition from <strong>Pending</strong> to <strong>Ready for Fitting</strong> and <strong>Completed</strong>.
          </p>

          {/* Visual Status Indicator Guide Legend */}
          <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status Indicator Guide:</span>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="font-bold">Pending (Awaiting Allocation)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span className="font-bold">Ready for Fitting (Fast-Lane)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="font-bold">Completed (Mounted & Torqued)</span>
            </div>
          </div>

          {/* Search Bar Form */}
          <form onSubmit={handleSearch} className="flex gap-2 pt-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-search-reservation"
                type="text"
                placeholder="Reservation Code (e.g. MTC-849201) or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 text-white border border-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3] shadow-xs"
              />
            </div>
            <button
              id="btn-search-reservation"
              type="submit"
              className="bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-xs transition shrink-0 active:scale-95"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>

      {/* Visual Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Reservations</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedStatusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {statusCounts.ALL}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatusFilter === 'Pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedStatusFilter === 'Pending' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {statusCounts.Pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Ready for Fitting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatusFilter === 'Ready for Fitting'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Ready for Fitting</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedStatusFilter === 'Ready for Fitting' ? 'bg-blue-700 text-white' : 'bg-blue-200/80 text-blue-900'
            }`}>
              {statusCounts['Ready for Fitting']}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatusFilter === 'Completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedStatusFilter === 'Completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/80 text-emerald-900'
            }`}>
              {statusCounts.Completed}
            </span>
          </button>
        </div>

        {hasSearched && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchedOrders(null);
              setHasSearched(false);
            }}
            className="text-xs font-bold text-[#0984E3] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Search</span>
          </button>
        )}
      </div>

      {/* Orders List / Results */}
      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">
              {selectedStatusFilter !== 'ALL' 
                ? `No Reservations in "${selectedStatusFilter}" Status`
                : 'No Reservations Found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasSearched 
                ? `No reservations match "${searchQuery}". Please verify your reservation code or phone number.`
                : selectedStatusFilter !== 'ALL'
                ? `There are currently no orders flagged as "${selectedStatusFilter}". Select "All Reservations" to see all orders.`
                : 'You have not placed any reservations yet. Browse our inventory to reserve tyres for fast-lane fitting in Pichelin!'}
            </p>
            {onBrowseInventory && (
              <button
                type="button"
                onClick={onBrowseInventory}
                className="inline-flex items-center gap-1.5 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Browse Tyre Inventory</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {displayOrders.map((order) => {
              const effectiveStatus = localStatusOverrides[order.id] || order.dispatchStatus || 'Pending';
              const statusInfo = getReservationStatusInfo(effectiveStatus);
              const StatusIcon = statusInfo.icon;

              return (
                <div 
                  key={order.id}
                  id={`order-card-${order.reservationCode}`}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 hover:shadow-md transition relative overflow-hidden ${statusInfo.cardBorderLeft} ${statusInfo.cardBgGlow}`}
                >
                  {/* Top Row: Reservation Code, Visual Status Indicator Pill & Print Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-black text-sm bg-slate-100 text-slate-900 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          {order.reservationCode}
                        </span>

                        {/* Visual Status Indicator Badge with Pulsing Live Beacon */}
                        <div 
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors duration-300 ${statusInfo.badgeClass}`}
                          title={`Current Dispatch Status: ${statusInfo.label}`}
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.pingColor}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusInfo.dotColor}`}></span>
                          </span>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusInfo.badgeLabel}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Placed on {order.timestamp}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">{order.customerName}</span>
                      </p>
                    </div>

                    {/* Print, Thermal Receipt, Invoice & PDF Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedThermalOrder(order)}
                        className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition active:scale-95 border border-emerald-600 cursor-pointer"
                        title="View and print compact 58mm/80mm Thermal Receipt with VAT breakdown & Tax ID"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Thermal Receipt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition active:scale-95 border border-slate-700 cursor-pointer"
                        title="View and print official Tax Invoice with business tax ID #1281761"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tax Invoice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(order)}
                        className="flex items-center gap-1.5 bg-[#0984E3] hover:bg-[#0873c4] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        title="Print clean official receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" />
                        <span>Print A4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportPDF(order)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        title="Download PDF version"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-maintenance-reminder-${order.reservationCode}`}
                        onClick={() => handleOpenReminderModal(order)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer ${
                          maintenanceReminders[order.id]
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black ring-2 ring-amber-300'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                        title="Set scheduled tyre maintenance reminder based on purchase date"
                      >
                        <Bell className={`w-3.5 h-3.5 ${maintenanceReminders[order.id] ? 'fill-slate-950 text-slate-950' : 'text-blue-600'}`} />
                        <span>{maintenanceReminders[order.id] ? 'Reminder Set' : 'Set Reminder'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Status Switcher (Allows testing and updating dispatch status in real-time) */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                        Update / Test Status:
                      </span>
                      <span className="text-[11px] text-slate-500 hidden md:inline">
                        (Simulates live workshop bay updates)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'Pending')}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          statusInfo.key === 'Pending'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                        }`}
                        title="Set status to Pending"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>Pending</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'Ready for Fitting')}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          statusInfo.key === 'Ready for Fitting'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                        }`}
                        title="Set status to Ready for Fitting"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        <span>Ready for Fitting</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'Completed')}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          statusInfo.key === 'Completed'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                        }`}
                        title="Set status to Completed"
                      >
                        <Check className="w-3 h-3 text-white" />
                        <span>Completed</span>
                      </button>
                    </div>
                  </div>

                  {/* Contextual Visual Status Banner (changes color & messaging dynamically) */}
                  <div className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors duration-300 ${statusInfo.bannerBg} ${statusInfo.bannerBorder}`}>
                    <div className={`p-2 rounded-xl shrink-0 ${statusInfo.bannerIconBg}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className={`font-black text-sm tracking-tight ${statusInfo.bannerText}`}>
                          {statusInfo.headline}
                        </strong>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/70 text-slate-800 border border-slate-200">
                          Phase: {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {statusInfo.description}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-800 pt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0984E3] shrink-0" />
                        <span>{statusInfo.actionGuidance}</span>
                      </p>
                    </div>
                  </div>

                  {/* Scheduled Tyre Maintenance Reminder Banner */}
                  {maintenanceReminders[order.id] && (
                    <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5">
                          <Bell className="w-4 h-4 fill-slate-950 text-slate-950" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">
                              Maintenance Due: {maintenanceReminders[order.id].targetDate}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                              {maintenanceReminders[order.id].intervalMonths} Mo Interval
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">
                            {maintenanceReminders[order.id].serviceType}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Alert will be sent via <span className="font-bold uppercase text-slate-700">{maintenanceReminders[order.id].channel}</span> to <span className="font-semibold text-slate-800">{maintenanceReminders[order.id].contact}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenReminderModal(order)}
                          className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 transition cursor-pointer"
                        >
                          Modify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(order.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Cancel scheduled reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Visual 4-Step Progress Stepper */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Reservation Workflow & Workshop Stages:
                      </span>
                      <span className="text-[11px] font-bold text-[#0984E3]">
                        Step {statusInfo.stepIndex} of 4
                      </span>
                    </div>

                    {(() => {
                      const stepIndex = statusInfo.stepIndex;

                      const steps = [
                        { num: 1, label: 'Pending', desc: 'Order Received' },
                        { num: 2, label: 'Confirmed', desc: 'Payment Verified' },
                        { num: 3, label: 'Ready for Fitting', desc: 'Staged in Pichelin' },
                        { num: 4, label: 'Completed', desc: 'Fitted & Torqued' }
                      ];

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {steps.map((st) => {
                            const isPassed = stepIndex >= st.num;
                            const isCurrent = stepIndex === st.num;

                            // Color coding for steps matching status:
                            let stepCardStyle = 'bg-white border-slate-200 text-slate-400';
                            let stepDotStyle = 'bg-slate-200 text-slate-600';
                            let stepStatusLabel = 'Upcoming';

                            if (isCurrent) {
                              if (st.num === 1) {
                                stepCardStyle = 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs ring-1 ring-amber-400/40';
                                stepDotStyle = 'bg-amber-500 text-white';
                                stepStatusLabel = 'Current Phase';
                              } else if (st.num === 3) {
                                stepCardStyle = 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs ring-1 ring-blue-400/40';
                                stepDotStyle = 'bg-blue-600 text-white';
                                stepStatusLabel = 'Fast-Lane Ready';
                              } else if (st.num === 4) {
                                stepCardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-1 ring-emerald-400/40';
                                stepDotStyle = 'bg-emerald-600 text-white';
                                stepStatusLabel = 'Completed';
                              } else {
                                stepCardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                                stepDotStyle = 'bg-emerald-600 text-white';
                                stepStatusLabel = 'Verified';
                              }
                            } else if (isPassed) {
                              stepCardStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-900';
                              stepDotStyle = 'bg-emerald-600 text-white';
                              stepStatusLabel = 'Complete';
                            }

                            return (
                              <div 
                                key={st.num}
                                className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all duration-300 ${stepCardStyle}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${stepDotStyle}`}>
                                    {isPassed && !isCurrent ? '✓' : st.num}
                                  </span>
                                  <span className={`text-[10px] font-bold ${
                                    isCurrent ? 'animate-pulse font-extrabold' : ''
                                  }`}>
                                    {stepStatusLabel}
                                  </span>
                                </div>
                                <div className="mt-2 space-y-0.5">
                                  <div className="font-bold text-slate-800 text-xs">{st.label}</div>
                                  <div className="text-[10px] text-slate-500">{st.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Customer & Vehicle Information */}
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
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle & Fitting Bay</span>
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
                      <div className="text-emerald-700 font-black text-sm">
                        EC$ {order.totalXCD}
                      </div>
                    </div>
                  </div>

                  {/* Reserved Tyres & Services */}
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

                  {/* Location Workshop Footer */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#0984E3]" />
                      <span>{SHOP_LOCATION_INFO.name} • {SHOP_LOCATION_INFO.address}</span>
                    </div>
                    <span className="text-slate-500 font-semibold">Direct: {SHOP_LOCATION_INFO.phonePrimary}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Printer-Friendly Receipt Modal & Print Action */}
      <ReceiptPrintModal
        isOpen={selectedPrintOrder !== null}
        onClose={() => {
          setSelectedPrintOrder(null);
          setAutoPrintOrder(false);
        }}
        order={selectedPrintOrder}
        servicePrices={servicePrices}
        autoPrint={autoPrintOrder}
      />

      {/* Printer-Friendly Official Tax Invoice Modal */}
      <CustomerOrderInvoiceModal
        isOpen={selectedInvoiceOrder !== null}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
        servicePrices={servicePrices}
      />

      {/* Narrow Thermal Receipt Modal (58mm/80mm Roll Mobile Print View) */}
      <ThermalReceiptModal
        isOpen={selectedThermalOrder !== null}
        onClose={() => setSelectedThermalOrder(null)}
        order={selectedThermalOrder}
        servicePrices={servicePrices}
      />

      {/* Interactive Tyre Maintenance Reminder Setup Modal */}
      {activeReminderOrder && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <Bell className="w-5 h-5 fill-slate-950 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-black text-base">Schedule Tyre Maintenance Reminder</h3>
                  <p className="text-xs text-slate-400">
                    Order #{activeReminderOrder.reservationCode} • {activeReminderOrder.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReminderOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReminder} className="p-6 space-y-5">
              <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200/60 text-xs text-blue-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-[#0984E3]" />
                  <span>Protect Your Tread Life on Dominica Mountain Roads</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Dominica&apos;s sharp inclines and winding turns accelerate uneven tyre wear. Automated reminders prompt you when it&apos;s time for free pressure calibration, rotation, or wheel balancing at Maranatha Square, Pichelin.
                </p>
              </div>

              {/* Maintenance Interval Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Interval:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReminderInterval(3)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      reminderInterval === 3
                        ? 'bg-amber-500/10 border-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-sm">3 Months</span>
                    <span className="text-[10px] text-slate-500 mt-1">Tyre Rotation & Pressure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReminderInterval(6)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      reminderInterval === 6
                        ? 'bg-amber-500/10 border-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-sm">6 Months</span>
                    <span className="text-[10px] text-slate-500 mt-1">Wheel Balancing & Alignment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReminderInterval(12)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      reminderInterval === 12
                        ? 'bg-amber-500/10 border-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-sm">12 Months</span>
                    <span className="text-[10px] text-slate-500 mt-1">Tread Depth Inspection</span>
                  </button>
                </div>
              </div>

              {/* Target Service Preview */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Focus</span>
                <p className="font-bold text-slate-800">
                  {reminderInterval === 3 && '3-Month Tyre Rotation & Pressure Balancing Inspection'}
                  {reminderInterval === 6 && '6-Month Computerized Dynamic Wheel Balancing & Alignment'}
                  {reminderInterval === 12 && '12-Month Comprehensive Tread Depth Analysis & Re-Mounting'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Projected target date: <span className="font-semibold text-slate-800">
                    {(() => {
                      const base = activeReminderOrder.timestamp ? new Date(activeReminderOrder.timestamp) : new Date();
                      const target = new Date(base);
                      target.setMonth(target.getMonth() + reminderInterval);
                      return target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    })()}
                  </span>
                </p>
              </div>

              {/* Notification Channel */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notification Channel:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderChannel('email')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                      reminderChannel === 'email'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReminderChannel('sms')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                      reminderChannel === 'sms'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReminderChannel('both')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                      reminderChannel === 'both'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Both</span>
                  </button>
                </div>
              </div>

              {/* Contact Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Destination Phone or Email:
                </label>
                <input
                  type="text"
                  required
                  value={reminderContact}
                  onChange={(e) => setReminderContact(e.target.value)}
                  placeholder="e.g. +1 (767) 616-0155 or customer@example.dm"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {maintenanceReminders[activeReminderOrder.id] ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(activeReminderOrder.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel Reminder</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveReminderOrder(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Maintenance Alert</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {reminderNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reminderNotification}</span>
        </div>
      )}
    </div>
  );
};
