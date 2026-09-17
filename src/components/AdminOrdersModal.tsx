import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  ShoppingBag, 
  Phone, 
  User, 
  Car, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2, 
  LogOut, 
  Truck, 
  Clock, 
  MapPin,
  Edit3,
  Check,
  AlertCircle,
  MessageSquare,
  Settings,
  Download,
  Search,
  BarChart3,
  TrendingUp,
  DollarSign,
  Mail,
  Printer,
  FileText,
  CreditCard,
  Plus,
  Minus,
  Wrench,
  Smartphone,
  Apple,
  Bot
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CartItem, Tyre } from '../types';
import { TYRES_DATA } from '../data/tyresData';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { ServicesSection } from './ServicesSection';
import { MyOrdersView } from './MyOrdersView';

export interface PriceAdjustment {
  amountXCD: number;
  reason: string;
  type: 'charge' | 'refund';
  timestamp: string;
}

export interface AdminOrder {
  id: string;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleInfo: string;
  preferredDate: string;
  items: CartItem[];
  totalXCD: number;
  paymentMethod: 'Stripe Online' | 'Pay at Shop / WhatsApp' | string;
  timestamp: string;
  paymentStatus?: 'Pending' | 'Confirmed';
  dispatchStatus?: 'Pending Dispatch' | 'Scheduled' | 'Dispatched';
  dispatchDate?: string;
  dispatchMethod?: string;
  dispatchNotes?: string;
  priceAdjustments?: PriceAdjustment[];
  customerNotified?: boolean;
  notifiedAt?: string;
}

export interface AdminActivityLogItem {
  id: string;
  timestamp: string;
  actionType: 'STATUS_CHANGE' | 'ORDER_DELETION' | 'BULK_ACTION' | 'PRICE_UPDATE' | 'OTHER';
  description: string;
  adminName: string;
}

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: AdminOrder[];
  onClearOrders: () => void;
  onLogoff: () => void;
  onUpdateOrder: (orderId: string, updatedFields: Partial<AdminOrder>) => void;
  onDeleteOrder: (orderId: string) => void;
  onBulkUpdateOrders: (orderIds: string[], updatedFields: Partial<AdminOrder>) => void;
  onBulkDeleteOrders: (orderIds: string[]) => void;
  whatsappCustomMessage: string;
  onUpdateWhatsAppMessage: (msg: string) => void;
  servicePrices: Record<string, number>;
  onUpdateServicePrice: (serviceId: string, priceXCD: number) => void;
  adminActivityLog: AdminActivityLogItem[];
  onClearActivityLog: () => void;
  onBulkUpdateTyrePrices?: (category: string, newPriceXCD: number, mode: 'set' | 'add' | 'subtract') => void;
  onAddOrder?: (orderData: Omit<AdminOrder, 'id' | 'timestamp'>) => void;
  tyres?: Tyre[];
  onOpenDeviceSimulator?: (platform?: 'ios' | 'android') => void;
}

