import React from 'react';
import {
  Clock,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AdminOrder } from './AdminOrdersModal';

interface OrderTimelineProgressBarProps {
  order: AdminOrder;
  onUpdateStatus?: (newStatus: 'Pending' | 'Ready for Fitting' | 'Completed') => void;
  interactive?: boolean;
}

export const OrderTimelineProgressBar: React.FC<OrderTimelineProgressBarProps> = ({
  order,
  onUpdateStatus,
  interactive = true
}) => {
  const dispatchStatus = order.dispatchStatus || 'Pending Dispatch';
  const isPaid = order.paymentStatus === 'Confirmed';
  const isCompleted = dispatchStatus === 'Dispatched' || dispatchStatus === 'Completed';
  const isReady = dispatchStatus === 'Ready for Fitting' || dispatchStatus === 'Scheduled';
  const isPending = !isReady && !isCompleted;

  // Calculate current step index (0 to 3)
  let currentStepIndex = 0;
  if (isCompleted) {
    currentStepIndex = 3;
  } else if (isReady) {
    currentStepIndex = 2;
  } else if (isPaid) {
    currentStepIndex = 1;
  } else {
    currentStepIndex = 0;
  }

  const steps = [
    {
      id: 'pending',
      title: 'Order Received',
      subtext: order.timestamp ? order.timestamp.split(',')[0] : 'Fast Lane Logged',
      icon: Clock,
      statusValue: 'Pending' as const,
      isReached: true,
      isCurrent: currentStepIndex === 0
    },
    {
      id: 'verified',
      title: isPaid ? 'Payment Confirmed' : 'Verification',
      subtext: isPaid ? 'Payment Verified' : 'Due at Pichelin Shop',
      icon: ShieldCheck,
      statusValue: 'Pending' as const,
      isReached: currentStepIndex >= 1,
      isCurrent: currentStepIndex === 1
    },
    {
      id: 'staged',
      title: 'Fitting Bay Staged',
      subtext: order.preferredDate || 'Ready for Mount',
      icon: Wrench,
      statusValue: 'Ready for Fitting' as const,
      isReached: currentStepIndex >= 2,
      isCurrent: currentStepIndex === 2
    },
    {
      id: 'completed',
      title: 'Fitted & Dispatched',
      subtext: order.notifiedAt ? 'Customer Handover' : 'Job Completed',
      icon: CheckCircle2,
      statusValue: 'Completed' as const,
      isReached: currentStepIndex >= 3,
      isCurrent: currentStepIndex === 3
    }
  ];

  // Progress bar fill percentage: 0 -> 10%, 1 -> 40%, 2 -> 75%, 3 -> 100%
  const progressPercentages = [12, 40, 75, 100];
  const fillWidth = `${progressPercentages[currentStepIndex]}%`;

  return (
    <div className="bg-slate-50/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-3">
      {/* Header with status badge & quick advance hint */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Order Lifecycle Progress:
          </span>
          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isReady
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {isCompleted ? '✓ Completed & Dispatched' : isReady ? '⚡ In Fitting Bay' : '⏳ Pending Processing'}
          </span>
        </div>

        {interactive && onUpdateStatus && !isCompleted && (
          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1">
            <span>Click any step or</span>
            <button
              type="button"
              onClick={() => {
                if (currentStepIndex === 0 || currentStepIndex === 1) {
                  onUpdateStatus('Ready for Fitting');
                } else if (currentStepIndex === 2) {
                  onUpdateStatus('Completed');
                }
              }}
              className="font-bold text-[#0984E3] hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
            >
              <span>Advance to {currentStepIndex < 2 ? 'Fitting Bay' : 'Completed'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Progress Track & Step Nodes */}
      <div className="relative pt-2 pb-1">
        {/* Background track line */}
        <div className="absolute top-6 left-5 right-5 h-1.5 bg-slate-200 rounded-full -translate-y-1/2 z-0" />

        {/* Active progress fill line */}
        <div
          className={`absolute top-6 left-5 h-1.5 rounded-full -translate-y-1/2 z-0 transition-all duration-500 ${
            isCompleted
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-[#0984E3] to-blue-500'
          }`}
          style={{ width: fillWidth }}
        />

        {/* Steps Grid */}
        <div className="relative z-10 grid grid-cols-4 gap-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isPassed = step.isReached && !step.isCurrent;
            const isActive = step.isCurrent;
            const isFuture = !step.isReached;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (interactive && onUpdateStatus) {
                    onUpdateStatus(step.statusValue);
                  }
                }}
                className={`flex flex-col items-center text-center group ${
                  interactive && onUpdateStatus ? 'cursor-pointer' : ''
                }`}
                title={interactive ? `Click to set status to ${step.title}` : undefined}
              >
                {/* Node Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-xs ${
                    isPassed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isActive
                      ? isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                        : 'bg-[#0984E3] border-[#0984E3] text-white ring-4 ring-blue-100 scale-110'
                      : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {isPassed ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Step Labels */}
                <div className="mt-2 space-y-0.5 px-0.5">
                  <div
                    className={`text-[11px] sm:text-xs font-bold leading-tight ${
                      isActive
                        ? 'text-slate-900 font-extrabold'
                        : isPassed
                        ? 'text-emerald-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium hidden sm:block truncate max-w-[110px]">
                    {step.subtext}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
