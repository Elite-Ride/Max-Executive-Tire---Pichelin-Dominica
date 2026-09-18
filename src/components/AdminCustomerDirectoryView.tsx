import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MessageSquare,
  Car,
  ShoppingBag,
  DollarSign,
  Calendar,
  ExternalLink,
  ChevronRight,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  ArrowUpDown,
  Send,
  X,
  Award,
  Sparkles,
  Truck,
  Wrench
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicles: string[];
  orders: AdminOrder[];
  orderCount: number;
  lifetimeSpendXCD: number;
  totalTyresPurchased: number;
  lastOrderDate: string;
  hasActiveOrder: boolean;
  hasCompletedOrder: boolean;
}

interface AdminCustomerDirectoryViewProps {
  orders: AdminOrder[];
  onPrintReceipt?: (order: AdminOrder) => void;
  onSendEmailReceipt?: (order: AdminOrder) => void;
}

export const AdminCustomerDirectoryView: React.FC<AdminCustomerDirectoryViewProps> = ({
  orders,
  onPrintReceipt,
  onSendEmailReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'spend-desc' | 'orders-desc' | 'date-desc' | 'name-asc'>('spend-desc');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'repeat' | 'active'>('all');
  
  // Selected customer for Order History View modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // WhatsApp quick message modal state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    customer: CustomerProfile;
    templateType: 'ready' | 'followup' | 'promo' | 'custom';
    customMessage: string;
  } | null>(null);

  // Compile all unique customers from orders
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerProfile>();

    orders.forEach((order) => {
      // Normalize identifier key: clean phone or customer name
      const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
      const cleanName = (order.customerName || 'Walk-in Customer').trim().toLowerCase();
      const identifier = cleanPhone && cleanPhone.length >= 7 ? `phone_${cleanPhone}` : `name_${cleanName}`;

      const existing = customerMap.get(identifier);
      const vehicle = order.vehicleInfo?.trim();
      const tyresCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
      const isCompleted = order.dispatchStatus === 'Dispatched' || order.dispatchStatus === 'Completed';

      if (existing) {
        existing.orders.push(order);
        existing.orderCount += 1;
        existing.lifetimeSpendXCD += order.totalXCD || 0;
        existing.totalTyresPurchased += tyresCount;
        if (vehicle && !existing.vehicles.includes(vehicle)) {
          existing.vehicles.push(vehicle);
        }
        if (!existing.email && order.customerEmail) {
          existing.email = order.customerEmail;
        }
        // Update name if current one was a placeholder
        if ((!existing.name || existing.name === 'Walk-in Counter Customer') && order.customerName) {
          existing.name = order.customerName;
        }
        // Check active / completed status
        if (!isCompleted) existing.hasActiveOrder = true;
        if (isCompleted) existing.hasCompletedOrder = true;
      } else {
        customerMap.set(identifier, {
          id: identifier,
          name: order.customerName || 'Walk-in Customer',
          phone: order.customerPhone || 'N/A',
          email: order.customerEmail,
          vehicles: vehicle && vehicle !== 'N/A' ? [vehicle] : [],
          orders: [order],
          orderCount: 1,
          lifetimeSpendXCD: order.totalXCD || 0,
          totalTyresPurchased: tyresCount,
          lastOrderDate: order.timestamp || order.preferredDate || 'Recent',
          hasActiveOrder: !isCompleted,
          hasCompletedOrder: isCompleted
        });
      }
    });

    // Sort orders for each customer by timestamp descending
    customerMap.forEach((cust) => {
      cust.orders.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());
      if (cust.orders.length > 0) {
        cust.lastOrderDate = cust.orders[0].timestamp || cust.orders[0].preferredDate || 'Recent';
      }
    });

    return Array.from(customerMap.values());
  }, [orders]);

  // Filter & Search logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          c.vehicles.some((v) => v.toLowerCase().includes(q)) ||
          c.orders.some((o) => o.reservationCode.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        if (filterType === 'vip') return c.lifetimeSpendXCD >= 1000;
        if (filterType === 'repeat') return c.orderCount >= 2;
        if (filterType === 'active') return c.hasActiveOrder;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'spend-desc') return b.lifetimeSpendXCD - a.lifetimeSpendXCD;
        if (sortOption === 'orders-desc') return b.orderCount - a.orderCount;
        if (sortOption === 'date-desc') {
          const dateA = new Date(a.lastOrderDate).getTime() || 0;
          const dateB = new Date(b.lastOrderDate).getTime() || 0;
          return dateB - dateA;
        }
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [customers, searchQuery, sortOption, filterType]);

  // Aggregate summary metrics
  const totalSpend = useMemo(() => customers.reduce((sum, c) => sum + c.lifetimeSpendXCD, 0), [customers]);
  const averageLTV = customers.length > 0 ? totalSpend / customers.length : 0;
  const repeatCount = useMemo(() => customers.filter((c) => c.orderCount > 1).length, [customers]);
  const repeatRate = customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0;

  // Format phone for WhatsApp in Dominica (+1 767)
  const formatWhatsAppNumber = (phoneStr: string) => {
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('767') && digits.length === 10) {
      return `1${digits}`;
    }
    if (digits.length === 7) {
      return `1767${digits}`;
    }
    if (digits.startsWith('1767')) {
      return digits;
    }
    return digits;
  };

  const handleOpenWhatsAppModal = (customer: CustomerProfile) => {
    setWhatsAppModalData({
      customer,
      templateType: 'ready',
      customMessage: `Hi ${customer.name}, greetings from Max Executive Tires in Pichelin! We wanted to touch base regarding your tyre fittings and maintenance with us.`
    });
  };

  const getWhatsAppMessageText = (modalData: NonNullable<typeof whatsAppModalData>) => {
    const { customer, templateType, customMessage } = modalData;
    const latestOrder = customer.orders[0];
    const orderCode = latestOrder?.reservationCode || 'recent order';

    switch (templateType) {
      case 'ready':
        return `Hi ${customer.name}, greetings from Max Executive Tires in Maranatha Square, Pichelin! 🚗\n\nYour tyres/order #${orderCode} is staged and ready in our fitting bay. Feel free to stop by today for pneumatic mounting and wheel torque inspection.\n\nNeed directions or assistance? Let us know!`;
      case 'followup':
        return `Hello ${customer.name}! Thank you for trusting Max Executive Tires in Pichelin. 🔧\n\nFollowing your recent fitment for #${orderCode}, remember to drop by anytime for your complimentary 500-km wheel lug nut torque and pressure inspection to ensure maximum safety on Dominica's hills. Safe driving!`;
      case 'promo':
        return `Greetings ${customer.name}! As a valued client of Max Executive Tires, we are pleased to offer you preferred priority booking and special member rates on upcoming fresh Goodyear, Michelin, and Bridgestone arrivals in Pichelin. Let us know if your vehicle needs a check-up!`;
      case 'custom':
      default:
        return customMessage;
    }
  };

  const handleLaunchWhatsApp = () => {
    if (!whatsAppModalData) return;
    const phoneFormatted = formatWhatsAppNumber(whatsAppModalData.customer.phone);
    const text = getWhatsAppMessageText(whatsAppModalData);
    const url = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsAppModalData(null);
  };

  // Export Customer Directory to CSV
  const handleExportCustomersCSV = () => {
    if (filteredCustomers.length === 0) {
      alert('No customer records to export.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'Email Address',
      'Registered Vehicles',
      'Total Orders',
      'Total Tyres Purchased',
      'Lifetime Spending (EC$)',
      'Last Order Date',
      'Has Active Order',
      'VIP Status'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredCustomers.map((c) => [
      escapeCsv(c.name),
      escapeCsv(c.phone),
      escapeCsv(c.email || 'N/A'),
      escapeCsv(c.vehicles.join('; ') || 'N/A'),
      escapeCsv(c.orderCount),
      escapeCsv(c.totalTyresPurchased),
      escapeCsv(c.lifetimeSpendXCD.toFixed(2)),
      escapeCsv(c.lastOrderDate),
      escapeCsv(c.hasActiveOrder ? 'Yes' : 'No'),
      escapeCsv(c.lifetimeSpendXCD >= 1000 ? 'VIP' : 'Standard')
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Max_Executive_Customer_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Directory Size</span>
            <Users className="w-4 h-4 text-[#0984E3]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{customers.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unique client profiles</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Lifetime Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">EC$ {totalSpend.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Aggregated purchases</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Customer Spend</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">EC$ {Math.round(averageLTV).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">LTV per registered client</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Repeat Client Rate</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{repeatRate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{repeatCount} repeat customers</div>
        </div>
      </div>

      {/* Action and Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, phone, email, vehicle, or reservation code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]/30 focus:border-[#0984E3] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selector & Export CSV */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-500 uppercase">Sort:</span>
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="spend-desc">Highest Lifetime Spend</option>
                <option value="orders-desc">Most Orders</option>
                <option value="date-desc">Most Recent Order</option>
                <option value="name-asc">Name (A – Z)</option>
              </select>
            </div>

            <button
              onClick={handleExportCustomersCSV}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              title="Export filtered directory to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('repeat')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'repeat'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Repeat Clients ({repeatCount})
          </button>
          <button
            onClick={() => setFilterType('vip')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'vip'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            VIP Spenders &gt;EC$1k ({customers.filter((c) => c.lifetimeSpendXCD >= 1000).length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Active Jobs ({customers.filter((c) => c.hasActiveOrder).length})
          </button>

          <span className="ml-auto text-slate-400 text-xs font-medium">
            Showing <strong>{filteredCustomers.length}</strong> of {customers.length}
          </span>
        </div>
      </div>

      {/* Customers List Grid / Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-700">No matching customer profiles found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or filter pills to see past clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => {
            const isVip = customer.lifetimeSpendXCD >= 1000;
            const isRepeat = customer.orderCount >= 2;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                {/* Top: Customer Avatar, Name, Badges & Lifetime Spend */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                      {customer.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'CU'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                          {customer.name}
                        </h4>
                        {isVip && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <Award className="w-3 h-3 text-amber-600" /> VIP Spender
                          </span>
                        )}
                        {isRepeat && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                            <Sparkles className="w-3 h-3 text-purple-600" /> Repeat Client
                          </span>
                        )}
                        {customer.hasActiveOrder && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                            <Clock className="w-3 h-3 text-blue-600" /> Active Job
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-700">{customer.orderCount} Order{customer.orderCount === 1 ? '' : 's'}</span>
                        <span>•</span>
                        <span>{customer.totalTyresPurchased} Tyres</span>
                        <span>•</span>
                        <span className="text-slate-400">Last: {customer.lastOrderDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lifetime Spend</div>
                    <div className="text-base sm:text-lg font-black text-emerald-700">
                      EC$ {customer.lifetimeSpendXCD.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Contact Information & Vehicles */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-bold text-slate-800 hover:text-[#0984E3] hover:underline"
                      >
                        {customer.phone}
                      </a>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-slate-700 hover:text-[#0984E3] hover:underline truncate max-w-[200px]"
                        >
                          {customer.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {customer.vehicles.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-600 pt-1 border-t border-slate-200/50">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {customer.vehicles.map((v, i) => (
                          <span
                            key={i}
                            className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-medium"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Actions (WhatsApp, Order History, Direct Call) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* WhatsApp Quick Message Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppModal(customer)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      title="Send instant WhatsApp message to customer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Direct Call */}
                    <a
                      href={`tel:${customer.phone}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition"
                      title="Direct Call"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>Call</span>
                    </a>

                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}?subject=${encodeURIComponent(
                          'Max Executive Tires Pichelin — Tyre Fitting & Services'
                        )}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition"
                        title="Send Email"
                      >
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>

                  {/* View Order History Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(customer)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0984E3] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition cursor-pointer ml-auto"
                  >
                    <span>Order History ({customer.orderCount})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CUSTOMER ORDER HISTORY VIEW (DRAWER / MODAL)          */}
      {/* ============================================================ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black">{selectedCustomer.name}</h3>
                  <span className="bg-blue-600/60 border border-blue-400/50 text-blue-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Customer History Dossier
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-400" /> {selectedCustomer.phone}
                  </span>
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-blue-400" /> {selectedCustomer.email}
                    </span>
                  )}
                  {selectedCustomer.vehicles.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-amber-400" /> {selectedCustomer.vehicles.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifetime Summary Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Total Lifetime Spending</div>
                <div className="text-base font-black text-emerald-700 mt-0.5">
                  EC$ {selectedCustomer.lifetimeSpendXCD.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Completed Purchases</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {selectedCustomer.orderCount} Order{selectedCustomer.orderCount === 1 ? '' : 's'}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Total Tyres Mounted</div>
                <div className="text-base font-black text-blue-700 mt-0.5">
                  {selectedCustomer.totalTyresPurchased} Tyres
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] font-bold uppercase">Avg Order Value</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  EC$ {Math.round(selectedCustomer.lifetimeSpendXCD / selectedCustomer.orderCount).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Orders Chronological List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Purchase History Chronology ({selectedCustomer.orders.length} Records)
              </h4>

              {selectedCustomer.orders.map((order, idx) => {
                const isPaid = order.paymentStatus === 'Confirmed';
                const isDone = order.dispatchStatus === 'Dispatched' || order.dispatchStatus === 'Completed';

                return (
                  <div
                    key={order.id || idx}
                    className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-slate-300 transition space-y-3"
                  >
                    {/* Top Row: Code, Status badges, Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-blue-50 text-[#0984E3] border border-blue-200 px-2.5 py-0.5 rounded-md">
                          #{order.reservationCode}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {order.dispatchStatus || 'Pending'}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isPaid ? 'Payment Confirmed' : 'Payment Pending'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {order.paymentMethod}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        {order.timestamp || order.preferredDate}
                      </div>
                    </div>

                    {/* Items Breakdown */}
                    <div className="space-y-1.5 text-xs text-slate-800">
                      {order.items.map((it, itIdx) => (
                        <div
                          key={itIdx}
                          className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1 last:border-0"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{it.quantity}x</span>{' '}
                            <span>
                              {it.tyre?.brand} {it.tyre?.modelName} ({it.tyre?.size || 'Standard'}) [
                              {it.tyre?.condition || 'New'}]
                            </span>
                            {it.includeMounting && (
                              <span className="ml-1.5 text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                +Mounting
                              </span>
                            )}
                            {it.includeNewValves && (
                              <span className="ml-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                +Valves
                              </span>
                            )}
                            {it.includeShredding && (
                              <span className="ml-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                                +Eco Disposal
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">
                            EC$ {(it.tyre?.priceXCD || 0) * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Price Adjustments if any */}
                    {order.priceAdjustments && order.priceAdjustments.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-900 space-y-1">
                        <span className="font-bold text-[10px] uppercase text-amber-700 block">Adjustments:</span>
                        {order.priceAdjustments.map((a, i) => (
                          <div key={i} className="flex justify-between text-[11px]">
                            <span>{a.reason}</span>
                            <span className="font-bold">
                              {a.type === 'refund' ? '-' : '+'}EC$ {a.amountXCD}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom Row: Total & Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
                      <div className="text-xs text-slate-600">
                        Vehicle: <strong className="text-slate-900">{order.vehicleInfo || 'Standard'}</strong>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm font-black text-slate-900">
                          Total: <span className="text-emerald-700">EC$ {order.totalXCD.toLocaleString()}</span>
                        </div>

                        {onPrintReceipt && (
                          <button
                            type="button"
                            onClick={() => onPrintReceipt(order)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg transition"
                          >
                            <Printer className="w-3 h-3 text-slate-600" />
                            <span>Print Receipt</span>
                          </button>
                        )}

                        {onSendEmailReceipt && (
                          <button
                            type="button"
                            onClick={() => onSendEmailReceipt(order)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition"
                          >
                            <Mail className="w-3 h-3 text-blue-600" />
                            <span>Email Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleOpenWhatsAppModal(selectedCustomer)}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: WHATSAPP QUICK MESSAGE COMPOSER                       */}
      {/* ============================================================ */}
      {whatsAppModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Message via WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    To: {whatsAppModalData.customer.name} ({whatsAppModalData.customer.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Choose Message Template:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppModalData({ ...whatsAppModalData, templateType: 'ready' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition font-semibold ${
                    whatsAppModalData.templateType === 'ready'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  🚗 Order Ready in Bay
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppModalData({ ...whatsAppModalData, templateType: 'followup' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition font-semibold ${
                    whatsAppModalData.templateType === 'followup'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  🔧 500km Torque Check
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppModalData({ ...whatsAppModalData, templateType: 'promo' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition font-semibold ${
                    whatsAppModalData.templateType === 'promo'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ⭐ VIP Seasonal Update
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWhatsAppModalData({ ...whatsAppModalData, templateType: 'custom' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition font-semibold ${
                    whatsAppModalData.templateType === 'custom'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ✏️ Custom Text
                </button>
              </div>
            </div>

            {/* Message Preview / Custom text area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Message Preview:
              </label>
              {whatsAppModalData.templateType === 'custom' ? (
                <textarea
                  rows={4}
                  value={whatsAppModalData.customMessage}
                  onChange={(e) =>
                    setWhatsAppModalData({
                      ...whatsAppModalData,
                      customMessage: e.target.value
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-sans"
                  placeholder="Type your WhatsApp message to the customer..."
                />
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 font-sans whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                  {getWhatsAppMessageText(whatsAppModalData)}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Target WhatsApp Destination: <strong>+{formatWhatsAppNumber(whatsAppModalData.customer.phone)}</strong> (Dominica +1 767)
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsAppModalData(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