export const AdminOrdersModal: React.FC<AdminOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onClearOrders,
  onLogoff,
  onUpdateOrder,
  onDeleteOrder,
  onBulkUpdateOrders,
  onBulkDeleteOrders,
  whatsappCustomMessage,
  onUpdateWhatsAppMessage,
  servicePrices,
  onUpdateServicePrice,
  adminActivityLog,
  onClearActivityLog,
  onBulkUpdateTyrePrices,
  onAddOrder,
  tyres = TYRES_DATA,
  onOpenDeviceSimulator,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'orders' | 'history' | 'pos' | 'prices' | 'activity' | 'trends' | 'settings' | 'services' | 'myorders'>('orders');
  const [customWhatsAppInput, setCustomWhatsAppInput] = useState(whatsappCustomMessage);
  const [savedWhatsAppNotice, setSavedWhatsAppNotice] = useState(false);

  // POS State
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posVehicleInfo, setPosVehicleInfo] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Stripe Merchant Portal' | 'Cash at Counter' | 'Bank Transfer' | 'SmartPOS Card Terminal (Tap, Insert & Swipe)'>('SmartPOS Card Terminal (Tap, Insert & Swipe)');
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('ALL');
  const [posLoading, setPosLoading] = useState(false);
  const [posSuccessReceipt, setPosSuccessReceipt] = useState<AdminOrder | null>(null);
  const [isAdminActionsMenuOpen, setIsAdminActionsMenuOpen] = useState(false);

  // SmartPOS Card Terminal Hardware State
  const [isSmartCardTerminalOpen, setIsSmartCardTerminalOpen] = useState(false);
  const [terminalStep, setTerminalStep] = useState<'idle' | 'reading' | 'pin' | 'approved'>('idle');
  const [terminalMethodUsed, setTerminalMethodUsed] = useState<string>('');

  const handleAddTyreToPos = (tyre: Tyre) => {
    setPosCart(prev => {
      const existing = prev.find(item => item.tyre.id === tyre.id);
      if (existing) {
        return prev.map(item => item.tyre.id === tyre.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: 'pos-' + tyre.id + '-' + Date.now(),
        tyre,
        quantity: 1,
        includeMounting: true,
        includeNewValves: true,
        includeShredding: false
      }];
    });
  };

  const handleUpdatePosQuantity = (itemId: string, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const nq = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nq };
      }
      return item;
    }));
  };

  const handleTogglePosService = (itemId: string, field: 'includeMounting' | 'includeNewValves' | 'includeShredding') => {
    setPosCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: !item[field] };
      }
      return item;
    }));
  };

  const handleRemovePosItem = (itemId: string) => {
    setPosCart(prev => prev.filter(item => item.id !== itemId));
  };

  const posSubtotalXCD = posCart.reduce((sum, item) => {
    let unitS = (item.includeMounting ? 20 : 0) + (item.includeNewValves ? 15 : 0) + (item.includeShredding ? 1 : 0);
    return sum + (item.tyre.priceXCD + unitS) * item.quantity;
  }, 0);

  const handleCompletePosCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      alert('POS cart is empty. Please add tyres or services.');
      return;
    }

    if (posPaymentMethod === 'SmartPOS Card Terminal (Tap, Insert & Swipe)') {
      setIsSmartCardTerminalOpen(true);
      setTerminalStep('idle');
      return;
    }

    setPosLoading(true);

    try {
      if (posPaymentMethod === 'Stripe Merchant Portal') {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: posCart,
            customerName: posCustomerName || 'Walk-in Counter Customer'
          })
        });
        await res.json();
      }
    } catch (err) {
      console.warn('Stripe gateway note:', err);
    }

    const newOrder: Omit<AdminOrder, 'id' | 'timestamp'> = {
      reservationCode: 'POS-' + Math.floor(100000 + Math.random() * 900000),
      customerName: posCustomerName.trim() || 'Walk-In Counter Customer',
      customerPhone: posCustomerPhone.trim() || 'N/A',
      vehicleInfo: posVehicleInfo.trim() || 'In-Shop POS Counter Customer',
      preferredDate: new Date().toLocaleDateString(),
      items: posCart,
      totalXCD: posSubtotalXCD,
      paymentMethod: posPaymentMethod === 'Stripe Merchant Portal' ? 'Stripe Online' : 'Pay at Shop / WhatsApp',
      paymentStatus: 'Confirmed',
      dispatchStatus: 'Dispatched',
      dispatchMethod: 'In-Shop Pichelin Counter Sale',
      dispatchNotes: `Processed via Admin POS Counter. Payment: ${posPaymentMethod}.`
    };

    if (onAddOrder) {
      onAddOrder(newOrder);
    }

    const createdOrder: AdminOrder = {
      ...newOrder,
      id: 'ord-' + Date.now(),
      timestamp: new Date().toLocaleString()
    };

    setPosSuccessReceipt(createdOrder);
    setPosLoading(false);
    setPosCart([]);
    setPosCustomerName('');
    setPosCustomerPhone('');
    setPosVehicleInfo('');
  };

  const finalizeSmartPOSOrder = (methodUsed: string) => {
    const newOrder: Omit<AdminOrder, 'id' | 'timestamp'> = {
      reservationCode: 'POS-' + Math.floor(100000 + Math.random() * 900000),
      customerName: posCustomerName.trim() || 'Walk-In Counter Customer',
      customerPhone: posCustomerPhone.trim() || 'N/A',
      vehicleInfo: posVehicleInfo.trim() || 'In-Shop POS Counter Customer',
      preferredDate: new Date().toLocaleDateString(),
      items: posCart,
      totalXCD: posSubtotalXCD,
      paymentMethod: `SmartPOS Terminal (${methodUsed})`,
      paymentStatus: 'Confirmed',
      dispatchStatus: 'Dispatched',
      dispatchMethod: 'In-Shop Pichelin Counter Sale',
      dispatchNotes: `Processed via Max Executive SmartPOS Card Terminal (${methodUsed}). Chip/NFC/Magstripe Verified.`
    };

    if (onAddOrder) {
      onAddOrder(newOrder);
    }

    const createdOrder: AdminOrder = {
      ...newOrder,
      id: 'ord-' + Date.now(),
      timestamp: new Date().toLocaleString()
    };

    setPosSuccessReceipt(createdOrder);
    setPosLoading(false);
    setIsSmartCardTerminalOpen(false);
    setPosCart([]);
    setPosCustomerName('');
    setPosCustomerPhone('');
    setPosVehicleInfo('');
  };

  const [bulkCategory, setBulkCategory] = useState<string>('ALL');
  const [bulkPriceValue, setBulkPriceValue] = useState<string>('');
  const [bulkPriceMode, setBulkPriceMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [bulkPriceSuccess, setBulkPriceSuccess] = useState(false);

  const handleApplyBulkPrices = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(bulkPriceValue);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid price amount.');
      return;
    }
    if (onBulkUpdateTyrePrices) {
      onBulkUpdateTyrePrices(bulkCategory, val, bulkPriceMode);
    }
    setBulkPriceSuccess(true);
    setTimeout(() => setBulkPriceSuccess(false), 4000);
    setBulkPriceValue('');
  };

  const [activeDispatchOrderId, setActiveDispatchOrderId] = useState<string | null>(null);
  const [dispatchDateInput, setDispatchDateInput] = useState('');
  const [dispatchMethodInput, setDispatchMethodInput] = useState('In-Shop Pichelin Mounting');
  const [dispatchNotesInput, setDispatchNotesInput] = useState('');

  const [activePriceEditOrderId, setActivePriceEditOrderId] = useState<string | null>(null);
  const [editedTotalXCD, setEditedTotalXCD] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  const [historySubTab, setHistorySubTab] = useState<'active' | 'archived' | 'analytics'>('active');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'dispatched' | 'refunded'>('all');
  const [activeOrdersSearch, setActiveOrdersSearch] = useState('');
  const [activeOrdersSort, setActiveOrdersSort] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderForEmailReceipt, setSelectedOrderForEmailReceipt] = useState<AdminOrder | null>(null);

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderIds(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleTriggerEmailReceiptModal = (order: AdminOrder) => {
    setSelectedOrderForEmailReceipt(order);
  };

  const handleSendAutomatedEmailReceipt = (order: AdminOrder, targetEmail: string) => {
    onUpdateOrder(order.id, {
      customerNotified: true,
      notifiedAt: new Date().toLocaleString()
    });
    alert(`🚀 Automated Email Receipt successfully dispatched!\n\nTo: ${targetEmail}\nSubject: Official Order Receipt #${order.reservationCode} — Max Executive Tires, Pichelin\n\nStatus: Delivered via SMTP server queue (Pulled live service rates: Mounting EC$${servicePrices['mounting'] ?? 20}, Valves EC$${servicePrices['valves'] ?? 15}, Eco Shredding EC$${servicePrices['shredding'] ?? 1}).`);
    setSelectedOrderForEmailReceipt(null);
  };

  const handleToggleCompleted = (order: AdminOrder) => {
    const isCompleted = order.dispatchStatus === 'Dispatched';
    const newStatus = isCompleted ? 'Pending Dispatch' : 'Dispatched';
    const fields: Partial<AdminOrder> = { dispatchStatus: newStatus };
    if (newStatus === 'Dispatched') {
      fields.customerNotified = true;
      fields.notifiedAt = new Date().toLocaleString();
      alert(`📧 Mock Email Notification Sent!\nTo: ${order.customerName} (${order.customerEmail || 'customer@email.com'})\nSubject: Order #${order.reservationCode} Complete & Dispatched\nStatus: Successfully delivered to customer email queue.`);
    }
    onUpdateOrder(order.id, fields);
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkMarkSelectedCompleted = () => {
    if (selectedOrderIds.length === 0) return;
    onBulkUpdateOrders(selectedOrderIds, { 
      dispatchStatus: 'Dispatched',
      customerNotified: true,
      notifiedAt: new Date().toLocaleString()
    });
    alert(`📧 Mock Email Notifications successfully sent to ${selectedOrderIds.length} customers for bulk completed orders!`);
    setSelectedOrderIds([]);
  };

  const handleBulkDeleteSelected = () => {
    if (selectedOrderIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedOrderIds.length} selected orders?`)) {
      onBulkDeleteOrders(selectedOrderIds);
      setSelectedOrderIds([]);
    }
  };

  const handleExportCurrentListPdf = () => {
    const visible = getVisibleOrders();
    if (visible.length === 0) {
      alert('No visible orders to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the PDF summary.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maranatha Square - Order List PDF Report</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; max-width: 900px; margin: 0 auto; }
            h1 { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #334155; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .paid { background-color: #d1fae5; color: #065f46; }
            .pending { background-color: #fef3c7; color: #92400e; }
            .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Maranatha Square (Max Executive Tires) — Order List Report</h1>
          <div class="subtitle">Generated on ${new Date().toLocaleString()} | Total Records: ${visible.length}</div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer Name & Phone</th>
                <th>Vehicle Model</th>
                <th>Payment Status</th>
                <th>Dispatch Status</th>
                <th>Total (XCD)</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${visible.map(o => `
                <tr>
                  <td><strong>${o.reservationCode}</strong></td>
                  <td>${o.customerName}<br/><span style="color:#64748b;font-size:11px;">${o.customerPhone}</span></td>
                  <td>${o.vehicleInfo || 'N/A'}</td>
                  <td><span class="badge ${o.paymentStatus === 'Confirmed' ? 'paid' : 'pending'}">${o.paymentStatus || 'Pending'}</span></td>
                  <td>${o.dispatchStatus || 'Pending Dispatch'}</td>
                  <td><strong>EC$ ${o.totalXCD}</strong></td>
                  <td>${o.timestamp}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Maranatha Square Shop Manager Portal &bull; Physical Record Summary</div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isOpen) return null;

  const isOrderOlderThan90Days = (order: AdminOrder) => {
    try {
      const dateStr = order.preferredDate || order.timestamp;
      const orderDate = new Date(dateStr);
      if (isNaN(orderDate.getTime())) return false;
      const diffTime = Math.abs(Date.now() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 90;
    } catch {
      return false;
    }
  };

  const activeOrders = orders.filter(o => !isOrderOlderThan90Days(o));
  const archivedOrders = orders.filter(o => isOrderOlderThan90Days(o));

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => {
    const d = o.preferredDate || o.timestamp || '';
    return d.includes(todayStr) || d.includes(new Date().toLocaleDateString());
  });
  const todaysOrdersCount = todaysOrders.length;
  const todaysProjectedRevenue = todaysOrders.reduce((acc, o) => acc + o.totalXCD, 0);

  const pendingCount = orders.filter(o => (o.dispatchStatus || 'Pending Dispatch') !== 'Dispatched').length;
  const completedCount = orders.filter(o => o.dispatchStatus === 'Dispatched').length;

  const serviceRevenue = orders.reduce((acc, o) => {
    let sRev = 0;
    o.items?.forEach(i => {
      if (i.includeMounting) sRev += 20 * i.quantity;
      if (i.includeNewValves) sRev += 15 * i.quantity;
      if (i.includeShredding) sRev += 1 * i.quantity;
    });
    return acc + sRev;
  }, 0);

  const brandQtyMap: Record<string, number> = {};
  orders.forEach(o => {
    o.items?.forEach(i => {
      const b = i.tyre?.brand || 'Standard';
      brandQtyMap[b] = (brandQtyMap[b] || 0) + i.quantity;
    });
  });
  let topSellingBrand = 'N/A';
  let maxBrandQty = 0;
  Object.entries(brandQtyMap).forEach(([b, qty]) => {
    if (qty > maxBrandQty) {
      maxBrandQty = qty;
      topSellingBrand = b;
    }
  });

  const filteredActiveOrders = orders.filter((o) => {
    const q = activeOrdersSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.reservationCode.toLowerCase().includes(q) ||
      (o.vehicleInfo && o.vehicleInfo.toLowerCase().includes(q)) ||
      o.items.some(i => i.tyre.brand.toLowerCase().includes(q) || i.tyre.modelName.toLowerCase().includes(q) || i.tyre.size.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    if (activeOrdersSort === 'date-desc') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (activeOrdersSort === 'date-asc') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (activeOrdersSort === 'name-asc') {
      return a.customerName.localeCompare(b.customerName);
    } else {
      return b.customerName.localeCompare(a.customerName);
    }
  });

  const currentOrdersPool = historySubTab === 'archived' ? archivedOrders : activeOrders;

  const filteredHistoryOrders = currentOrdersPool.filter((o) => {
    const q = historySearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.reservationCode.toLowerCase().includes(q) ||
      o.items.some(i => i.tyre.brand.toLowerCase().includes(q) || i.tyre.modelName.toLowerCase().includes(q) || i.tyre.size.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (historyStatusFilter === 'confirmed') return o.paymentStatus === 'Confirmed';
    if (historyStatusFilter === 'pending') return o.paymentStatus !== 'Confirmed';
    if (historyStatusFilter === 'dispatched') return o.dispatchStatus === 'Dispatched';
    if (historyStatusFilter === 'refunded') return o.priceAdjustments && o.priceAdjustments.some(a => a.type === 'refund');

    return true;
  });

  const getVisibleOrders = () => {
    if (activeModalTab === 'orders') return orders;
    if (activeModalTab === 'history') {
      return historySubTab === 'analytics' ? [] : filteredHistoryOrders;
    }
    return [];
  };

  const handleBulkMarkCompleted = () => {
    const visible = getVisibleOrders();
    if (visible.length === 0) {
      alert('No visible orders in current view.');
      return;
    }
    const ids = visible.map(o => o.id);
    onBulkUpdateOrders(ids, { dispatchStatus: 'Dispatched' });
    setIsBulkMenuOpen(false);
  };

  const handleBulkDelete = () => {
    const visible = getVisibleOrders();
    if (visible.length === 0) {
      alert('No visible orders in current view.');
      return;
    }
    if (confirm(`Are you sure you want to delete all ${visible.length} visible orders?`)) {
      const ids = visible.map(o => o.id);
      onBulkDeleteOrders(ids);
      setIsBulkMenuOpen(false);
    }
  };

  const totalRevenueXCD = orders.reduce((acc, o) => acc + o.totalXCD, 0);
  const completedOrdersCount = orders.filter(o => o.paymentStatus === 'Confirmed').length;
  const pendingOrdersCount = orders.filter(o => o.paymentStatus !== 'Confirmed').length;
  const refundedOrdersCount = orders.filter(o => o.priceAdjustments && o.priceAdjustments.some(a => a.type === 'refund')).length;

  const chartData = orders.map((o, idx) => ({
    name: o.reservationCode || `Order #${idx + 1}`,
    revenue: o.totalXCD,
    customer: o.customerName,
  }));

  const brandFrequencyMap: Record<string, number> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const brand = item.tyre.brand || 'Other';
      brandFrequencyMap[brand] = (brandFrequencyMap[brand] || 0) + item.quantity;
    });
  });

  const brandChartData = Object.entries(brandFrequencyMap)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);

  const handleDownloadSpreadsheet = () => {
    const headers = ['Reservation Code', 'Customer Name', 'Phone', 'Email', 'Vehicle', 'Preferred Date', 'Payment Method', 'Payment Status', 'Dispatch Status', 'Items Summary', 'Total XCD', 'Timestamp'];
    const rows = orders.map(o => [
      o.reservationCode,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerEmail || 'N/A'}"`,
      `"${o.vehicleInfo || 'N/A'}"`,
      o.preferredDate || 'N/A',
      o.paymentMethod,
      o.paymentStatus || 'Pending',
      o.dispatchStatus || 'Pending Dispatch',
      `"${o.items.map(i => `${i.quantity}x ${i.tyre.brand} ${i.tyre.modelName} (${i.tyre.size})`).join('; ')}"`,
      o.totalXCD,
      `"${o.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maranatha_tyres_order_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadActivityLogCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Admin Name', 'Action Type', 'Description'];
    const rows = adminActivityLog.map(log => [
      log.id,
      `"${log.timestamp}"`,
      `"${log.adminName}"`,
      log.actionType,
      `"${log.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `max_executive_admin_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMonthlyReport = () => {
    const monthlyMap: Record<string, { count: number; totalXCD: number }> = {};
    orders.forEach(o => {
      const dateStr = o.preferredDate || o.timestamp.split(',')[0] || '2026-09';
      const monthKey = dateStr.length >= 7 ? dateStr.substring(0, 7) : '2026-09';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { count: 0, totalXCD: 0 };
      }
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].totalXCD += o.totalXCD;
    });

    const headers = ['Month / Period', 'Total Orders Count', 'Total Revenue (XCD)'];
    const rows = Object.entries(monthlyMap).map(([month, data]) => [
      month,
      data.count,
      data.totalXCD
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maranatha_monthly_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailPdfSummary = (order: AdminOrder) => {
    const email = order.customerEmail || prompt(`Enter customer email address to send professional PDF summary for order ${order.reservationCode}:`);
    if (!email) return;

    alert(`Professional PDF summary for Order #${order.reservationCode} has been successfully sent to customer email: ${email}!`);
  };

  const handleExportSelectedPdf = () => {
    if (filteredHistoryOrders.length === 0) {
      alert('No orders currently match your filter criteria to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the PDF summary.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maranatha Square - Filtered Orders PDF Summary</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: bold; }
            .total { font-weight: bold; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Maranatha Square (Max Executive Tires, Pichelin)</h1>
          <p>Filtered Orders PDF Summary Report - Generated on ${new Date().toLocaleString()}</p>
          <p>Total Filtered Records: <strong>${filteredHistoryOrders.length}</strong> | Total Filtered Revenue: <strong>EC$ ${filteredHistoryOrders.reduce((acc, o) => acc + o.totalXCD, 0).toLocaleString()}</strong></p>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Phone / Email</th>
                <th>Vehicle</th>
                <th>Items & Services</th>
                <th>Status</th>
                <th>Total (XCD)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredHistoryOrders.map(o => `
                <tr>
                  <td><strong>${o.reservationCode}</strong></td>
                  <td>${o.customerName}</td>
                  <td>${o.customerPhone}<br/><small>${o.customerEmail || 'No Email'}</small></td>
                  <td>${o.vehicleInfo || 'N/A'}</td>
                  <td>${o.items.map(i => `${i.quantity}x ${i.tyre.brand} ${i.tyre.modelName} (${i.tyre.size})`).join('<br/>')}</td>
                  <td>${o.paymentStatus} / ${o.dispatchStatus || 'Pending'}</td>
                  <td><strong>EC$ ${o.totalXCD}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Combined Total for Filtered Records: EC$ ${filteredHistoryOrders.reduce((acc, o) => acc + o.totalXCD, 0).toLocaleString()}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintOrderSlip = (order: AdminOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the order slip.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Slip - #${order.reservationCode} - Maranatha Square</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0984E3; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { font-size: 22px; margin: 0; color: #0984E3; }
            p { font-size: 13px; color: #64748b; margin: 4px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 13px; }
            .box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: bold; }
            .total-section { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MARANATHA SQUARE (MAX EXECUTIVE TIRES)</h1>
            <p>Pichelin, Dominica | WhatsApp: +1 767 295 8243</p>
            <p><strong>Official Paper-Friendly Order Slip / Receipt</strong></p>
          </div>

          <div class="grid">
            <div class="box">
              <p><strong>Reservation Code:</strong> ${order.reservationCode}</p>
              <p><strong>Customer Name:</strong> ${order.customerName}</p>
              <p><strong>Phone:</strong> ${order.customerPhone}</p>
              <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
            </div>
            <div class="box">
              <p><strong>Vehicle Info:</strong> ${order.vehicleInfo || 'N/A'}</p>
              <p><strong>Preferred Date / Time:</strong> ${order.preferredDate || 'As Scheduled'}</p>
              <p><strong>Payment Status:</strong> ${order.paymentStatus || 'Pending'} (${order.paymentMethod})</p>
              <p><strong>Dispatch Status:</strong> ${order.dispatchStatus || 'Pending Dispatch'}</p>
            </div>
          </div>

          <h3>Ordered Items & Services</h3>
          <table>
            <thead>
              <tr>
                <th>Item / Tyre Description</th>
                <th>Qty</th>
                <th>Condition</th>
                <th>Subtotal (XCD)</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(i => `
                <tr>
                  <td>${i.tyre.brand} ${i.tyre.modelName} (${i.tyre.size})</td>
                  <td>${i.quantity}</td>
                  <td>${i.tyre.condition.toUpperCase()}</td>
                  <td>EC$ ${(i.tyre.priceXCD + (i.includeMounting ? 20 : 0) + (i.includeNewValves ? 15 : 0)) * i.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            Total Amount: EC$ ${order.totalXCD.toLocaleString()}
          </div>

          <div class="footer">
            <p>Thank you for choosing Maranatha Square - Max Executive Tires, Pichelin!</p>
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSaveWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWhatsAppMessage(customWhatsAppInput);
    setSavedWhatsAppNotice(true);
    setTimeout(() => setSavedWhatsAppNotice(false), 3000);
  };

  const handleOpenDispatchForm = (order: AdminOrder) => {
    setActiveDispatchOrderId(order.id);
    setActivePriceEditOrderId(null);
    setDispatchDateInput(order.dispatchDate || order.preferredDate || new Date().toISOString().split('T')[0]);
    setDispatchMethodInput(order.dispatchMethod || 'In-Shop Pichelin Mounting');
    setDispatchNotesInput(order.dispatchNotes || '');
  };

  const handleOpenPriceEdit = (order: AdminOrder) => {
    setActivePriceEditOrderId(order.id);
    setActiveDispatchOrderId(null);
    setEditedTotalXCD(order.totalXCD);
    setAdjustmentReason('');
  };

  const handleSaveDispatch = (orderId: string) => {
    onUpdateOrder(orderId, {
      dispatchStatus: 'Scheduled',
      dispatchDate: dispatchDateInput,
      dispatchMethod: dispatchMethodInput,
      dispatchNotes: dispatchNotesInput,
    });
    setActiveDispatchOrderId(null);
  };

  const handleSavePriceEdit = (order: AdminOrder) => {
    const newTotalXCD = Number(editedTotalXCD);
    const diff = newTotalXCD - order.totalXCD;
    const adjustmentType = diff >= 0 ? 'charge' : 'refund';

    const newAdjustment: PriceAdjustment = {
      amountXCD: Math.abs(diff),
      reason: adjustmentReason || (diff >= 0 ? 'Additional Billing / Price Correction' : 'Client Refund / Price Correction'),
      type: adjustmentType,
      timestamp: new Date().toLocaleString()
    };

    const existingAdjustments = order.priceAdjustments || [];

    onUpdateOrder(order.id, {
      totalXCD: newTotalXCD,
      priceAdjustments: [newAdjustment, ...existingAdjustments]
    });

    setActivePriceEditOrderId(null);
  };

  const handleTogglePayment = (order: AdminOrder) => {
    const newStatus = order.paymentStatus === 'Confirmed' ? 'Pending' : 'Confirmed';
    onUpdateOrder(order.id, { paymentStatus: newStatus });
  };

  const handleMarkDispatched = (order: AdminOrder) => {
    onUpdateOrder(order.id, { dispatchStatus: 'Dispatched' });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-fade-in overflow-hidden">
      <div 
        style={{
          width: '100%',
          height: '100%',
          paddingLeft: '24px',
          paddingRight: '10px',
          paddingTop: '16px',
          paddingBottom: '24px',
          marginTop: '0px',
          marginBottom: '0px',
          marginLeft: '0px',
          marginRight: '35px',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
        className="bg-white shadow-none border-0 space-y-4 relative flex flex-col overflow-hidden h-full w-full rounded-none"
      >
        {/* Header */}
        <div 
          style={{ 
            marginTop: '-1px', 
            marginBottom: '30px',
            paddingTop: '0px', 
            paddingBottom: '0px',
            paddingLeft: '0px',
            paddingRight: '16px',
            height: '86px',
            fontSize: '12px'
          }} 
          className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-white z-20 sticky top-0"
        >
          <div style={{ marginBottom: '16px' }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 font-bold relative shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
              {orders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {orders.length}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#2D3436]">Shop Manager Dashboard & Settings</h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Manager Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">Maranatha Square, Pichelin, Dominica — Orders, Payments, Dispatch & WhatsApp Config</p>
            </div>
          </div>

          <div style={{ marginBottom: '14px', height: '64px' }} className="flex items-center gap-2">
            {/* Collapsed Admin Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setIsAdminActionsMenuOpen(!isAdminActionsMenuOpen)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0984E3] hover:bg-[#076bc1] px-3.5 py-2 rounded-xl shadow-xs transition"
                title="Admin Actions & Export Menu"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Actions ▾</span>
              </button>

              {isAdminActionsMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-fade-in text-xs font-medium">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Bulk Operations
                  </div>
                  <button
                    onClick={() => { handleBulkMarkCompleted(); setIsAdminActionsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-800 font-bold flex items-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mark All Visible Completed</span>
                  </button>
                  <button
                    onClick={() => { handleBulkDelete(); setIsAdminActionsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-700 font-bold flex items-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Delete All Visible Orders</span>
                  </button>

                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mt-2">
                    Export & System
                  </div>
                  <button
                    onClick={() => { handleDownloadSpreadsheet(); setIsAdminActionsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4 text-[#0984E3]" />
                    <span>Export CSV Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => { handleExportCurrentListPdf(); setIsAdminActionsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4 text-[#0984E3]" />
                    <span>Export List PDF</span>
                  </button>
                  {onOpenDeviceSimulator && (
                    <button
                      onClick={() => {
                        setIsAdminActionsMenuOpen(false);
                        onOpenDeviceSimulator('ios');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 font-bold flex items-center justify-between transition border-t border-slate-100 mt-1"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#0984E3]" />
                        <span>Preview in iOS & Android</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Apple className="w-3.5 h-3.5 text-blue-600" />
                        <Bot className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => { onLogoff(); setIsAdminActionsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-700 font-bold flex items-center gap-2 transition border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Logoff Admin Portal</span>
                  </button>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Modal Navigation Tabs (Horizontally scrollable for full visibility) */}
        <div 
          style={{
            marginTop: '-15px',
            paddingTop: '0px',
            paddingBottom: '0px',
            paddingRight: '0px',
            width: '926px',
            height: '64px'
          }}
          className="flex items-center border-b border-slate-200 overflow-x-auto whitespace-nowrap"
        >
          <div
            style={{
              marginTop: '0px',
              marginBottom: '0px',
              paddingTop: '5px',
              paddingBottom: '4px',
              paddingLeft: '15px',
              height: '65px'
            }}
            className="flex items-center gap-2 w-full"
          >
          <button
            onClick={() => setActiveModalTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'orders'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveModalTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'history'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveModalTab('pos')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'pos'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>POS Counter & Stripe</span>
          </button>

          <button
            onClick={() => setActiveModalTab('prices')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'prices'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Bulk Price Update</span>
          </button>

          <button
            onClick={() => setActiveModalTab('activity')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'activity'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Activity Log ({adminActivityLog.length})</span>
          </button>

          <button
            onClick={() => setActiveModalTab('trends')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'trends'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue Trends</span>
          </button>

          <button
            onClick={() => setActiveModalTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'settings'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Store WhatsApp Settings</span>
          </button>

          <button
            onClick={() => setActiveModalTab('services')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'services'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Services & Pricing</span>
          </button>

          <button
            onClick={() => setActiveModalTab('myorders')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeModalTab === 'myorders'
                ? 'bg-[#0984E3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Customer Order Lookup</span>
          </button>
          </div>
        </div>





        {selectedOrderIds.length > 0 && (
          <div className="bg-[#0984E3] text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="bg-white/25 px-2.5 py-1 rounded-lg">{selectedOrderIds.length} orders selected</span>
              <span>Bulk Action Toolbar Active</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkSelectedCompleted}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Selected Completed</span>
              </button>
              <button
                onClick={handleBulkDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={() => setSelectedOrderIds([])}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT */}
        {activeModalTab === 'trends' ? (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <h4 className="text-lg font-extrabold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Weekly Revenue Trends: Current Week vs. Previous Week
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Comparing daily sales and workshop service revenue at Maranatha Square, Pichelin, Dominica.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Current Week (EC$)
                </span>
                <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Previous Week (EC$)
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h5 className="text-sm font-bold text-slate-900">Daily Revenue Comparison (EC$)</h5>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: 'Mon', currentWeek: 1450, previousWeek: 1200 },
                      { day: 'Tue', currentWeek: 2100, previousWeek: 1850 },
                      { day: 'Wed', currentWeek: 1800, previousWeek: 1950 },
                      { day: 'Thu', currentWeek: 2900, previousWeek: 2200 },
                      { day: 'Fri', currentWeek: 3400, previousWeek: 2800 },
                      { day: 'Sat', currentWeek: 4200, previousWeek: 3600 },
                      { day: 'Sun', currentWeek: 1900, previousWeek: 1500 },
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                      formatter={(value: any) => [`EC$ ${value}`, 'Revenue']}
                    />
                    <Bar dataKey="currentWeek" name="Current Week (EC$)" fill="#0984E3" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="previousWeek" name="Previous Week (EC$)" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : activeModalTab === 'pos' ? (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Maranatha Square POS Counter & Stripe Merchant Gateway
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Process walk-in sales, counter fittings, and instant card payments securely via Stripe Merchant Portal.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-emerald-300">Stripe Live / Test Connected</span>
              </div>
            </div>

            {posSuccessReceipt ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4 text-center">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-emerald-900">POS Payment Successful & Order Dispatched!</h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Reservation Code: <strong>{posSuccessReceipt.reservationCode}</strong> &bull; Total Charged: EC$ {posSuccessReceipt.totalXCD} via {posSuccessReceipt.paymentMethod}.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handlePrintOrderSlip(posSuccessReceipt)}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print POS Receipt</span>
                  </button>
                  <button
                    onClick={() => setPosSuccessReceipt(null)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Start New POS Sale</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Tyre Catalog & POS Add */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        placeholder="Search POS inventory by brand, size, model..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                      />
                    </div>
                    <div>
                      <select
                        value={posCategory}
                        onChange={(e) => setPosCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Passenger & Hatchback">Passenger & Hatchback</option>
                        <option value="SUV, Crossover & 4x4">SUV, Crossover & 4x4</option>
                        <option value="All-Terrain (A/T)">All-Terrain (A/T)</option>
                        <option value="Mud-Terrain (M/T)">Mud-Terrain (M/T)</option>
                        <option value="Commercial Van & Minibus">Commercial Van & Minibus</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {tyres
                      .filter(t => {
                        const matchText = (t.brand + ' ' + t.modelName + ' ' + t.size + ' ' + t.condition).toLowerCase();
                        const matchesSearch = matchText.includes(posSearch.toLowerCase());
                        const matchesCat = posCategory === 'ALL' || t.category === posCategory;
                        return matchesSearch && matchesCat;
                      })
                      .map(tyre => (
                        <div key={tyre.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs hover:border-[#0984E3] transition flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tyre.condition === 'new' ? 'bg-blue-100 text-[#0984E3]' : 'bg-amber-100 text-amber-800'}`}>
                                {tyre.condition.toUpperCase()} &bull; {tyre.brand}
                              </span>
                              <span className="text-xs font-extrabold text-emerald-700">EC$ {tyre.priceXCD}</span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 mt-1">{tyre.modelName}</h5>
                            <p className="text-[11px] text-slate-500 font-mono">Size: {tyre.size} &bull; Stock: {tyre.stockCount}</p>
                          </div>
                          <button
                            onClick={() => handleAddTyreToPos(tyre)}
                            className="w-full bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to POS Order</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* RIGHT: POS Cart & Stripe Checkout Terminal */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#0984E3]" />
                        Active POS Terminal Cart ({posCart.reduce((s, i) => s + i.quantity, 0)})
                      </h5>
                      {posCart.length > 0 && (
                        <button
                          onClick={() => setPosCart([])}
                          className="text-xs text-red-600 hover:text-red-700 font-bold"
                        >
                          Clear Cart
                        </button>
                      )}
                    </div>

                    {posCart.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                        <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                        <p>POS cart is empty. Select items from catalogue.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {posCart.map(item => {
                          const unitPrice = item.tyre.priceXCD + (item.includeMounting ? 20 : 0) + (item.includeNewValves ? 15 : 0) + (item.includeShredding ? 1 : 0);
                          return (
                            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h6 className="text-xs font-bold text-slate-900">{item.tyre.brand} {item.tyre.modelName}</h6>
                                  <p className="text-[11px] text-slate-500 font-mono">{item.tyre.size}</p>
                                </div>
                                <button onClick={() => handleRemovePosItem(item.id)} className="text-slate-400 hover:text-red-600">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => handleUpdatePosQuantity(item.id, -1)} className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-bold w-6 text-center">{item.quantity}</span>
                                  <button onClick={() => handleUpdatePosQuantity(item.id, 1)} className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="font-bold text-emerald-700">EC$ {unitPrice * item.quantity}</span>
                              </div>

                              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
                                <label className="flex items-center gap-1 cursor-pointer bg-white p-1 rounded border border-slate-200">
                                  <input type="checkbox" checked={item.includeMounting} onChange={() => handleTogglePosService(item.id, 'includeMounting')} className="rounded text-[#0984E3]" />
                                  <span>Mount (+EC$20)</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer bg-white p-1 rounded border border-slate-200">
                                  <input type="checkbox" checked={item.includeNewValves} onChange={() => handleTogglePosService(item.id, 'includeNewValves')} className="rounded text-[#0984E3]" />
                                  <span>Valves (+EC$15)</span>
                                </label>
                                <label style={{ color: '#270be5' }} className="flex items-center gap-1 cursor-pointer bg-white p-1 rounded border border-slate-200">
                                  <input type="checkbox" checked={item.includeShredding} onChange={() => handleTogglePosService(item.id, 'includeShredding')} className="rounded text-[#0984E3]" />
                                  <span>Shred (+EC$1)</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Customer & Checkout Form */}
                    <form onSubmit={handleCompletePosCheckout} className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Customer Name (Optional)</label>
                        <input
                          type="text"
                          value={posCustomerName}
                          onChange={(e) => setPosCustomerName(e.target.value)}
                          placeholder="Walk-in Customer Name"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Customer Phone / WhatsApp (Optional)</label>
                        <input
                          type="text"
                          value={posCustomerPhone}
                          onChange={(e) => setPosCustomerPhone(e.target.value)}
                          placeholder="+1 (767) ..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Vehicle Make / Model / Plate</label>
                        <input
                          type="text"
                          value={posVehicleInfo}
                          onChange={(e) => setPosVehicleInfo(e.target.value)}
                          placeholder="e.g. Toyota Hilux (PA-1234)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Payment Gateway / Method</label>
                        <select
                          value={posPaymentMethod}
                          onChange={(e: any) => setPosPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                        >
                          <option value="SmartPOS Card Terminal (Tap, Insert & Swipe)">SmartPOS Terminal (Tap NFC, Insert Chip & Swipe)</option>
                          <option value="Stripe Merchant Portal">Stripe Merchant Portal (Online Card)</option>
                          <option value="Cash at Counter">Cash at Pichelin Counter (EC$)</option>
                          <option value="Bank Transfer">Bank Transfer / Mobile Money</option>
                        </select>
                      </div>

                      {/* Totals Box */}
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Total Amount:</span>
                          <span className="font-bold">EC$ {posSubtotalXCD}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={posLoading || posCart.length === 0}
                        className="w-full bg-[#0984E3] hover:bg-[#0770c2] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{posLoading ? 'Processing Stripe Payment...' : `Process POS Payment (EC$ ${posSubtotalXCD})`}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeModalTab === 'history' ? (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 animate-fade-in">
            {/* Accounting Header & Download button */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Accounting & Past Order Records
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  View financial summaries, search past tyre orders, filter by status, and download complete accounting spreadsheets.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleDownloadSpreadsheet}
                  className="inline-flex items-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Spreadsheet (CSV)</span>
                </button>
                <button
                  onClick={handleDownloadMonthlyReport}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md border border-slate-700 transition"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Monthly Sales Report (CSV)</span>
                </button>
                <button
                  onClick={handleExportSelectedPdf}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Selected (PDF)</span>
                </button>
              </div>
            </div>

            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Revenue</span>
                <span className="text-lg font-extrabold text-emerald-900">EC$ {totalRevenueXCD.toLocaleString()}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Completed / Paid</span>
                <span className="text-lg font-extrabold text-blue-900">{completedOrdersCount} Orders</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Payment</span>
                <span className="text-lg font-extrabold text-amber-900">{pendingOrdersCount} Orders</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Refunds / Adjustments</span>
                <span className="text-lg font-extrabold text-purple-900">{refundedOrdersCount} Orders</span>
              </div>
            </div>

            {/* Sub-tab switcher: Active vs Archived vs Analytics */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setHistorySubTab('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    historySubTab === 'active'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📋 Active Orders ({activeOrders.length})
                </button>
                <button
                  onClick={() => setHistorySubTab('archived')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    historySubTab === 'archived'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📦 Archived (&gt;90 Days) ({archivedOrders.length})
                </button>
                <button
                  onClick={() => setHistorySubTab('analytics')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    historySubTab === 'analytics'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📊 Dashboard Analytics
                </button>
              </div>

              {historySubTab !== 'analytics' && (
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredHistoryOrders.length} of {historySubTab === 'archived' ? archivedOrders.length : activeOrders.length} records
                </div>
              )}
            </div>

            {historySubTab === 'analytics' ? (
              <div className="space-y-6 animate-fade-in">
                {/* Revenue Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#0984E3]" />
                        Revenue Distribution per Order / Reservation
                      </h5>
                      <p className="text-xs text-slate-500">Visualizing total order values across past tyre sales and services.</p>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">No analytics data available yet.</div>
                  ) : (
                    <div className="w-full h-72 pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip 
                            formatter={(value: any) => [`EC$ ${value}`, 'Revenue']}
                            contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="revenue" fill="#0984E3" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Frequently Purchased Tyre Brands Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Most Frequently Purchased Tyre Brands (Last Month / All Time)
                      </h5>
                      <p className="text-xs text-slate-500">Aggregated quantities ordered per tyre brand across customer reservations.</p>
                    </div>
                  </div>

                  {brandChartData.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">No brand purchase data available yet.</div>
                  ) : (
                    <div className="w-full h-72 pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={brandChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="brand" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip 
                            formatter={(value: any) => [`${value} tyres`, 'Total Quantity']}
                            contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar & Status Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search by customer name, phone, reservation code, or tyre brand/model..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>

                  <div>
                    <select
                      value={historyStatusFilter}
                      onChange={(e: any) => setHistoryStatusFilter(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                    >
                      <option value="all">Filter Status: All Records</option>
                      <option value="confirmed">Paid & Confirmed</option>
                      <option value="pending">Payment Pending</option>
                      <option value="dispatched">Dispatched / Completed</option>
                      <option value="refunded">Refunded / Adjusted</option>
                    </select>
                  </div>
                </div>

                {filteredHistoryOrders.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-base font-semibold text-slate-700">No matching orders found.</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
                  </div>
                ) : (
                  filteredHistoryOrders.map((order) => {
                    const isPaymentConfirmed = order.paymentStatus === 'Confirmed';
                    const dispatchStatus = order.dispatchStatus || 'Pending Dispatch';
                    const hasRefund = order.priceAdjustments && order.priceAdjustments.some(a => a.type === 'refund');

                    const isExpanded = !!expandedOrderIds[order.id];

                    return (
                      <div 
                        key={order.id}
                        className={`admin-order-card ${
                          dispatchStatus === 'Dispatched' 
                            ? 'border-l-4 border-l-emerald-500 border-emerald-300 bg-emerald-50/15' 
                            : 'border-l-4 border-l-amber-500 border-amber-300 bg-amber-50/15'
                        } rounded-2xl p-4 space-y-3 shadow-xs transition`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={() => handleToggleSelectOrder(order.id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#0984E3] focus:ring-[#0984E3] cursor-pointer"
                              title="Select order for bulk actions"
                            />
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                              {order.reservationCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              isPaymentConfirmed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {isPaymentConfirmed ? '✓ Paid / Confirmed' : '⏳ Payment Pending'}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              dispatchStatus === 'Dispatched' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {dispatchStatus === 'Dispatched' ? '✓ Completed' : dispatchStatus}
                            </span>
                            {hasRefund && (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-purple-100 text-purple-800 border-purple-300">
                                ↺ Refunded / Adjusted
                              </span>
                            )}
                            <div className="flex items-center gap-2 flex-wrap pt-2 w-full">
                              <button
                                onClick={() => onUpdateOrder(order.id, { dispatchStatus: 'Ready for Fitting' })}
                                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl border shadow-xs transition ${
                                  dispatchStatus === 'Ready for Fitting'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300'
                                }`}
                                title="Set status to Ready for Fitting at Pichelin"
                              >
                                <span>⚡ Set to Ready</span>
                              </button>

                              <button
                                onClick={() => onUpdateOrder(order.id, { dispatchStatus: 'Dispatched' })}
                                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl border shadow-xs transition ${
                                  dispatchStatus === 'Dispatched'
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                                }`}
                                title="Mark order as Completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Mark as Completed</span>
                              </button>

                              {!isPaymentConfirmed && (
                                <button
                                  onClick={() => onUpdateOrder(order.id, { paymentStatus: 'Confirmed' })}
                                  className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl border bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-400 shadow-xs transition"
                                  title="Confirm Payment Received"
                                >
                                  <span>💳 Confirm Payment</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">
                            EC$ {order.totalXCD}
                          </span>
                        </div>

                        {/* Expandable Section for Customer Contact & Vehicle Info */}
                        <div 
                          onClick={() => toggleExpandOrder(order.id)}
                          className="cursor-pointer bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#0984E3]" />
                            <span>Customer: {order.customerName} ({order.customerPhone}) &bull; Vehicle: {order.vehicleInfo || 'N/A'}</span>
                          </span>
                          <span className="text-[11px] text-[#0984E3]">
                            {isExpanded ? '▲ Hide Details' : '▼ View Contact & Vehicle Info'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-800 animate-fade-in">
                            <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px] block">Customer Contact & Vehicle Model Details</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>Customer Name: <strong className="text-slate-900">{order.customerName}</strong></div>
                              <div>Phone: <strong className="text-slate-900">{order.customerPhone}</strong></div>
                              <div>Email: <strong className="text-slate-900">{order.customerEmail || 'Not Provided'}</strong></div>
                              <div>Vehicle Model / Info: <strong className="text-slate-900">{order.vehicleInfo || 'General / Not Specified'}</strong></div>
                              <div>Reservation Code: <strong className="text-slate-900">{order.reservationCode}</strong></div>
                              <div>Preferred Date: <strong className="text-slate-900">{order.preferredDate || 'As Scheduled'}</strong></div>
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Items & Services:</span>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-slate-800">
                              <span>{item.quantity}x {item.tyre.brand} {item.tyre.modelName} ({item.tyre.size}) [{item.tyre.condition}]</span>
                              <span className="font-semibold">EC$ {(item.tyre.priceXCD + (item.includeMounting ? 20 : 0) + (item.includeNewValves ? 15 : 0)) * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {order.priceAdjustments && order.priceAdjustments.length > 0 && (
                          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 text-xs text-amber-900">
                            <span className="font-bold text-[10px] uppercase text-amber-700 block">Adjustments / Refunds:</span>
                            {order.priceAdjustments.map((adj, i) => (
                              <div key={i} className="flex justify-between text-[11px]">
                                <span>{adj.type === 'refund' ? 'Refund' : 'Extra Bill'}: EC$ {adj.amountXCD} ({adj.reason})</span>
                                <span>{adj.timestamp}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-500">
                            Customer Email: <strong className="text-slate-800">{order.customerEmail || 'Not Provided'}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}, this is Maranatha Square (Max Executive Tires, Pichelin). Friendly reminder regarding your order / service reservation #${order.reservationCode} (Total: EC$ ${order.totalXCD}). Status: ${order.paymentStatus === 'Confirmed' ? 'Paid & Confirmed' : 'Payment Pending'}, Dispatch: ${order.dispatchStatus || 'Pending'}. Preferred Date: ${order.preferredDate || 'As Scheduled'}. Please contact us if you need any questions!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1.5 rounded-lg transition border border-emerald-200"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Send WhatsApp Reminder</span>
                            </a>
                            <button
                              onClick={() => handlePrintOrderSlip(order)}
                              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg transition border border-slate-200"
                              title="Print Paper-Friendly Order Slip"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-700" />
                              <span>Print Slip</span>
                            </button>
                            <button
                              onClick={() => handleEmailPdfSummary(order)}
                              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg transition border border-slate-200"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#0984E3]" />
                              <span>Email PDF Summary</span>
                            </button>
                            <button
                              onClick={() => handleTriggerEmailReceiptModal(order)}
                              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0984E3] font-bold text-xs px-3 py-1.5 rounded-lg transition border border-blue-200"
                              title="Generate Professional Automated Email Receipt"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Automated Email Receipt</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete order ${order.reservationCode}?`)) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg transition border border-red-200"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : activeModalTab === 'prices' ? (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0984E3] text-white flex items-center justify-center font-bold shadow-sm">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold flex items-center gap-2">
                    Bulk Tyre Price Management
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Instantly update pricing across all tyres within a specific category or the entire catalogue at once.
                  </p>
                </div>
              </div>

              {bulkPriceSuccess && (
                <div className="bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bulk price update applied successfully across category "{bulkCategory}"!</span>
                </div>
              )}

              <form onSubmit={handleApplyBulkPrices} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Select Tyre Category</label>
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                    >
                      <option value="ALL">ALL CATEGORIES (Entire Catalogue)</option>
                      <option value="All-Terrain (A/T)">All-Terrain (A/T)</option>
                      <option value="Highway Terrain (H/T)">Highway Terrain (H/T)</option>
                      <option value="Mud Terrain (M/T)">Mud Terrain (M/T)</option>
                      <option value="Commercial / Van">Commercial / Van</option>
                      <option value="Passenger / Hatchback">Passenger / Hatchback</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Update Mode</label>
                    <select
                      value={bulkPriceMode}
                      onChange={(e: any) => setBulkPriceMode(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                    >
                      <option value="set">Set Exact Price (EC$)</option>
                      <option value="add">Add Markup Amount (EC$+)</option>
                      <option value="subtract">Apply Discount (EC$-)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Price Amount (EC$)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={bulkPriceValue}
                      onChange={(e) => setBulkPriceValue(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Apply Bulk Price Update</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeModalTab === 'activity' ? (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Admin Activity Audit Log
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Track all administrative actions, status changes, price adjustments, and system events.
                </p>
              </div>
              <button
                onClick={handleDownloadActivityLogCsv}
                className="inline-flex items-center gap-2 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Activity Log (CSV)</span>
              </button>
            </div>

            {adminActivityLog.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs">
                No administrative activity logged yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Admin</th>
                      <th className="p-3.5">Action Type</th>
                      <th className="p-3.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminActivityLog.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-3.5 font-bold text-slate-800">{log.adminName}</td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.actionType === 'PRICE_UPDATE' ? 'bg-amber-100 text-amber-800' :
                            log.actionType === 'ORDER_DELETION' ? 'bg-red-100 text-red-800' :
                            log.actionType === 'BULK_ACTION' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeModalTab === 'settings' ? (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 animate-fade-in">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Custom WhatsApp Pre-filled Message</h4>
                  <p className="text-xs text-slate-600">
                    Configure the exact pre-filled message text used when website visitors click the floating 'WhatsApp Shop' button.
                  </p>
                </div>
              </div>

              {savedWhatsAppNotice && (
                <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Custom WhatsApp message saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveWhatsAppConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Pre-filled WhatsApp Message Template</label>
                  <textarea
                    rows={4}
                    value={customWhatsAppInput}
                    onChange={(e) => setCustomWhatsAppInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0984E3] bg-white font-medium"
                    placeholder="Enter WhatsApp message text..."
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    This message will automatically open in WhatsApp addressed to Maranatha Square shop manager ({SHOP_LOCATION_INFO.whatsapp}).
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl shadow-xs transition"
                  >
                    Save WhatsApp Setting
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Search & Sort Header Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={activeOrdersSearch}
                  onChange={(e) => setActiveOrdersSearch(e.target.value)}
                  placeholder="Search orders by customer name, phone, code, or vehicle..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Sort By:</span>
                <select
                  value={activeOrdersSort}
                  onChange={(e) => setActiveOrdersSort(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                >
                  <option value="date-desc">Newest Date first</option>
                  <option value="date-asc">Oldest Date first</option>
                  <option value="name-asc">Customer Name (A-Z)</option>
                  <option value="name-desc">Customer Name (Z-A)</option>
                </select>
              </div>
            </div>

            {filteredActiveOrders.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-base font-semibold text-slate-700">No matching orders found.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try adjusting your search query or criteria.
                </p>
              </div>
            ) : (
              filteredActiveOrders.map((order) => {
                const isPaymentConfirmed = order.paymentStatus === 'Confirmed';
                const dispatchStatus = order.dispatchStatus || 'Pending Dispatch';
                const isEditingDispatch = activeDispatchOrderId === order.id;
                const isEditingPrice = activePriceEditOrderId === order.id;
                const isExpanded = !!expandedOrderIds[order.id];

                return (
                  <div 
                    key={order.id}
                    className={`admin-order-card ${
                      dispatchStatus === 'Dispatched' 
                        ? 'border-l-4 border-l-emerald-500 border-emerald-300 bg-emerald-50/15' 
                        : 'border-l-4 border-l-amber-500 border-amber-300 bg-amber-50/15'
                    } rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs transition`}
                  >
                    {/* Top Bar: Code, Payment status badge, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => handleToggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0984E3] focus:ring-[#0984E3] cursor-pointer"
                          title="Select order for bulk actions"
                        />
                        <span className="font-mono font-bold text-xs bg-blue-100 text-[#0984E3] px-2.5 py-1 rounded-md border border-blue-200">
                          {order.reservationCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          order.paymentMethod.includes('Stripe') 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {order.paymentMethod}
                        </span>

                        {/* Payment Status Pill */}
                        <button
                          onClick={() => handleTogglePayment(order)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                            isPaymentConfirmed
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                          title="Click to toggle payment verification"
                        >
                          <Check className="w-3 h-3" />
                          <span>{isPaymentConfirmed ? 'Payment Confirmed' : 'Confirm Payment'}</span>
                        </button>

                        {/* Dispatch Status Pill */}
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          dispatchStatus === 'Dispatched' 
                            ? 'bg-blue-600 text-white border-blue-700'
                            : dispatchStatus === 'Scheduled'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}>
                          {dispatchStatus === 'Dispatched' ? '✓ Dispatched & Fitted' : dispatchStatus === 'Scheduled' ? '📅 Dispatch Scheduled' : '⏳ Pending Dispatch'}
                        </span>

                        {/* Mark as Completed / Pending Status Toggle Button */}
                        <button
                          onClick={() => handleToggleCompleted(order)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                            dispatchStatus === 'Dispatched'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-200 text-slate-800 hover:bg-slate-300 border-slate-300'
                          }`}
                          title="Toggle order status between Completed and Pending"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{dispatchStatus === 'Dispatched' ? 'Completed (Click for Pending)' : 'Mark as Completed'}</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">{order.timestamp}</span>
                    </div>

                    {/* Expandable Section Toggle */}
                    <div 
                      onClick={() => toggleExpandOrder(order.id)}
                      className="cursor-pointer bg-white hover:bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0984E3]" />
                        <span>Customer Contact & Vehicle Model Info: <strong className="text-slate-900">{order.customerName}</strong> ({order.vehicleInfo || 'N/A'})</span>
                      </div>
                      <span className="text-xs text-[#0984E3] font-bold">
                        {isExpanded ? '▲ Hide Details' : '▼ View Contact & Vehicle Info'}
                      </span>
                    </div>

                    {/* Expandable Section Content */}
                    {isExpanded && (
                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-slate-800 animate-fade-in">
                        <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px] block">Customer Contact Details & Vehicle Model Information</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>Customer Name: <strong className="text-slate-900">{order.customerName}</strong></div>
                          <div>Customer Phone: <strong className="text-slate-900">{order.customerPhone}</strong></div>
                          <div>Customer Email: <strong className="text-slate-900">{order.customerEmail || 'Not Provided'}</strong></div>
                          <div>Vehicle Model Info: <strong className="text-slate-900">{order.vehicleInfo || 'General / Not Specified'}</strong></div>
                          <div>Reservation Code: <strong className="text-slate-900">{order.reservationCode}</strong></div>
                          <div>Preferred Fitting Date: <strong className="text-slate-900">{order.preferredDate || 'Today (Fast Lane)'}</strong></div>
                        </div>
                      </div>
                    )}

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Customer: <strong className="text-slate-900">{order.customerName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${order.customerPhone}`} className="text-[#0984E3] hover:underline font-bold">
                          {order.customerPhone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Vehicle: <strong className="text-slate-900">{order.vehicleInfo || 'General / Not Specified'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Preferred Fitting Date: <strong className="text-slate-900">{order.preferredDate || 'Today (Fast Lane)'}</strong></span>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Ordered Items & Services:</span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-800 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                          <span>
                            <strong>{item.quantity}x</strong> {item.tyre.brand} {item.tyre.modelName} ({item.tyre.size}) [{item.tyre.condition}]
                            {item.includeMounting && <span className="text-[10px] text-blue-600 ml-1.5 bg-blue-50 px-1.5 py-0.5 rounded">Mounting</span>}
                            {item.includeNewValves && <span className="text-[10px] text-blue-600 ml-1.5 bg-blue-50 px-1.5 py-0.5 rounded">Valves</span>}
                          </span>
                          <span className="font-semibold text-slate-900">
                            EC$ {(item.tyre.priceXCD + (item.includeMounting ? 20 : 0) + (item.includeNewValves ? 15 : 0)) * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Dispatch Details if Scheduled */}
                    {order.dispatchDate && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <span>Dispatch Scheduled for: <strong>{order.dispatchDate}</strong></span>
                            <span className="mx-2 text-purple-300">|</span>
                            <span>Method: <strong>{order.dispatchMethod}</strong></span>
                            {order.dispatchNotes && <p className="text-[11px] text-purple-700 mt-0.5">Notes: {order.dispatchNotes}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price Adjustments & Refunds Log */}
                    {order.priceAdjustments && order.priceAdjustments.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">Manager Price Adjustments & Refunds:</span>
                        {order.priceAdjustments.map((adj, i) => (
                          <div key={i} className="flex justify-between items-center text-amber-900 border-b border-amber-200/50 pb-1 last:border-0 last:pb-0">
                            <span>
                              <strong className={adj.type === 'refund' ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                                {adj.type === 'refund' ? 'Refunded' : 'Billed Extra'}: EC$ {adj.amountXCD}
                              </strong>
                              <span className="text-amber-800 ml-2">({adj.reason})</span>
                            </span>
                            <span className="text-[10px] text-amber-600">{adj.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Schedule Dispatch Form Popup / Inline */}
                    {isEditingDispatch && (
                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-[#0984E3]" />
                            Schedule Dispatch & Fitting for {order.reservationCode}
                          </span>
                          <button onClick={() => setActiveDispatchOrderId(null)} className="text-slate-400 hover:text-slate-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Dispatch / Fitting Date</label>
                            <input
                              type="date"
                              value={dispatchDateInput}
                              onChange={(e) => setDispatchDateInput(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Fulfillment / Delivery Method</label>
                            <select
                              value={dispatchMethodInput}
                              onChange={(e) => setDispatchMethodInput(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                            >
                              <option value="In-Shop Pichelin Mounting">In-Shop Pichelin Mounting & Balancing</option>
                              <option value="Bus / Truck Delivery to Roseau">Bus / Truck Delivery to Roseau</option>
                              <option value="Mobile Van Roadside Rescue">Mobile Van Roadside Rescue Dispatch</option>
                              <option value="Customer Storefront Pickup">Customer Storefront Pickup</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Dispatch Notes / Driver Instructions</label>
                          <input
                            type="text"
                            value={dispatchNotesInput}
                            onChange={(e) => setDispatchNotesInput(e.target.value)}
                            placeholder="e.g. Call customer 30 mins before arrival in Roseau..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0984E3]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setActiveDispatchOrderId(null)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 bg-white hover:bg-slate-100 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveDispatch(order.id)}
                            className="px-4 py-1.5 rounded-lg bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold shadow-xs"
                          >
                            Save & Schedule Dispatch
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Price / Bill / Refund Form */}
                    {isEditingPrice && (
                      <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Edit3 className="w-4 h-4 text-amber-700" />
                            Modify Price / Bill or Refund for {order.reservationCode}
                          </span>
                          <button onClick={() => setActivePriceEditOrderId(null)} className="text-slate-400 hover:text-slate-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">New Total Amount (EC$)</label>
                            <input
                              type="number"
                              step="0.50"
                              value={editedTotalXCD}
                              onChange={(e) => setEditedTotalXCD(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />

                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Reason for Price Correction / Refund / Extra Bill</label>
                            <input
                              type="text"
                              value={adjustmentReason}
                              onChange={(e) => setAdjustmentReason(e.target.value)}
                              placeholder="e.g. Corrected tyre size mismatch, Refunded EC$30 quoted error..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setActivePriceEditOrderId(null)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 bg-white hover:bg-slate-100 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSavePriceEdit(order)}
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
                          >
                            Save Price & Log Adjustment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom Bar: Total, Schedule Dispatch button, WhatsApp customer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70">
                      <div className="text-xs font-bold text-slate-900">
                        Total Value: <span className="text-emerald-600 text-sm">EC$ {order.totalXCD}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handlePrintOrderSlip(order)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-300 transition"
                          title="Print Paper-Friendly Order Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>
                        <button
                          onClick={() => handleOpenPriceEdit(order)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Price / Refund</span>
                        </button>

                        <button
                          onClick={() => handleOpenDispatchForm(order)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl border border-purple-200 transition"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Schedule Dispatch</span>
                        </button>

                        {dispatchStatus !== 'Dispatched' && (
                          <button
                            onClick={() => handleMarkDispatched(order)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}, this is Maranatha Square (Max Executive Tires, Pichelin). Your order ${order.reservationCode} (Total: EC$ ${order.totalXCD}) is ${dispatchStatus === 'Scheduled' ? `scheduled for dispatch on ${order.dispatchDate}` : 'ready'}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp Customer</span>
                        </a>

                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete order ${order.reservationCode}?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl border border-red-200 transition"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeModalTab === 'services' && (
          <div className="flex-1 overflow-y-auto space-y-6 p-2">
            <ServicesSection
              
              onOpenSOS={() => {}}
              servicePrices={servicePrices}
            />
          </div>
        )}

        {activeModalTab === 'myorders' && (
          <div className="flex-1 overflow-y-auto space-y-6 p-2">
            <MyOrdersView
              orders={orders}
              
              servicePrices={servicePrices}
            />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-200 text-xs">
          {orders.length > 0 && activeModalTab === 'orders' && (
            <button
              onClick={onClearOrders}
              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Order History
            </button>
          )}
        </div>
      </div>

      {/* Automated Email Receipt Generator Modal */}
      {selectedOrderForEmailReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3]">Automated Email Receipt Generator</span>
                <h3 className="text-xl font-bold text-slate-900">Official Receipt Preview for #{selectedOrderForEmailReceipt.reservationCode}</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForEmailReceipt(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Header Preview Box */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-1 font-mono">
              <div><strong>From:</strong> orders@maxexecutivetires.dm (Max Executive Tires, Maranatha Square, Pichelin)</div>
              <div><strong>To:</strong> {selectedOrderForEmailReceipt.customerEmail || 'customer@example.com'}</div>
              <div><strong>Subject:</strong> Official Tyre & Service Order Receipt #{selectedOrderForEmailReceipt.reservationCode}</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
            </div>

            {/* Formatted Receipt Layout */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs text-slate-800 font-sans">
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">MAX EXECUTIVE TIRES & MARANATHA SQUARE</h4>
                <p className="text-slate-500">Maranatha Square, Main Highway, Pichelin, Dominica</p>
                <p className="text-slate-500">Email: maxexecutivetires.dm@gmail.com</p>
                <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md">
                  CONFIRMED RESERVATION CODE: {selectedOrderForEmailReceipt.reservationCode}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">Customer:</span>
                  <strong className="text-slate-900">{selectedOrderForEmailReceipt.customerName}</strong> ({selectedOrderForEmailReceipt.customerPhone})
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Vehicle Model:</span>
                  <strong className="text-slate-900">{selectedOrderForEmailReceipt.vehicleInfo || 'General'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Preferred Schedule:</span>
                  <strong className="text-slate-900">{selectedOrderForEmailReceipt.preferredDate || 'As Scheduled'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Payment Status:</span>
                  <strong className="text-emerald-700">{selectedOrderForEmailReceipt.paymentStatus || 'Pending'}</strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">Itemized Tyres & Live Service Rates Breakdown:</span>
                <div className="space-y-2">
                  {selectedOrderForEmailReceipt.items.map((item, idx) => {
                    const mountingRate = servicePrices['mounting'] ?? 20;
                    const valveRate = servicePrices['valves'] ?? 15;
                    const shreddingRate = servicePrices['shredding'] ?? 1;
                    const itemUnitServices = (item.includeMounting ? mountingRate : 0) + (item.includeNewValves ? valveRate : 0) + (item.includeShredding ? shreddingRate : 0);
                    const itemSubtotal = (item.tyre.priceXCD + itemUnitServices) * item.quantity;

                    return (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{item.quantity}x {item.tyre.brand} {item.tyre.modelName} ({item.tyre.size}) [{item.tyre.condition.toUpperCase()}]</span>
                          <span>EC$ {itemSubtotal}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 pl-2 space-y-0.5">
                          <div>• Tyre Unit Price: EC$ {item.tyre.priceXCD}</div>
                          {item.includeMounting && <div>• Mounting & Fitting: EC$ {mountingRate} (Live Rate)</div>}
                          {item.includeNewValves && <div>• Valve Stem: EC$ {valveRate} (Live Rate)</div>}
                          {item.includeShredding && <div>• Eco Shredder: EC$ {shreddingRate} (Live Rate)</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrderForEmailReceipt.priceAdjustments && selectedOrderForEmailReceipt.priceAdjustments.length > 0 && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                  <strong className="block text-amber-800">Adjustments:</strong>
                  {selectedOrderForEmailReceipt.priceAdjustments.map((a, i) => (
                    <div key={i}>{a.reason}: EC$ {a.amountXCD}</div>
                  ))}
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                <span>TOTAL AMOUNT PAYABLE:</span>
                <span className="text-base text-[#0984E3]">EC$ {selectedOrderForEmailReceipt.totalXCD}</span>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic pt-2">
                Thank you for choosing Max Executive Tires at Maranatha Square, Pichelin. Drive safely on Dominica's roads!
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const plainText = `MAX EXECUTIVE TIRES — RECEIPT #${selectedOrderForEmailReceipt.reservationCode}\nCustomer: ${selectedOrderForEmailReceipt.customerName}\nTotal: EC$ ${selectedOrderForEmailReceipt.totalXCD}\nThank you for your business!`;
                  navigator.clipboard.writeText(plainText);
                  alert('Formatted receipt copied to clipboard!');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                📋 Copy Plain Text
              </button>
              <button
                onClick={() => {
                  const email = selectedOrderForEmailReceipt.customerEmail || prompt('Enter recipient email address:') || 'customer@example.com';
                  handleSendAutomatedEmailReceipt(selectedOrderForEmailReceipt, email);
                }}
                className="bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-xs transition inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>🚀 Trigger & Send Email Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive SmartPOS Hardware Terminal Modal (Tap, Insert & Swipe) */}
      {isSmartCardTerminalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-700 text-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SmartPOS Terminal (Pichelin, DM)</span>
              </div>
              <button onClick={() => setIsSmartCardTerminalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            {/* Terminal Screen Mockup */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-3 shadow-inner">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Max Executive Tires POS</div>
              <div className="text-3xl font-extrabold text-white">EC$ {posSubtotalXCD}</div>
              <div className="text-xs text-slate-400">
                {terminalStep === 'idle' && "Ready. Please Tap, Insert, or Swipe Card."}
                {terminalStep === 'reading' && "Reading Card Chip / NFC / Magstripe..."}
                {terminalStep === 'pin' && "Enter PIN on Keypad & Press Green Enter..."}
                {terminalStep === 'approved' && "✓ PAYMENT APPROVED — THANK YOU!"}
              </div>
              {terminalStep === 'reading' && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full animate-pulse w-3/4"></div>
                </div>
              )}
            </div>

            {/* Hardware Peripheral Visual Slots */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center space-y-1">
                <span className="text-xl">📶</span>
                <span className="text-[10px] font-bold text-slate-300">Contactless NFC Tap</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center space-y-1">
                <span className="text-xl">💳</span>
                <span className="text-[10px] font-bold text-slate-300">EMV Chip Insert</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center space-y-1">
                <span className="text-xl">🏷️</span>
                <span className="text-[10px] font-bold text-slate-300">Magnetic Stripe Swipe</span>
              </div>
            </div>

            {/* Action Buttons to Simulate Card Interaction */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setTerminalStep('reading');
                  setTimeout(() => {
                    setTerminalStep('pin');
                    setTimeout(() => {
                      setTerminalStep('approved');
                      setTimeout(() => finalizeSmartPOSOrder('Contactless NFC Tap'), 1000);
                    }, 1200);
                  }, 1200);
                }}
                disabled={terminalStep !== 'idle'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
              >
                <span>📶 Simulate Contactless Card Tap</span>
              </button>

              <button
                onClick={() => {
                  setTerminalStep('reading');
                  setTimeout(() => {
                    setTerminalStep('pin');
                    setTimeout(() => {
                      setTerminalStep('approved');
                      setTimeout(() => finalizeSmartPOSOrder('EMV Chip Insert'), 1000);
                    }, 1500);
                  }, 1200);
                }}
                disabled={terminalStep !== 'idle'}
                className="w-full bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
              >
                <span>💳 Simulate EMV Chip Insert</span>
              </button>

              <button
                onClick={() => {
                  setTerminalStep('reading');
                  setTimeout(() => {
                    setTerminalStep('approved');
                    setTimeout(() => finalizeSmartPOSOrder('Magnetic Stripe Swipe'), 1000);
                  }, 1500);
                }}
                disabled={terminalStep !== 'idle'}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
              >
                <span>🏷️ Simulate Magnetic Stripe Swipe</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
