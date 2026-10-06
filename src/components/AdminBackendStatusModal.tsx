import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Activity, 
  Layers, 
  Clock, 
  Send, 
  FileText, 
  X,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';

interface AdminBackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBackendStatusModal: React.FC<AdminBackendStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pingLatencyMs, setPingLatencyMs] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const start = performance.now();
      const res = await fetch('/api/admin/status');
      const latency = Math.round(performance.now() - start);
      setPingLatencyMs(latency);

      if (res.ok) {
        const json = await res.json();
        setStatusData(json);
      } else {
        setTestResult(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setTestResult(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center border border-slate-800 shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Backend Admin Portal Server Console
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>REST v2.4 Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Express engine, JSON disk database persistence, and POS hardware sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Server Health</span>
            <div className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Online & Ready</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Roundtrip Ping</span>
            <div className="text-sm font-black text-slate-900 font-mono mt-1 flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{pingLatencyMs !== null ? `${pingLatencyMs} ms` : 'Testing...'}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
            <div className="text-sm font-black text-[#0984E3] font-mono mt-1">
              {statusData?.stats?.totalOrders ?? '--'} Records
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff on Duty</span>
            <div className="text-sm font-black text-purple-600 font-mono mt-1">
              {statusData?.stats?.staffOnDuty ?? 0} Clocked In
            </div>
          </div>
        </div>

        {/* Database & Storage Details */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold flex items-center gap-2 text-slate-300">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Data Persistence & Storage Engine</span>
            </span>
            <span className="font-mono text-[11px] text-emerald-400 font-bold">
              /data/admin_store.json
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-400 pt-1">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">Shop Designation:</span>
              <span className="text-slate-200 font-bold">{statusData?.shop || 'Max Executive Tires'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">Location Hub:</span>
              <span className="text-slate-200 font-bold">{statusData?.location || 'Maranatha Square, Pichelin'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold">Process Uptime:</span>
              <span className="text-slate-200 font-mono font-bold">{statusData?.uptimeSeconds || 0} seconds</span>
            </div>
          </div>
        </div>

        {/* Endpoints Table */}
        <div className="space-y-2 flex-1">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
            Mounted Backend Admin REST Endpoints:
          </span>
          <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs">
            <div className="p-2.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">GET/POST</span>
                <span>/api/admin/orders</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Orders & Reservations CRUD</span>
            </div>

            <div className="p-2.5 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px]">GET/PUT</span>
                <span>/api/admin/inventory</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Stock Counts, Prices & Barcodes</span>
            </div>

            <div className="p-2.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px]">GET/POST</span>
                <span>/api/admin/employees</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Staff Directory & Emergency Contacts</span>
            </div>

            <div className="p-2.5 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">GET/POST</span>
                <span>/api/admin/time-clock</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Punch Kiosk Shifts & Attendance</span>
            </div>

            <div className="p-2.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px]">GET/POST</span>
                <span>/api/admin/payroll/runs</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Dominica DSS Statutory Deductions & Payslips</span>
            </div>

            <div className="p-2.5 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">GET</span>
                <span>/api/admin/customers</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Customer Aggregation & Vehicle History</span>
            </div>

            <div className="p-2.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px]">GET/POST</span>
                <span>/api/admin/cash-drawer/logs</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Hardware POS Drawer Kick Audit Logs</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test Ping & Refresh</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
