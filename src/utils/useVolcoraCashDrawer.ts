import { useState, useCallback, useEffect } from 'react';
import { playCashDrawerKick } from './hardwareAudio';

export interface VolcoraCashDrawerEvent {
  id: string;
  timestamp: string;
  adminName: string;
  reason: string;
  voltage: string; // '24V DC RJ11/RJ12 Solenoid Pulse'
  status: 'SUCCESS' | 'MANUAL_OVERRIDE';
}

export interface VolcoraDrawerState {
  model: string;
  traySpecs: string;
  interfaceType: string;
  drawerStatus: 'closed' | 'open';
  isPulsing: boolean;
  lastTriggeredAt: string | null;
  lastTriggeredBy: string | null;
  totalKicksToday: number;
}

const STORAGE_KEY = 'max_executive_volcora_drawer_logs';

export function useVolcoraCashDrawer(
  onLogActivity?: (actionType: 'STATUS_CHANGE' | 'ORDER_DELETION' | 'BULK_ACTION' | 'PRICE_UPDATE' | 'OTHER', description: string, adminName?: string) => void
) {
  const [drawerStatus, setDrawerStatus] = useState<'closed' | 'open'>('closed');
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [lastTriggeredAt, setLastTriggeredAt] = useState<string | null>(null);
  const [lastTriggeredBy, setLastTriggeredBy] = useState<string | null>(null);
  const [drawerLogs, setDrawerLogs] = useState<VolcoraCashDrawerEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'drawer-init-1',
        timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        adminName: 'Max Blanc (Lead Tech)',
        reason: 'Shift Start Cash Float Verification & Drawer Opening Inspection',
        voltage: '24V DC RJ11/RJ12 Solenoid Pulse (50ms)',
        status: 'SUCCESS'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drawerLogs));
    } catch {}
  }, [drawerLogs]);

  const triggerOpenDrawer = useCallback((adminName: string = 'Admin Staff', reason: string = 'Manual Drawer Open') => {
    // 1. Simulate 24V RJ11/RJ12 electrical kick pulse
    setIsPulsing(true);
    playCashDrawerKick();
    setDrawerStatus('open');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullDateStr = now.toLocaleDateString() + ' ' + timeStr;

    setLastTriggeredAt(fullDateStr);
    setLastTriggeredBy(adminName);

    const newEvent: VolcoraCashDrawerEvent = {
      id: `volcora-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: fullDateStr,
      adminName,
      reason,
      voltage: '24V DC RJ11/RJ12 Solenoid Pulse (50ms)',
      status: 'SUCCESS'
    };

    setDrawerLogs(prev => [newEvent, ...prev.slice(0, 99)]);

    if (onLogActivity) {
      onLogActivity('OTHER', `[Volcora RJ11/RJ12] Cash Drawer Opened: ${reason}`, adminName);
    }

    // Solenoid pulse finishes after 200ms
    setTimeout(() => {
      setIsPulsing(false);
    }, 200);
  }, [onLogActivity]);

  const closeDrawer = useCallback(() => {
    setDrawerStatus('closed');
  }, []);

  const clearDrawerLogs = useCallback(() => {
    setDrawerLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return {
    model: 'Volcora 13" Electronic Cash Register Drawer (4 Bill / 5 Coin Tray, Removable Compartment, 12-24V, RJ11/RJ12 Key-Lock, Black)',
    traySpecs: '4 Bill Slots with Heavy-Duty Wire Grippers + 5 Removable Coin Compartments',
    interfaceType: 'RJ11 / RJ12 6-Pin Modular (Connects to ESC/POS 80mm Printer or POS Terminal)',
    drawerStatus,
    isPulsing,
    lastTriggeredAt,
    lastTriggeredBy,
    drawerLogs,
    triggerOpenDrawer,
    closeDrawer,
    clearDrawerLogs
  };
}
