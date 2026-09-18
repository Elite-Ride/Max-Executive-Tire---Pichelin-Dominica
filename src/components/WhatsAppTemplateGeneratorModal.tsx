import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Send,
  Phone,
  Sparkles,
  Calendar,
  Wrench,
  ShieldCheck,
  Truck,
  DollarSign,
  User,
  Car,
  HelpCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';
import { SHOP_LOCATION_INFO } from '../data/servicesData';

interface WhatsAppTemplateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: AdminOrder[];
  initialOrder?: AdminOrder | null;
  servicePrices?: Record<string, number>;
}

export type WhatsAppTemplateKey =
  | 'order_confirmation'
  | 'ready_for_fitting'
  | 'payment_confirmed'
  | 'mobile_dispatch'
  | 'retorque_safety'
  | 'custom';

interface TemplateOption {
  key: WhatsAppTemplateKey;
  label: string;
  shortDesc: string;
  icon: React.ElementType;
  color: string;
  badge: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    key: 'order_confirmation',
    label: 'Order Booking & Appointment',
    shortDesc: 'Official confirmation with tyre details, services, total & fitting schedule',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    badge: 'Popular'
  },
  {
    key: 'ready_for_fitting',
    label: 'Workshop Bay Ready',
    shortDesc: 'Tyres pulled from racks and staged; vehicle bay ready for fitting',
    icon: Wrench,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    badge: 'Workshop'
  },
  {
    key: 'payment_confirmed',
    label: 'Payment & Receipt Receipt',
    shortDesc: 'Confirms payment received, balance cleared & warranty activation',
    icon: DollarSign,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    badge: 'Finance'
  },
  {
    key: 'mobile_dispatch',
    label: 'Dispatch / Tech En Route',
    shortDesc: 'Alert customer that delivery or roadside technician is on the road',
    icon: Truck,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    badge: 'Transit'
  },
  {
    key: 'retorque_safety',
    label: 'Post-Fitting Re-Torque Safety',
    shortDesc: 'Dominica driving 50-mile wheel lug re-torque advisory & follow-up',
    icon: ShieldCheck,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    badge: 'Safety'
  },
  {
    key: 'custom',
    label: 'Custom Template Builder',
    shortDesc: 'Draft custom text with 1-click dynamic order tags',
    icon: Sparkles,
    color: 'text-slate-700 bg-slate-100 border-slate-300',
    badge: 'Editor'
  }
];

