import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Package,
  Wrench,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { Tyre, CartItem } from '../types';
import { AdminOrder } from './AdminOrdersModal';

export const ADMIN_ADD_ORDER_DRAFT_KEY = 'max_executive_admin_add_order_draft';

interface AdminAddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tyres: Tyre[];
  servicePrices: {
    mounting: number;
    valves: number;
    disposal: number;
  };
  onAddOrder: (orderData: Omit<AdminOrder, 'id' | 'timestamp'>) => void;
}

export const AdminAddOrderModal: React.FC<AdminAddOrderModalProps> = ({
  isOpen,
  onClose,
  tyres,
  servicePrices,
  onAddOrder
}) => {
  // Check if draft exists in localStorage
  const existingDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(ADMIN_ADD_ORDER_DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse add order draft', e);
    }
    return null;
  }, [isOpen]);

  const [customerName, setCustomerName] = useState<string>(() => existingDraft?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(() => existingDraft?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(() => existingDraft?.customerEmail || '');
  const [vehicleInfo, setVehicleInfo] = useState<string>(() => existingDraft?.vehicleInfo || '');
  const [preferredDate, setPreferredDate] = useState<string>(() => existingDraft?.preferredDate || 'Today, Walk-in Fitting');
  const [paymentMethod, setPaymentMethod] = useState<string>(() => existingDraft?.paymentMethod || 'Cash at Shop / WhatsApp');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Confirmed'>(() => existingDraft?.paymentStatus || 'Confirmed');
  const [dispatchStatus, setDispatchStatus] = useState<'Pending' | 'Ready for Fitting' | 'Completed' | 'Dispatched'>(() => existingDraft?.dispatchStatus || 'Ready for Fitting');
  const [dispatchNotes, setDispatchNotes] = useState<string>(() => existingDraft?.dispatchNotes || '');
  const [items, setItems] = useState<CartItem[]>(() => existingDraft?.items || []);

  // UI helpers
  const [tyreSearch, setTyreSearch] = useState('');
  const [selectedTyreToAdd, setSelectedTyreToAdd] = useState<string>('');
  const [addQty, setAddQty] = useState<number>(2);
  const [incMounting, setIncMounting] = useState<boolean>(true);
  const [incValves, setIncValves] = useState<boolean>(true);
  const [incShredding, setIncShredding] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(existingDraft?.savedAt || null);
  const [isRestoredNoticeVisible, setIsRestoredNoticeVisible] = useState<boolean>(!!existingDraft);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state if draft was loaded when modal reopened or page refreshed
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem(ADMIN_ADD_ORDER_DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.customerName !== undefined) setCustomerName(draft.customerName);
          if (draft.customerPhone !== undefined) setCustomerPhone(draft.customerPhone);
          if (draft.customerEmail !== undefined) setCustomerEmail(draft.customerEmail);
          if (draft.vehicleInfo !== undefined) setVehicleInfo(draft.vehicleInfo);
          if (draft.preferredDate !== undefined) setPreferredDate(draft.preferredDate);
          if (draft.paymentMethod !== undefined) setPaymentMethod(draft.paymentMethod);
          if (draft.paymentStatus !== undefined) setPaymentStatus(draft.paymentStatus);
          if (draft.dispatchStatus !== undefined) setDispatchStatus(draft.dispatchStatus);
          if (draft.dispatchNotes !== undefined) setDispatchNotes(draft.dispatchNotes);
          if (Array.isArray(draft.items) && draft.items.length > 0) {
            const rehydrated = draft.items.map((it: CartItem) => {
              const liveTyre = tyres.find((t) => t.id === it.tyre?.id);
              return {
                ...it,
                tyre: liveTyre || it.tyre
              };
            });
            setItems(rehydrated);
          }
          setLastSavedTime(draft.savedAt || new Date().toLocaleTimeString());
          setIsRestoredNoticeVisible(true);
        }
      } catch (e) {
        console.error('Failed to parse and restore add order draft', e);
      }
    }
  }, [isOpen, tyres]);

  // Synchronous ref to hold latest form values for beforeunload and closing
  const currentFormRef = React.useRef({
    customerName,
    customerPhone,
    customerEmail,
    vehicleInfo,
    preferredDate,
    paymentMethod,
    paymentStatus,
    dispatchStatus,
    dispatchNotes,
    items
  });

  useEffect(() => {
    currentFormRef.current = {
      customerName,
      customerPhone,
      customerEmail,
      vehicleInfo,
      preferredDate,
      paymentMethod,
      paymentStatus,
      dispatchStatus,
      dispatchNotes,
      items
    };
  }, [
    customerName,
    customerPhone,
    customerEmail,
    vehicleInfo,
    preferredDate,
    paymentMethod,
    paymentStatus,
    dispatchStatus,
    dispatchNotes,
    items
  ]);

  // Save current form state immediately to localStorage
  const saveCurrentDraft = React.useCallback(() => {
    const data = currentFormRef.current;
    const hasAnyContent =
      data.customerName.trim() ||
      data.customerPhone.trim() ||
      data.customerEmail.trim() ||
      data.vehicleInfo.trim() ||
      data.dispatchNotes.trim() ||
      data.items.length > 0;

    if (hasAnyContent) {
      const now = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const draftPayload = {
        ...data,
        savedAt: now
      };

      try {
        localStorage.setItem(ADMIN_ADD_ORDER_DRAFT_KEY, JSON.stringify(draftPayload));
        setLastSavedTime(now);
      } catch (err) {
        console.warn('Failed to auto-save add order draft', err);
      }
    }
  }, []);

  // Auto-save on every state modification
  useEffect(() => {
    if (!isOpen) return;

    const hasAnyContent =
      customerName.trim() ||
      customerPhone.trim() ||
      customerEmail.trim() ||
      vehicleInfo.trim() ||
      dispatchNotes.trim() ||
      items.length > 0;

    if (hasAnyContent) {
      saveCurrentDraft();
    }
  }, [
    isOpen,
    customerName,
    customerPhone,
    customerEmail,
    vehicleInfo,
    preferredDate,
    paymentMethod,
    paymentStatus,
    dispatchStatus,
    dispatchNotes,
    items,
    saveCurrentDraft
  ]);

  // Hook beforeunload to preserve draft on page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentDraft();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCurrentDraft]);

  // Handler for closing modal while safeguarding draft
  const handleCloseModal = () => {
    saveCurrentDraft();
    onClose();
  };

  // Discard draft and reset form
  const handleClearDraft = () => {
    try {
      localStorage.removeItem(ADMIN_ADD_ORDER_DRAFT_KEY);
    } catch (e) {
      console.error(e);
    }
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setVehicleInfo('');
    setPreferredDate('Today, Walk-in Fitting');
    setPaymentMethod('Cash at Shop / WhatsApp');
    setPaymentStatus('Confirmed');
    setDispatchStatus('Ready for Fitting');
    setDispatchNotes('');
    setItems([]);
    setLastSavedTime(null);
    setIsRestoredNoticeVisible(false);
    setFormError(null);
  };

  // Add selected tyre to the order cart
  const handleAddItem = () => {
    if (!selectedTyreToAdd) {
      setFormError('Please select a tyre model to add to the order.');
      return;
    }
    const targetTyre = tyres.find((t) => t.id === selectedTyreToAdd);
    if (!targetTyre) return;

    const newItem: CartItem = {
      id: `ord-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tyre: targetTyre,
      quantity: Math.max(1, addQty),
      includeMounting: incMounting,
      includeNewValves: incValves,
      includeShredding: incShredding
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedTyreToAdd('');
    setAddQty(2);
    setFormError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nq = Math.max(1, item.quantity + delta);
          return { ...item, quantity: nq };
        }
        return item;
      })
    );
  };

  const handleToggleItemService = (id: string, serviceKey: 'mounting' | 'valves' | 'shredding') => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (serviceKey === 'mounting') return { ...item, includeMounting: !item.includeMounting };
          if (serviceKey === 'valves') return { ...item, includeNewValves: !item.includeNewValves };
          if (serviceKey === 'shredding') return { ...item, includeShredding: !item.includeShredding };
        }
        return item;
      })
    );
  };

  // Calculate order total
  const orderTotalXCD = useMemo(() => {
    return items.reduce((sum, item) => {
      let unit = item.tyre.priceXCD;
      if (item.includeMounting) unit += servicePrices.mounting;
      if (item.includeNewValves) unit += servicePrices.valves;
      if (item.includeShredding) unit += servicePrices.disposal;
      return sum + unit * item.quantity;
    }, 0);
  }, [items, servicePrices]);

  // Submit and create order
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setFormError('Customer Name is required.');
      return;
    }

    if (items.length === 0) {
      setFormError('Please add at least one tyre item to this order.');
      return;
    }

    const reservationCode = 'MTC-' + Math.floor(100000 + Math.random() * 900000);

    const newOrderData: Omit<AdminOrder, 'id' | 'timestamp'> = {
      reservationCode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '+1 (767) 275-8973',
      customerEmail: customerEmail.trim() || undefined,
      vehicleInfo: vehicleInfo.trim() || 'Customer Vehicle',
      preferredDate: preferredDate.trim() || 'Today',
      items,
      totalXCD: orderTotalXCD,
      paymentMethod,
      paymentStatus,
      dispatchStatus,
      dispatchNotes: dispatchNotes.trim() || undefined,
      dispatchMethod: 'Workshop Fitting / Staging'
    };

    onAddOrder(newOrderData);

    // Clear auto-save draft upon successful creation
    try {
      localStorage.removeItem(ADMIN_ADD_ORDER_DRAFT_KEY);
    } catch (err) {
      console.error(err);
    }

    onClose();
  };

  if (!isOpen) return null;

  const filteredTyres = tyres.filter((t) => {
    const q = tyreSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.brand.toLowerCase().includes(q) ||
      t.modelName.toLowerCase().includes(q) ||
      t.size.toLowerCase().includes(q)
    );
  });

  return (
    <div
      id="admin-add-order-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
      className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <div
        id="admin-add-order-modal-content"
        className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0984E3] text-white flex items-center justify-center font-bold shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Create New Customer Order</h3>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Intake
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Maranatha Square workshop booking, tyre allocation, and fitting staging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Save Live Status Badge */}
            {lastSavedTime && (
              <div
                id="add-order-autosave-indicator"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shadow-xs"
                title="Your order progress is automatically saved to local storage"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-saved locally ({lastSavedTime})</span>
              </div>
            )}

            <button
              id="admin-add-order-close-btn"
              type="button"
              onClick={handleCloseModal}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close modal (draft is preserved automatically in localStorage)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Restored Draft Alert Banner */}
        {isRestoredNoticeVisible && lastSavedTime && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Draft Restored:</strong> We recovered your in-progress order details from local storage (saved at {lastSavedTime}).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-amber-800 hover:text-red-700 font-bold underline flex items-center gap-1 cursor-pointer text-[11px]"
                title="Discard saved draft and start with blank form"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Draft</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRestoredNoticeVisible(false)}
                className="text-amber-600 hover:text-amber-900 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-black text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-[#0984E3]" />
              <span>1. Customer & Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Customer Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-order-customer-name"
                    type="text"
                    required
                    placeholder="e.g. John Baptiste"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0984E3] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-order-customer-phone"
                    type="tel"
                    placeholder="+1 (767) 612-xxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0984E3] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Email Address (Receipt Dispatch)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-order-customer-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0984E3] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Appointment */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-black text-xs uppercase tracking-wider">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>2. Vehicle & Workshop Appointment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Vehicle Details (Make / Model / Plate)
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-order-vehicle-info"
                    type="text"
                    placeholder="e.g. Toyota Hilux 4WD (PA-4592)"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Scheduled Time / Staging Slot
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="add-order-preferred-date"
                    type="text"
                    placeholder="e.g. Today, 2:30 PM (Bay 1)"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tyre Selection & Services */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                <Package className="w-4 h-4 text-blue-600" />
                <span>3. Selected Tyres & Fitting Services</span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'items'} in order
              </span>
            </div>

            {/* Tyre Selector Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Add Tyre to Order Cart
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                <div className="sm:col-span-6">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter tyres by size or brand..."
                      value={tyreSearch}
                      onChange={(e) => setTyreSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 mb-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <select
                    id="add-order-tyre-selector"
                    value={selectedTyreToAdd}
                    onChange={(e) => setSelectedTyreToAdd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Tyre SKU from Inventory --</option>
                    {filteredTyres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.brand} {t.modelName} ({t.size}) — EC$ {t.priceXCD.toFixed(2)} [{t.stockCount} in stock]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Qty:</span>
                  <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                      className="px-2.5 py-1.5 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 text-center text-xs font-black bg-white py-1.5 border-x border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setAddQty((q) => q + 1)}
                      className="px-2.5 py-1.5 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedTyreToAdd}
                    className="w-full bg-[#0984E3] hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Service Add-ons for New Items */}
              <div className="flex items-center gap-4 flex-wrap text-xs pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500">Include Services:</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={incMounting}
                    onChange={(e) => setIncMounting(e.target.checked)}
                    className="rounded text-[#0984E3]"
                  />
                  <span>Mounting (+EC${servicePrices.mounting})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={incValves}
                    onChange={(e) => setIncValves(e.target.checked)}
                    className="rounded text-[#0984E3]"
                  />
                  <span>New Valves (+EC${servicePrices.valves})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={incShredding}
                    onChange={(e) => setIncShredding(e.target.checked)}
                    className="rounded text-[#0984E3]"
                  />
                  <span>Eco Disposal (+EC${servicePrices.disposal})</span>
                </label>
              </div>
            </div>

            {/* Current Order Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs space-y-1">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold">No tyre items added to this order yet.</p>
                <p className="text-[11px] text-slate-400">Select a tyre above and click &quot;Add Item&quot;</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const unitTotal =
                    item.tyre.priceXCD +
                    (item.includeMounting ? servicePrices.mounting : 0) +
                    (item.includeNewValves ? servicePrices.valves : 0) +
                    (item.includeShredding ? servicePrices.disposal : 0);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.tyre.image}
                          alt={item.tyre.modelName}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                        />
                        <div>
                          <h5 className="font-black text-slate-900 text-xs">
                            {item.tyre.brand} {item.tyre.modelName}
                          </h5>
                          <span className="text-[11px] text-slate-500 font-mono block">{item.tyre.size}</span>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.includeMounting}
                                onChange={() => handleToggleItemService(item.id, 'mounting')}
                                className="rounded text-[#0984E3] w-3 h-3"
                              />
                              <span>Mount (+EC${servicePrices.mounting})</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.includeNewValves}
                                onChange={() => handleToggleItemService(item.id, 'valves')}
                                className="rounded text-[#0984E3] w-3 h-3"
                              />
                              <span>Valves (+EC${servicePrices.valves})</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.includeShredding}
                                onChange={() => handleToggleItemService(item.id, 'shredding')}
                                className="rounded text-[#0984E3] w-3 h-3"
                              />
                              <span>Shred (+EC${servicePrices.disposal})</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, -1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700 block">
                            EC$ {(unitTotal * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (EC$ {unitTotal.toFixed(2)} ea)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Payment & Workshop Staging */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-black text-xs uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>4. Payment & Workshop Staging</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Payment Method</label>
                <select
                  id="add-order-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Cash at Shop / WhatsApp">Cash at Shop / Counter</option>
                  <option value="SmartPOS Card Terminal (Tap, Insert & Swipe)">SmartPOS Card Terminal (NFC/Chip)</option>
                  <option value="Stripe Online">Stripe Online Portal</option>
                  <option value="Bank Transfer">Bank Transfer / MoMo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Payment Status</label>
                <select
                  id="add-order-payment-status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Confirmed">✓ Confirmed / Paid</option>
                  <option value="Pending">⏳ Pending Payment</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Fitting Dispatch Status</label>
                <select
                  id="add-order-dispatch-status"
                  value={dispatchStatus}
                  onChange={(e) => setDispatchStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Ready for Fitting">Ready for Fitting</option>
                  <option value="Pending">Pending Staging</option>
                  <option value="Completed">Completed & Picked Up</option>
                  <option value="Dispatched">Dispatched</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Internal Workshop Notes & Fitting Instructions
              </label>
              <textarea
                id="add-order-dispatch-notes"
                rows={2}
                placeholder="e.g. Front two wheels to replace first; check wheel balance before mounting."
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0984E3] focus:outline-hidden"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer with Totals & Submission */}
        <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-300 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Order Amount
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                EC$ {orderTotalXCD.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                approx. US$ {(orderTotalXCD / 2.70).toFixed(2)}
              </span>
            </div>

            {lastSavedTime && (
              <span className="text-[11px] text-slate-500 hidden md:inline">
                Auto-saved locally • Safe against browser refresh
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
              title="Clear all fields and discard auto-saved draft"
            >
              Clear
            </button>

            <button
              id="admin-add-order-cancel-btn"
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
              title="Close modal (draft is preserved in localStorage)"
            >
              Cancel
            </button>

            <button
              id="admin-add-order-submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={!customerName.trim() || items.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#0984E3] hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-black transition shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Create Order (EC$ {orderTotalXCD.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
