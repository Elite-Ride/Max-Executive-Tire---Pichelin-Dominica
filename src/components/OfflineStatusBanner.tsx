import React from 'react';
import { WifiOff, PhoneCall, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineStatusBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pichelin-offline-status-banner"
      className="bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex flex-wrap items-center justify-between gap-2 border-b border-amber-700 relative z-50 animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
        <span>
          <strong>Pichelin Offline Mode:</strong> Intermittent internet detected. The full tyre catalog and static assets are cached locally for offline use.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-700/80 px-2 py-0.5 rounded-full border border-amber-500/50">
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
          <span>Catalog Cached</span>
        </span>
        <a
          href="tel:+17676160155"
          className="inline-flex items-center gap-1.5 bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5 text-amber-800" />
          <span>Call Shop (+1 767 616 0155)</span>
        </a>
      </div>
    </div>
  );
};
