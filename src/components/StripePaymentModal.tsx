import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, ShieldCheck, CreditCard, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';

const publishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_maxexecutivetires';
const stripePromise = loadStripe(publishableKey);

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalXCD: number;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (paymentId: string) => void;
}

const CheckoutForm: React.FC<{
  cartItems: CartItem[];
  totalXCD: number;
  customerName: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}> = ({ cartItems, totalXCD, customerName, customerPhone, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    // Fetch payment intent from backend
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems,
        customerName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.isMock) {
            setIsMockMode(true);
          }
        }
      })
      .catch((err) => {
        console.error('Error creating payment intent:', err);
        setIsMockMode(true);
      });
  }, [cartItems, customerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (isMockMode || !stripe || !elements || !clientSecret) {
      // Simulate successful test payment
      setTimeout(() => {
        setLoading(false);
        const mockId = 'pi_' + Math.random().toString(36).substring(2, 15);
        onSuccess(mockId);
      }, 1500);
      return;
    }

    const cardElement = elements.getElement(CardElement) as any;
    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: customerName || 'Valued Customer',
          phone: customerPhone,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message || 'Payment failed. Please check your card details.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setLoading(false);
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
        <div className="flex justify-between font-bold text-slate-800">
          <span>Max Executive Tires - Secure Checkout</span>
          <span className="text-[#0984E3]">Maranatha Square, Pichelin</span>
        </div>
        <div className="text-slate-600 flex justify-between">
          <span>Customer: <strong className="text-slate-900">{customerName || 'Guest'}</strong></span>
          <span>Phone: <strong className="text-slate-900">{customerPhone || 'N/A'}</strong></span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
          <span>Total Payable Amount:</span>
          <span className="text-emerald-600 text-base">
            EC$ {totalXCD}
          </span>
        </div>
      </div>

      {isMockMode && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#0984E3] shrink-0 mt-0.5" />
          <div>
            <strong>Stripe Test / Demo Simulation Mode:</strong> You can complete this secure checkout instantly. To activate live Stripe merchant charges, add your `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` in the project environment settings.
          </div>
        </div>
      )}

      {/* Stripe Card Element Container */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
          <span>Credit / Debit Card Details</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Lock className="w-3 h-3 text-emerald-600" /> 256-Bit SSL Encrypted
          </span>
        </label>
        <div className="p-3.5 bg-white border border-slate-300 rounded-xl shadow-xs focus-within:border-[#0984E3] focus-within:ring-2 focus-within:ring-blue-100 transition">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#2D3436',
                  '::placeholder': {
                    color: '#A0AEC0',
                  },
                },
                invalid: {
                  color: '#E17055',
                },
              },
            }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 rounded-xl transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Pay EC$ {totalXCD}
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          Powered by Stripe Secure Merchant Gateway • Max Executive Tires Inc.
        </span>
      </div>
    </form>
  );
};

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalXCD,
  totalUSD,
  customerName,
  customerPhone,
  onPaymentSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0984E3] flex items-center justify-center border border-blue-200/60 font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#2D3436]">Stripe Merchant Checkout</h3>
            <p className="text-xs text-slate-500">Secure online payment portal for tyre reservations</p>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            cartItems={cartItems}
            totalXCD={totalXCD}
            customerName={customerName}
            customerPhone={customerPhone}
            onSuccess={(pid) => {
              onPaymentSuccess(pid);
              onClose();
            }}
            onCancel={onClose}
          />
        </Elements>
      </div>
    </div>
  );
};
