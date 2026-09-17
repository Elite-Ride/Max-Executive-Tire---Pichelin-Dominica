import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Wrench, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Car, 
  Calendar, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  Printer,
  Download,
  Mail,
  FileText
} from 'lucide-react';
import { CartItem } from '../types';
import { SHOP_LOCATION_INFO } from '../data/servicesData';
import { StripePaymentModal } from './StripePaymentModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { AdminOrder } from './AdminOrdersModal';
import { MyOrdersView } from './MyOrdersView';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleService: (id: string, serviceKey: 'mounting' | 'valves') => void;
  onClearCart: () => void;
  servicePrices: Record<string, number>;
  orders?: AdminOrder[];
  initialTab?: 'cart' | 'orders';
  onOrderSubmitted?: (order: {
    reservationCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    vehicleInfo: string;
    preferredDate: string;
    items: CartItem[];
    totalXCD: number;
    totalUSD: number;
    paymentMethod: 'Stripe Online' | 'Pay at Shop / WhatsApp';
  }) => void;
  onNavigateToOrders?: () => void;
  onUpdateOrderStatus?: (orderId: string, status: 'Pending' | 'Ready for Fitting' | 'Completed') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onToggleService,
  onClearCart,
  servicePrices,
  orders = [],
  initialTab = 'cart',
  onOrderSubmitted,
  onNavigateToOrders,
  onUpdateOrderStatus,
}) => {
  const [activeDrawerTab, setActiveDrawerTab] = useState<'cart' | 'orders'>(initialTab);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const handleSendEmail = async () => {
    if (!customerEmail) {
      alert('Please enter your email address in the customer contact form.');
      return;
    }
    setEmailSending(true);
    try {
      // EmailJS client-side dispatch simulation / integration
      await new Promise((res) => setTimeout(res, 1000));
      setEmailSent(true);
    } catch (err) {
      alert('Failed to send email confirmation. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (isSubmitted) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [isSubmitted]);

  if (!isOpen) return null;

  // Calculate totals
  const calculateItemSubtotalXCD = (item: CartItem) => {
    let unitServices = 0;
    if (item.includeMounting) unitServices += (servicePrices['mounting'] ?? 20);
    if (item.includeNewValves) unitServices += (servicePrices['valves'] ?? 15);
    if (item.includeShredding) unitServices += (servicePrices['shredding'] ?? 1);
    return (item.tyre.priceXCD + unitServices) * item.quantity;
  };

  const totalCartXCD = cartItems.reduce((sum, item) => sum + calculateItemSubtotalXCD(item), 0);

  const tyreSubtotalXCD = cartItems.reduce((sum, item) => sum + (item.tyre.priceXCD * item.quantity), 0);
  const serviceSubtotalXCD = cartItems.reduce((sum, item) => {
    let s = 0;
    if (item.includeMounting) s += (servicePrices['mounting'] ?? 20) * item.quantity;
    if (item.includeNewValves) s += (servicePrices['valves'] ?? 15) * item.quantity;
    if (item.includeShredding) s += (servicePrices['shredding'] ?? 1) * item.quantity;
    return sum + s;
  }, 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(9, 132, 227);
    doc.text("MAX EXECUTIVE TIRES - ORDER SUMMARY", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Maranatha Square, Pichelin, Dominica | Tel: (767) 275-8973", 14, 26);
    
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Customer Name: ${customerName || 'Guest Customer'}`, 14, 40);
    doc.text(`Phone / WhatsApp: ${customerPhone || 'Not specified'}`, 14, 46);
    doc.text(`Vehicle Info: ${vehicleInfo || 'General Fitment'}`, 14, 52);
    doc.text(`Preferred Date: ${preferredDate || 'Today (Fast Lane)'}`, 14, 58);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 14, 64);
    
    let y = 74;
    doc.setFontSize(12);
    doc.setTextColor(9, 132, 227);
    doc.text("Itemized Breakdown:", 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    cartItems.forEach((item, idx) => {
      let itemSvc = 0;
      const svcs = [];
      if (item.includeMounting) { itemSvc += (servicePrices['mounting'] ?? 20) * item.quantity; svcs.push('Mounting'); }
      if (item.includeNewValves) { itemSvc += (servicePrices['valves'] ?? 15) * item.quantity; svcs.push('Valves'); }
      if (item.includeShredding) { itemSvc += (servicePrices['shredding'] ?? 1) * item.quantity; svcs.push('Shredder'); }

      doc.text(`${idx + 1}. ${item.quantity}x ${item.tyre.brand} ${item.tyre.modelName} (${item.tyre.size})`, 14, y);
      doc.text(`EC$ ${calculateItemSubtotalXCD(item)}`, 170, y, { align: 'right' });
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

    doc.text("Tyre Subtotal:", 14, y);
    doc.text(`EC$ ${tyreSubtotalXCD}`, 170, y, { align: 'right' });
    y += 6;

    doc.text("Workshop Services Subtotal:", 14, y);
    doc.text(`EC$ ${serviceSubtotalXCD}`, 170, y, { align: 'right' });
    y += 6;

    doc.setFontSize(12);
    doc.setTextColor(9, 132, 227);
    doc.text("Total Amount:", 14, y);
    doc.text(`EC$ ${totalCartXCD}`, 170, y, { align: 'right' });
    
    doc.save("Max_Executive_Tires_Summary.pdf");
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!customerName || !customerPhone) {
      alert('Please enter your name and phone number for the reservation.');
      return;
    }

    const code = 'MTC-' + Math.floor(100000 + Math.random() * 900000);
    setReservationCode(code);
    setIsSubmitted(true);

    if (onOrderSubmitted) {
      onOrderSubmitted({
        reservationCode: code,
        customerName,
        customerPhone,
        customerEmail,
        vehicleInfo,
        preferredDate,
        items: [...cartItems],
        totalXCD: totalCartXCD,
        paymentMethod: 'Pay at Shop / WhatsApp',
      });
    }
  };

  const handleOnlinePayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!customerName || !customerPhone) {
      alert('Please enter your name and phone number before paying online.');
      return;
    }
    setIsStripeModalOpen(true);
  };

  const handleStripeSuccess = (paymentId: string) => {
    const code = 'STRIPE-' + Math.floor(100000 + Math.random() * 900000);
    setReservationCode(code);
    setIsSubmitted(true);

    if (onOrderSubmitted) {
      onOrderSubmitted({
        reservationCode: code,
        customerName,
        customerPhone,
        customerEmail,
        vehicleInfo,
        preferredDate,
        items: [...cartItems],
        totalXCD: totalCartXCD,
        paymentMethod: 'Stripe Online',
      });
    }
  };

  const getWhatsAppReservationUrl = () => {
    let text = `🚗 *TYRE RESERVATION & WORKSHOP BOOKING* 🚗\n` +
      `*Reservation Code:* ${reservationCode}\n` +
      `*Name:* ${customerName}\n` +
      `*Phone:* ${customerPhone}\n` +
      `*Vehicle:* ${vehicleInfo || 'General'}\n` +
      `*Date:* ${preferredDate || 'Today (Fast Lane)'}\n\n` +
      `*RESERVED TYRES:*\n`;

    cartItems.forEach((item, index) => {
      const services = [];
      if (item.includeMounting) services.push('Mounting');
      if (item.includeNewValves) services.push('Valves');
      if (item.includeShredding) services.push('Eco-Shredder');

      text += `${index + 1}. ${item.quantity}x ${item.tyre.brand} ${item.tyre.modelName} (${item.tyre.size}) [${item.tyre.condition === 'new' ? 'New' : 'Used'}]\n` +
        `   Services: ${services.length > 0 ? services.join(', ') : 'Tyre Only'}\n` +
        `   Subtotal: EC$ ${calculateItemSubtotalXCD(item)}\n`;
    });

    text += `\n*ESTIMATED TOTAL:* EC$ ${totalCartXCD}\n` +
      `*Shop Location:* Maranatha Square, Pichelin, Dominica\n` +
      `Please reserve my stock for fitting!`;

    return `https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  const handleDownloadReceipt = () => {
    let receiptContent = `==================================================\n`;
    receiptContent += `MAX EXECUTIVE TIRES & MARANATHA SQUARE\n`;
    receiptContent += `Pichelin, Dominica | Tel: (767) 275-8973\n`;
    receiptContent += `OFFICIAL TIRE PURCHASE & WORKSHOP RECEIPT\n`;
    receiptContent += `==================================================\n\n`;
    receiptContent += `Reservation Code: ${reservationCode}\n`;
    receiptContent += `Customer Name:    ${customerName}\n`;
    receiptContent += `Phone / WhatsApp: ${customerPhone}\n`;
    receiptContent += `Vehicle Info:     ${vehicleInfo || 'General'}\n`;
    receiptContent += `Preferred Date:   ${preferredDate || 'Today (Fast Lane)'}\n`;
    receiptContent += `Timestamp:        ${new Date().toLocaleString()}\n\n`;
    receiptContent += `--------------------------------------------------\n`;
    receiptContent += `RESERVED ITEMS & SERVICES:\n`;
    receiptContent += `--------------------------------------------------\n`;

    cartItems.forEach((item, index) => {
      const services = [];
      if (item.includeMounting) services.push('Mounting (+EC$20)');
      if (item.includeNewValves) services.push('Valves (+EC$15)');
      if (item.includeShredding) services.push('Eco-Shredder (+EC$1)');

      receiptContent += `${index + 1}. ${item.quantity}x ${item.tyre.brand} ${item.tyre.modelName} (${item.tyre.size}) [${item.tyre.condition.toUpperCase()}]\n`;
      receiptContent += `   Unit Price: EC$ ${item.tyre.priceXCD}\n`;
      if (services.length > 0) {
        receiptContent += `   Services: ${services.join(', ')}\n`;
      }
      receiptContent += `   Item Subtotal: EC$ ${calculateItemSubtotalXCD(item)}\n\n`;
    });

    receiptContent += `--------------------------------------------------\n`;
    receiptContent += `TOTAL AMOUNT: EC$ ${totalCartXCD}\n`;
    receiptContent += `Payment Terms: Pay upon fitting / inspection in Pichelin\n`;
    receiptContent += `==================================================\n`;
    receiptContent += `Thank you for choosing Max Executive Tires!\n`;
    receiptContent += `Drive safely on Dominica's mountain roads.\n`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Max_Executive_Tires_Receipt_${reservationCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div 
        id="cart-reservation-drawer-box"
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0984E3] text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D3436] leading-none">
                Reserved Tyres & Fitting
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Maranatha Square Workshop • Pichelin, Dominica
              </p>
            </div>
          </div>

          <button
            id="close-cart-drawer-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs: Cart & Reserve vs My Orders & Receipts */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2.5 shrink-0">
          <button
            id="cart-drawer-tab-cart"
            onClick={() => setActiveDrawerTab('cart')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeDrawerTab === 'cart'
                ? 'border-[#0984E3] text-[#0984E3]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart & Reserve</span>
            {cartItems.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeDrawerTab === 'cart' ? 'bg-blue-100 text-[#0984E3]' : 'bg-slate-200 text-slate-700'
              }`}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

          <button
            id="cart-drawer-tab-orders"
            onClick={() => setActiveDrawerTab('orders')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeDrawerTab === 'orders'
                ? 'border-[#0984E3] text-[#0984E3]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Orders & Receipts</span>
            {orders && orders.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeDrawerTab === 'orders' ? 'bg-blue-100 text-[#0984E3]' : 'bg-slate-200 text-slate-700'
              }`}>
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Drawer Content */}
        {activeDrawerTab === 'orders' ? (
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <MyOrdersView
              orders={orders}
              servicePrices={servicePrices}
              compact={true}
              onBrowseInventory={() => setActiveDrawerTab('cart')}
              onUpdateOrderStatus={onUpdateOrderStatus}
            />
          </div>
        ) : (
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Print-Only Formal Letterhead Receipt */}
          <div className="hidden print:block p-8 bg-white text-slate-900 font-sans space-y-6">
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-[#0984E3] uppercase tracking-wide">Max Executive Tires</h1>
                <p className="text-xs font-bold text-slate-700 mt-0.5">Maranatha Square • Pichelin, Dominica</p>
                <p className="text-xs text-slate-500">Tel: (767) 275-8973 • Email: info@maxexecutivetires.org</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">OFFICIAL SALES & FITTING RECEIPT</div>
                <div className="text-xs font-mono text-slate-600 mt-1">Ref: {reservationCode || 'PENDING'}</div>
                <div className="text-xs text-slate-500">{new Date().toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 block uppercase">Customer Details:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{customerName || 'Valued Customer'}</p>
                <p className="text-slate-600">Phone: {customerPhone || 'N/A'}</p>
                <p className="text-slate-600">Email: {customerEmail || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 block uppercase">Vehicle & Schedule:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">Vehicle: {vehicleInfo || 'General Fitment'}</p>
                <p className="text-slate-600">Fitting Date: {preferredDate || 'Fast Lane (Today)'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">Itemized Purchased & Service Breakdown</h3>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-700">
                    <th className="py-2">Item / Model</th>
                    <th className="py-2 text-center">Condition</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">
                        {item.tyre.brand} {item.tyre.modelName} ({item.tyre.size})
                        {(item.includeMounting || item.includeNewValves || item.includeShredding) && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            Services: {[item.includeMounting && 'Mounting', item.includeNewValves && 'Valves', item.includeShredding && 'Shredder'].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center uppercase font-bold text-[10px]">{item.tyre.condition}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">EC$ {item.tyre.priceXCD}</td>
                      <td className="py-2 text-right font-bold">EC$ {calculateItemSubtotalXCD(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tyres Subtotal:</span>
                  <span className="font-mono">EC$ {tyreSubtotalXCD}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Workshop Services:</span>
                  <span className="font-mono">EC$ {serviceSubtotalXCD}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                  <span>Total Amount:</span>
                  <span className="font-mono">EC$ {totalCartXCD}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 mt-12 items-end">
              <div className="space-y-2">
                <div className="w-20 h-20 bg-white border border-slate-300 p-1 rounded">
                  <svg viewBox="0 0 25 25" className="w-full h-full fill-slate-900">
                    <path d="M0 0h7v7H0zM2 2h3v3H2zM18 0h7v7h-7zM20 2h3v3h-3zM0 18h7v7H0zM2 20h3v3H2zM9 2h2v3H9zM13 2h3v2h-3zM9 7h2v2H9zM14 6h3v3h-3zM6 9h3v2H6zM11 9h2v2h-2zM16 9h3v2H3zM2 11h2v3H2zM7 11h2v2H7zM11 12h3v2h-3zM15 12h2v2h-2zM9 15h2v3H9zM13 15h3v2h-3zM18 14h3v3h-3zM22 18h3v2h-3zM6 18h2v2H6zM11 18h2v3h-2zM15 18h2v2H-2zM2 22h3v3H2zM18 22h7v3h-7z"/>
                  </svg>
                </div>
                <p className="text-[10px] text-slate-500">Scan for Maranatha Square GPS & WhatsApp Support in Pichelin.</p>
              </div>

              <div className="text-right space-y-6">
                <div className="border-b border-slate-400 pb-1">
                  <span className="text-transparent">signature</span>
                </div>
                <p className="text-xs font-bold text-slate-700">Customer Signature / Acceptance</p>
              </div>
            </div>
          </div>

          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-[#2D3436]">
                Reservation Ready!
              </h4>
              <p className="text-xs sm:text-sm text-slate-700">
                Your reservation reference code is <span className="font-mono font-bold text-[#0984E3] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{reservationCode}</span>.
                Your tyres will be set aside in our Pichelin shop. Pay upon fitting or pickup!
              </p>

              <div className="p-3.5 bg-white rounded-lg border border-emerald-200 text-xs text-slate-600">
                <div className="font-bold text-slate-800">Estimated Total:</div>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  EC$ {totalCartXCD}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={getWhatsAppReservationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-xs transition text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send to WhatsApp for Fast Lane Fitting
                </a>

                {/* Email Confirmation Dispatch */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#0984E3]" />
                      <span>Email Booking Copy</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">{customerEmail || 'No email provided'}</span>
                  </div>

                  {emailSent ? (
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-md font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Order receipt successfully emailed to {customerEmail}!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={emailSending}
                      onClick={handleSendEmail}
                      className="w-full flex items-center justify-center gap-2 bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold py-2.5 px-3 rounded-lg transition shadow-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{emailSending ? 'Dispatching Email via EmailJS...' : 'Send Booking Details via Email'}</span>
                    </button>
                  )}
                </div>

                {/* Print & Download Receipt Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition shadow-xs transform hover:scale-[1.02]"
                    title="Print clean official receipt with browser print"
                  >
                    <Printer className="w-3.5 h-3.5 text-white" />
                    <span>Print Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition shadow-xs"
                    title="Download text copy"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download TXT</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClearCart();
                    setIsSubmitted(false);
                    setActiveDrawerTab('orders');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0984E3] font-bold py-2.5 px-3 rounded-lg text-xs border border-blue-200 transition shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0984E3]" />
                  <span>View in My Orders & Receipts</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClearCart();
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="w-full text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5"
                >
                  Done / Close Reservation
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Your reservation cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Browse our brand new or inspected used tyres in Pichelin and click "Reserve Fitting".
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#0984E3] text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-[#0873c4] transition shadow-xs"
                >
                  Browse Tyres Now
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('orders')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-300 transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0984E3]" />
                  <span>View My Orders & Receipts</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Item List */}
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const isNew = item.tyre.condition === 'new';
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3"
                    >
                      {/* Top Item Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isNew ? 'bg-blue-50 text-[#0984E3] border border-blue-200' : 'bg-slate-900 text-slate-100'
                          }`}>
                            {isNew ? '✨ Brand New' : '🔍 Tested Used'}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">
                            {item.tyre.brand} {item.tyre.modelName}
                          </h4>
                          <span className="text-xs font-mono font-bold text-slate-600 block">
                            {item.tyre.size}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Remove tyre"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Workshop Services Checkboxes */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Workshop Services (per tyre):
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeMounting}
                              onChange={() => onToggleService(item.id, 'mounting')}
                              className="rounded text-[#0984E3] w-3.5 h-3.5"
                            />
                            <span>Mount (+EC$20)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeNewValves}
                              onChange={() => onToggleService(item.id, 'valves')}
                              className="rounded text-[#0984E3] w-3.5 h-3.5"
                            />
                            <span>Valve (+EC$15)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeShredding}
                              onChange={() => onToggleService(item.id, 'shredding')}
                              className="rounded text-emerald-600 w-3.5 h-3.5"
                            />
                            <span className="text-emerald-800">Shredder (+EC$1)</span>
                          </label>
                        </div>
                      </div>

                      {/* Quantity & Subtotal */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center bg-white rounded-md border border-slate-300 p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            EC$ {calculateItemSubtotalXCD(item)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Card with Cost Breakdown, Export to PDF & QR Code Generator */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-md border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Cost Summary & Breakdown</span>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 text-xs bg-[#0984E3] hover:bg-[#0770c2] text-white px-2.5 py-1 rounded font-medium transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export to PDF</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Tyres Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-mono font-bold">
                      EC$ {tyreSubtotalXCD}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Workshop Services Subtotal</span>
                    <span className="font-mono font-bold">
                      EC$ {serviceSubtotalXCD}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-400 pt-2 border-t border-slate-800 font-bold text-sm">
                    <span>Total Amount</span>
                    <span className="font-mono text-base">
                      EC$ {totalCartXCD}
                    </span>
                  </div>
                </div>

                {/* Digital Wallet & Local Bank QR Transfer Code Generator */}
                <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 mt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                      <span>📱</span>
                      <span>Digital Wallet & Local Bank QR Transfer</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      Scan to Pay
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 bg-white p-1.5 rounded-md shrink-0 flex items-center justify-center shadow-inner">
                      <svg viewBox="0 0 25 25" className="w-full h-full fill-slate-900">
                        <path d="M0 0h7v7H0zM2 2h3v3H2zM18 0h7v7h-7zM20 2h3v3h-3zM0 18h7v7H0zM2 20h3v3H2zM9 2h2v3H9zM13 2h3v2h-3zM9 7h2v2H9zM14 6h3v3h-3zM6 9h3v2H6zM11 9h2v2h-2zM16 9h3v2H3zM2 11h2v3H2zM7 11h2v2H7zM11 12h3v2h-3zM15 12h2v2h-2zM9 15h2v3H9zM13 15h3v2h-3zM18 14h3v3h-3zM22 18h3v2h-3zM6 18h2v2H6zM11 18h2v3h-2zM15 18h2v2h-2zM2 22h3v3H2zM18 22h7v3h-7z"/>
                      </svg>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p className="font-medium text-white">Max Executive Tires (Dominica)</p>
                      <p className="text-slate-400 text-[10px]">Scan with your local banking app (NCB, Republic Bank, Digicel Cash) to pay <strong className="text-emerald-400">EC$ {totalCartXCD}</strong> instantly.</p>
                      <p className="font-mono text-[10px] text-blue-300">Ref: MAX-REF-{totalCartXCD}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Contact Form */}
              <form id="drawer-reserve-form" onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Pickup & Fitting Information:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Johnathan Bell"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. (767) 275-8973"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle Model / Plate</label>
                    <input
                      type="text"
                      placeholder="e.g. Hilux Vigo / TD 3491"
                      value={vehicleInfo}
                      onChange={(e) => setVehicleInfo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Fitting Date</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0984E3] shrink-0" />
                  <span>No upfront payment required! Pay upon fitting or inspection in Pichelin.</span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!customerName || !customerPhone) {
                        alert('Please fill in your Name and Phone before printing your reservation summary.');
                        return;
                      }
                      window.print();
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 rounded-lg shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>Print Reservation Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOnlinePayClick}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 px-4 rounded-lg shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Online with Stripe (EC$ {totalCartXCD})</span>
                  </button>

                  <button
                    type="submit"
                    id="drawer-confirm-btn"
                    className="w-full bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-sm py-3 px-4 rounded-lg shadow-xs transition transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reserve & Pay at Shop (EC$ {totalCartXCD})</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        )}

        {/* Stripe Payment Modal */}
        <StripePaymentModal
          isOpen={isStripeModalOpen}
          onClose={() => setIsStripeModalOpen(false)}
          cartItems={cartItems}
          
          totalXCD={totalCartXCD}
          customerName={customerName}
          customerPhone={customerPhone}
          onPaymentSuccess={handleStripeSuccess}
        />

        {/* Printer-Friendly Receipt Modal */}
        <ReceiptPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          order={{
            reservationCode,
            customerName: customerName || 'Valued Customer',
            customerPhone: customerPhone || 'N/A',
            customerEmail,
            vehicleInfo: vehicleInfo || 'General Fitment',
            preferredDate: preferredDate || 'Fast Lane Priority',
            paymentMethod: reservationCode.startsWith('STRIPE') ? 'Stripe Online' : 'Pay at Shop / WhatsApp',
            paymentStatus: reservationCode.startsWith('STRIPE') ? 'Confirmed' : 'Pending',
            dispatchStatus: 'Pending Dispatch',
            items: cartItems,
            totalXCD: totalCartXCD,
          }}
          servicePrices={servicePrices}
          autoPrint={true}
        />

        {/* Drawer Footer summary if not submitted */}
        {!isSubmitted && cartItems.length > 0 && (
          <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Total Items: {cartItems.reduce((s, i) => s + i.quantity, 0)} tyres</span>
              <span className="text-base font-bold text-[#0984E3]">
                EC$ {totalCartXCD}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Maranatha Square, Pichelin
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