export const WhatsAppTemplateGeneratorModal: React.FC<WhatsAppTemplateGeneratorModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialOrder = null,
  servicePrices = { mounting: 20, valves: 15, shredding: 1 }
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateKey>('order_confirmation');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [smsCopied, setSmsCopied] = useState<boolean>(false);

  // Sync selected order when initialOrder changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialOrder && initialOrder.id) {
        setSelectedOrderId(initialOrder.id);
        setCustomPhone(initialOrder.customerPhone || '');
      } else if (orders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(orders[0].id);
        setCustomPhone(orders[0].customerPhone || '');
      }
    }
  }, [isOpen, initialOrder, orders]);

  // Current active order object
  const currentOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || initialOrder || orders[0] || null;
  }, [orders, selectedOrderId, initialOrder]);

  // Update phone when selected order changes
  useEffect(() => {
    if (currentOrder?.customerPhone) {
      setCustomPhone(currentOrder.customerPhone);
    }
  }, [selectedOrderId]);

  // Helper variables for templates
  const orderVars = useMemo(() => {
    if (!currentOrder) {
      return {
        customerName: 'Valued Customer',
        reservationCode: 'MET-SAMPLE',
        phone: '+1 (767) 616-0155',
        vehicle: 'Vehicle on File',
        preferredDate: 'Today / Fast-Lane Priority',
        totalXCD: 0,
        paymentStatus: 'Payment Pending at Shop Counter',
        dispatchStatus: 'Pending Dispatch',
        tyresBrief: 'Standard Tyres',
        servicesBrief: 'Mounting & Balancing',
        shopName: 'Max Executive Tires',
        shopLocation: 'Maranatha Square, Pichelin, Dominica',
        shopPhone: '(767) 616-0155'
      };
    }

    const tyresBrief = (currentOrder.items || [])
      .map(item => `${item.quantity || 1}x ${item.tyre?.brand || 'Tyre'} ${item.tyre?.modelName || ''} (${item.tyre?.size || ''}) [${item.tyre?.condition || 'New'}]`)
      .join('\n• ');

    const servicesList: string[] = [];
    if (currentOrder.items?.some(i => i.includeMounting)) servicesList.push(`Mounting & Dynamic Computer Balance (EC$ ${servicePrices['mounting'] ?? 20}/tyre)`);
    if (currentOrder.items?.some(i => i.includeNewValves)) servicesList.push(`High-Pressure Valve Stems (EC$ ${servicePrices['valves'] ?? 15}/tyre)`);
    if (currentOrder.items?.some(i => i.includeShredding)) servicesList.push(`Eco-Friendly Old Tyre Shredding (EC$ ${servicePrices['shredding'] ?? 1}/tyre)`);

    return {
      customerName: currentOrder.customerName || 'Valued Customer',
      reservationCode: currentOrder.reservationCode || 'N/A',
      phone: currentOrder.customerPhone || '',
      vehicle: currentOrder.vehicleInfo || 'Vehicle on File',
      preferredDate: currentOrder.preferredDate || 'Scheduled Priority Bay',
      totalXCD: currentOrder.totalXCD || 0,
      paymentStatus: currentOrder.paymentStatus === 'Confirmed' ? 'PAID & CONFIRMED' : 'DUE AT WORKSHOP COUNTER',
      dispatchStatus: currentOrder.dispatchStatus || 'Pending Fitting',
      tyresBrief: tyresBrief ? `• ${tyresBrief}` : '• Tyres Selected',
      servicesBrief: servicesList.length > 0 ? servicesList.map(s => `• ${s}`).join('\n') : '• Fitting Only',
      shopName: 'Max Executive Tires',
      shopLocation: 'Maranatha Square, Pichelin, Dominica',
      shopPhone: '(767) 616-0155'
    };
  }, [currentOrder, servicePrices]);

  // Generate template message text based on template key
  const generateTemplateContent = (templateKey: WhatsAppTemplateKey): string => {
    switch (templateKey) {
      case 'order_confirmation':
        return `*MAX EXECUTIVE TIRES — PICHELIN, DOMINICA*
📍 _Maranatha Square, Pichelin_ | 📞 _${orderVars.shopPhone}_

Hello *${orderVars.customerName}*,

Thank you for choosing Max Executive Tires! Your tyre reservation and workshop fitting appointment has been received.

📋 *ORDER SUMMARY:*
• *Reservation Code:* *#${orderVars.reservationCode}*
• *Vehicle:* ${orderVars.vehicle}
• *Scheduled Date/Time:* *${orderVars.preferredDate}*
• *Fitting Bay Status:* ${orderVars.dispatchStatus}

🛞 *TYRES RESERVED:*
${orderVars.tyresBrief}

🔧 *WORKSHOP SERVICES INCLUDED:*
${orderVars.servicesBrief}

💰 *TOTAL AMOUNT:* *EC$ ${orderVars.totalXCD}*
💳 *Payment Status:* *${orderVars.paymentStatus}*

📌 *DIRECTIONS TO BAY:*
Our workshop is located at *Maranatha Square, Pichelin* on the main highway. Look for the blue Max Executive Tires service signs.

Please arrive 10 minutes prior to your preferred time for immediate vehicle bay intake. If you need to modify your appointment, reply directly to this message or call *${orderVars.shopPhone}*.

_We look forward to keeping you rolling safely on Dominica's roads!_`;

      case 'ready_for_fitting':
        return `*WORKSHOP BAY READY — MAX EXECUTIVE TIRES*
📍 _Maranatha Square, Pichelin_

Good day *${orderVars.customerName}*,

Great news! The tyres for your order *#${orderVars.reservationCode}* have been pulled from our warehouse racks, quality-checked, and staged in our workshop bay.

🛞 *Items Ready:*
${orderVars.tyresBrief}

🚗 *Vehicle:* ${orderVars.vehicle}
💰 *Total Due:* *EC$ ${orderVars.totalXCD}* (${orderVars.paymentStatus})

Your service bay at *Maranatha Square, Pichelin* is prepped for immediate drive-in fitting and computerized wheel balancing.

Please let us know your estimated arrival time today so our technicians have the torque wrenches ready for you!

📞 Workshop Desk: *${orderVars.shopPhone}*`;

      case 'payment_confirmed':
        return `*PAYMENT CONFIRMATION & OFFICIAL RECEIPT*
*MAX EXECUTIVE TIRES — DOMINICA*

Dear *${orderVars.customerName}*,

We confirm receipt of payment for your order *#${orderVars.reservationCode}*.

🧾 *TRANSACTION DETAILS:*
• *Reference:* #${orderVars.reservationCode}
• *Total Paid:* *EC$ ${orderVars.totalXCD}*
• *Payment Status:* *CONFIRMED & SETTLED*
• *Customer:* ${orderVars.customerName} (${orderVars.phone})
• *Vehicle:* ${orderVars.vehicle}

🛞 *Items & Workshop Services:*
${orderVars.tyresBrief}

🛡️ *WARRANTY & GUARANTEE:*
Your tyres and bead seating are covered under our comprehensive Dominica Road-Hazard and Workmanship standard. Keep this digital receipt for your vehicle maintenance logs.

Thank you for trusting Dominica's premier tyre specialists!
📍 Maranatha Square, Pichelin | 📞 ${orderVars.shopPhone}`;

      case 'mobile_dispatch':
        return `*🚐 MOBILE TYRE DISPATCH EN ROUTE*
*MAX EXECUTIVE TIRES ROADSIDE & WORKSHOP TEAM*

Hello *${orderVars.customerName}*,

Our mobile technician has been dispatched with your tyres and mobile fitting equipment for Order *#${orderVars.reservationCode}*!

📍 *Destination Vehicle:* ${orderVars.vehicle}
🛞 *Tyres Onboard:*
${orderVars.tyresBrief}

⏰ *Estimated Arrival Window:* As scheduled for ${orderVars.preferredDate}
💰 *Total Amount:* *EC$ ${orderVars.totalXCD}* (${orderVars.paymentStatus})

Please ensure the vehicle is parked on reasonably firm, accessible ground for safe hydraulic jacking. Our driver will call you upon arrival at ${orderVars.phone}.

For real-time dispatch updates, reply here or call *${orderVars.shopPhone}*.`;

      case 'retorque_safety':
        return `*⚠️ IMPORTANT POST-FITTING SAFETY ADVISORY*
*MAX EXECUTIVE TIRES — PICHELIN*

Hi *${orderVars.customerName}*,

Thank you for visiting Max Executive Tires at Maranatha Square for your recent tyre fitting (Order *#${orderVars.reservationCode}*).

🔧 *50-MILE (80 KM) LUG NUT RE-TORQUE NOTICE:*
Due to Dominica's mountain grades, winding roads, and terrain, alloy and steel wheel nuts require settling. We strongly recommend having your wheel nuts re-torqued after *50 miles (80 km)* of driving.

✅ *Free Complimentary Service:*
Stop by our Pichelin shop at any time — our technicians will check and re-torque all wheel lugs to factory specifications in under 3 minutes, completely *FREE OF CHARGE*.

💨 Also remember to check cold tyre pressure (PSI) monthly.

Stay safe on the road!
📞 Roadside & Emergency SOS: *${orderVars.shopPhone}*`;

      case 'custom':
        return `*MAX EXECUTIVE TIRES — PICHELIN, DOMINICA*

Hello *${orderVars.customerName}*,

Regarding your order *#${orderVars.reservationCode}* for ${orderVars.vehicle}:

${orderVars.tyresBrief}

Total: *EC$ ${orderVars.totalXCD}* (${orderVars.paymentStatus})
Scheduled: *${orderVars.preferredDate}*

Please let us know if you have any questions. We are located at Maranatha Square, Pichelin. Call us at ${orderVars.shopPhone}.`;

      default:
        return '';
    }
  };

  // Re-generate text when template or order changes
  useEffect(() => {
    const text = generateTemplateContent(selectedTemplate);
    setMessageText(text);
  }, [selectedTemplate, selectedOrderId, orderVars]);

  if (!isOpen) return null;

  // Clean phone number for WhatsApp link (e.g. Dominica +1767...)
  const getCleanWhatsAppPhone = (rawPhone: string) => {
    let digits = rawPhone.replace(/[^0-9]/g, '');
    if (!digits) return '17676160155';
    // If 7 digits (local Dominica format e.g. 6160155 or 2750155)
    if (digits.length === 7) {
      digits = '1767' + digits;
    } else if (digits.length === 10 && digits.startsWith('767')) {
      digits = '1' + digits;
    }
    return digits;
  };

  const cleanPhone = getCleanWhatsAppPhone(customPhone || orderVars.phone);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySms = () => {
    // Strip whatsapp markdown asterisks for plain SMS
    const plainSms = messageText.replace(/\*/g, '').replace(/_/g, '');
    navigator.clipboard.writeText(plainSms);
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 2500);
  };

  const insertVariableTag = (tag: string) => {
    setMessageText(prev => prev + ' ' + tag);
  };

  return (
    <div
      id="whatsapp-template-generator-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  WhatsApp Customer Confirmation Template Generator
                </h3>
                <span className="hidden sm:inline-block text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  Direct Messenger
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Pre-formatted customer updates with order codes, pricing, workshop bay status & Dominica safety notices
              </p>
            </div>
          </div>

          <button
            id="close-whatsapp-generator-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
            title="Close Template Generator"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Select Target Order & Destination Phone */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Order Selector */}
          <div className="sm:col-span-6 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Target Order & Customer:</span>
            </label>
            <select
              id="whatsapp-order-selector"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {orders.length === 0 && <option value="">No orders on file</option>}
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.reservationCode} — {o.customerName} ({o.customerPhone}) | EC$ {o.totalXCD} [{o.dispatchStatus || 'Pending'}]
                </option>
              ))}
            </select>
          </div>

          {/* Customer Phone & WhatsApp format */}
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer WhatsApp / Mobile:</span>
            </label>
            <div className="relative">
              <input
                id="whatsapp-custom-phone-input"
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="e.g. (767) 616-0155 or 767..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                wa.me/+{cleanPhone}
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              id="whatsapp-quick-open-btn"
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black px-3 py-2.5 rounded-xl shadow-md transition cursor-pointer"
              title="Launch WhatsApp chat with pre-formatted message"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Now</span>
            </button>
          </div>
        </div>

        {/* Template Selection Pills */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">
              Templates:
            </span>
            {TEMPLATE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedTemplate === opt.key;
              return (
                <button
                  key={opt.key}
                  id={`whatsapp-tpl-btn-${opt.key}`}
                  type="button"
                  onClick={() => setSelectedTemplate(opt.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{opt.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {opt.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Body: Two Columns (Editor on Left, Live Mockup Preview on Right) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-100/60">
          {/* Left Column: Message Editor & Variable Insertion */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Live Template Editor
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({messageText.length} chars)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMessageText(generateTemplateContent(selectedTemplate))}
                  className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition"
                  title="Reset to original template text"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Template</span>
                </button>
              </div>

              {/* Textarea */}
              <textarea
                id="whatsapp-message-editor-textarea"
                rows={14}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full flex-1 p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-y"
                placeholder="Compose or modify WhatsApp confirmation text..."
              />

              {/* Dynamic Tag Injectors */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Click to insert dynamic order tag:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Use *bold* for WhatsApp bolding
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => insertVariableTag(`*${orderVars.customerName}*`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Customer Name
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag(`*#${orderVars.reservationCode}*`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Order Code
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag(`*EC$ ${orderVars.totalXCD}*`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Total EC$
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag(`*${orderVars.preferredDate}*`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Scheduled Time
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag(`*${orderVars.vehicle}*`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Vehicle Info
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag(`*${orderVars.paymentStatus}*`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Payment Status
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag(orderVars.shopLocation)}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-semibold border border-slate-200 transition"
                  >
                    + Pichelin Location
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp Phone Chat Mockup */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Preview Mockup</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Customer View
                </span>
              </div>

              {/* Realistic Phone Shell Container */}
              <div className="flex-1 bg-[#ECE5DD] rounded-2xl border border-slate-300 p-3 flex flex-col shadow-inner overflow-hidden relative min-h-[360px]">
                {/* Simulated WhatsApp Header */}
                <div className="bg-[#075E54] text-white -mx-3 -mt-3 p-2.5 px-3 flex items-center justify-between shadow-xs mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#075E54] font-black text-xs flex items-center justify-center border border-white/40">
                      MET
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        Max Executive Tires (Shop Admin)
                      </div>
                      <div className="text-[9px] text-emerald-100/90 leading-tight">
                        Dominica Tyre Hotline & Bay Desk
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Chat Bubble Date Badge */}
                <div className="flex justify-center mb-2">
                  <span className="bg-white/80 backdrop-blur-xs text-[9px] font-bold text-slate-600 px-2 py-0.5 rounded-md shadow-2xs">
                    TODAY
                  </span>
                </div>

                {/* Simulated WhatsApp Outgoing Message Bubble */}
                <div className="self-end max-w-[92%] bg-[#DCF8C6] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs text-[11px] leading-relaxed relative border border-[#C5E1A5] break-words whitespace-pre-wrap">
                  {messageText}

                  {/* Bubble timestamp & double check */}
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-500">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#34B7F1] font-bold">✓✓</span>
                  </div>
                </div>

                {/* Security encryption footnote */}
                <div className="mt-auto pt-3 text-center">
                  <span className="text-[9px] text-slate-500 bg-white/60 px-2 py-0.5 rounded shadow-2xs">
                    🔒 Messages are end-to-end encrypted
                  </span>
                </div>
              </div>

              {/* Action Buttons underneath preview */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <button
                  id="whatsapp-launch-main-btn"
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch WhatsApp to {cleanPhone}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="whatsapp-copy-text-btn"
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-300 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copied ? 'Copied Message!' : 'Copy WhatsApp Text'}</span>
                  </button>

                  <button
                    id="whatsapp-copy-sms-btn"
                    type="button"
                    onClick={handleCopySms}
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-300 transition cursor-pointer"
                    title="Copy formatted as plain SMS text"
                  >
                    {smsCopied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Send className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{smsCopied ? 'Copied Plain SMS!' : 'Copy Plain SMS'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Direct link opens WhatsApp Web or WhatsApp Desktop targeting customer&apos;s phone.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
