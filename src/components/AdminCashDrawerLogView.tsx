import React, { useState } from 'react';
import { 
  Banknote, 
  Zap, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';
import jsPDF from 'jspdf';
import { VolcoraCashDrawerEvent } from '../utils/useVolcoraCashDrawer';
import { AdminActivityLogItem } from './AdminOrdersModal';

interface AdminCashDrawerLogViewProps {
  drawerStatus: 'closed' | 'open';
  isPulsing: boolean;
  lastTriggeredAt: string | null;
  lastTriggeredBy: string | null;
  drawerLogs: VolcoraCashDrawerEvent[];
  adminActivityLog?: AdminActivityLogItem[];
  onTriggerOpenDrawer: (adminName?: string, reason?: string) => void;
  onCloseDrawer: () => void;
  onClearDrawerLogs?: () => void;
}

export const AdminCashDrawerLogView: React.FC<AdminCashDrawerLogViewProps> = ({
  drawerStatus,
  isPulsing,
  lastTriggeredAt,
  lastTriggeredBy,
  drawerLogs,
  adminActivityLog = [],
  onTriggerOpenDrawer,
  onCloseDrawer,
  onClearDrawerLogs
}) => {
  const [adminNameInput, setAdminNameInput] = useState('Max Blanc (Lead Admin)');
  const [openReasonInput, setOpenReasonInput] = useState('Manual Cash Audit & Float Verification');
  const [filterQuery, setFilterQuery] = useState('');
  const [keyPosition, setKeyPosition] = useState<'locked' | 'online' | 'manual'>('online');
  const [isExporting, setIsExporting] = useState(false);

  // Combine drawer logs with relevant entries from adminActivityLog
  const combinedLogs: VolcoraCashDrawerEvent[] = [
    ...drawerLogs,
    ...adminActivityLog
      .filter(item => item.description.toLowerCase().includes('drawer') || item.description.toLowerCase().includes('volcora'))
      .map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        adminName: item.adminName || 'Admin Staff',
        reason: item.description,
        voltage: '24V RJ11/RJ12 Solenoid Pulse',
        status: 'SUCCESS' as const
      }))
  ].filter((log, idx, arr) => arr.findIndex(l => l.id === log.id || (l.timestamp === log.timestamp && l.reason === log.reason)) === idx);

  // Filtered by query
  const displayLogs = combinedLogs.filter(log => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      log.adminName.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      log.timestamp.toLowerCase().includes(q)
    );
  });

  const handleManualOpen = () => {
    onTriggerOpenDrawer(adminNameInput.trim() || 'Admin Staff', openReasonInput.trim() || 'Manual Open');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Event ID', 'Date & Time', 'Administrator', 'Reason / Trigger', 'Interface Signal', 'Status'];
    const rows = displayLogs.map(log => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.adminName.replace(/"/g, '""')}"`,
      `"${log.reason.replace(/"/g, '""')}"`,
      `"${log.voltage || '24V RJ11/RJ12 Pulse'}"`,
      `"${log.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `volcora_cash_drawer_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export via jsPDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(9, 132, 227);
      doc.text('MAX EXECUTIVE TIRES - POS AUDIT', 14, 20);

      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text('Volcora 13" Cash Register Drawer Event Log', 14, 28);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()} | Maranatha Square, Pichelin, Dominica`, 14, 34);
      doc.text('Hardware: Volcora 13" POS Cash Drawer | 4 Bill / 5 Coin Tray | 24V RJ11/RJ12 Interface', 14, 39);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 43, 196, 43);

      // Summary Card
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`Total Recorded Open-Drawer Events: ${displayLogs.length}`, 14, 50);
      doc.text(`Current Drawer Status: ${drawerStatus.toUpperCase()}`, 120, 50);
      doc.text(`Last Event: ${lastTriggeredAt || 'None'} by ${lastTriggeredBy || 'N/A'}`, 14, 56);

      // Table Header
      let y = 66;
      doc.setFillColor(240, 245, 250);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Timestamp', 16, y + 5.5);
      doc.text('Admin Name', 55, y + 5.5);
      doc.text('Reason / Trigger Description', 95, y + 5.5);
      doc.text('Interface / Status', 165, y + 5.5);

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      displayLogs.forEach((log) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
          doc.setFillColor(240, 245, 250);
          doc.rect(14, y, 182, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.text('Timestamp', 16, y + 5.5);
          doc.text('Admin Name', 55, y + 5.5);
          doc.text('Reason / Trigger Description', 95, y + 5.5);
          doc.text('Interface / Status', 165, y + 5.5);
          y += 10;
          doc.setFont('helvetica', 'normal');
        }

        doc.setTextColor(60, 60, 60);
        doc.text(log.timestamp.slice(0, 19), 16, y);
        doc.text(log.adminName.slice(0, 20), 55, y);

        const reasonTruncated = log.reason.length > 40 ? log.reason.slice(0, 38) + '...' : log.reason;
        doc.text(reasonTruncated, 95, y);

        doc.setTextColor(34, 197, 94);
        doc.text('RJ11/12 OK', 165, y);

        y += 7;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Official POS audit record generated by Max Executive Tires Dominica System.', 14, 288);

      doc.save(`volcora_cash_drawer_audit_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Top Banner: Volcora Cash Drawer Specification */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
              <Banknote className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  POS Peripheral Device
                </span>
                <span className="text-xs text-slate-400 font-bold">12-24V RJ11 / RJ12 Interface</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  drawerStatus === 'open' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${drawerStatus === 'open' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                  {drawerStatus === 'open' ? '⚠️ TRAY OPEN' : '🔒 TRAY CLOSED & LOCKED'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Volcora 13" Electronic Cash Register Drawer
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Heavy-duty point of sale cash drawer with 4 Bill & 5 Coin Tray, removable coin compartment, 3-position key-lock, and 24V solenoid trigger via ESC/POS RJ11/RJ12 cable.
              </p>
            </div>
          </div>

          {/* Quick Hardware Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            {drawerStatus === 'open' ? (
              <button
                type="button"
                onClick={onCloseDrawer}
                className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Simulate Push Close Drawer</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualOpen}
                disabled={isPulsing}
                className="flex-1 lg:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-3 px-5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isPulsing ? 'animate-bounce text-red-600' : 'text-slate-950'}`} />
                <span>{isPulsing ? 'Pulsing 24V RJ11...' : '⚡ Trigger Open Drawer'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting || displayLogs.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download audit report as PDF"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={displayLogs.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download historical log as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Diagnostic & Key-lock state bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Tray Configuration</span>
          <span className="text-sm font-bold text-white block">4 Bill / 5 Coin Slots</span>
          <span className="text-[11px] text-slate-400">Spring-loaded steel bill grippers</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Solenoid Interface</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            24V RJ11 / RJ12 Pulse Ready
          </span>
          <span className="text-[11px] text-slate-400">ESC/POS Pin 2/5 kick signal</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">3-Position Key-Lock</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => setKeyPosition('online')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                keyPosition === 'online' ? 'bg-[#0984E3] text-white border-[#0984E3]' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Online / Auto
            </button>
            <button
              type="button"
              onClick={() => setKeyPosition('locked')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                keyPosition === 'locked' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Lock
            </button>
            <button
              type="button"
              onClick={() => setKeyPosition('manual')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                keyPosition === 'manual' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Manual Key
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Total Recorded Events</span>
          <span className="text-sm font-bold text-white block">{combinedLogs.length} Trigger Events</span>
          <span className="text-[11px] text-slate-400">Synced with Admin Activity Log</span>
        </div>
      </div>

      {/* Manual Drawer Kick Simulation Box */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Manual Drawer Pop & Reason Logging</span>
          </h3>
          <span className="text-[11px] text-slate-400">All trigger actions are permanently logged for audit protection</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Admin / Cashier Name</label>
            <input
              type="text"
              value={adminNameInput}
              onChange={(e) => setAdminNameInput(e.target.value)}
              placeholder="e.g. Max Blanc"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0984E3]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Reason for Opening Drawer</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={openReasonInput}
                onChange={(e) => setOpenReasonInput(e.target.value)}
                placeholder="e.g. Cash Change Provided, Cash Drop to Safe, Float Audit"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0984E3]"
              />
              <button
                type="button"
                onClick={handleManualOpen}
                disabled={isPulsing}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950" />
                <span>Open Drawer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Table Header & Search Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Volcora Cash Drawer Opening Event History</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of all electronic RJ11/RJ12 triggers, manual opens, and POS transaction kicks.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by admin name or reason..."
              className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0984E3]"
            />
            {onClearDrawerLogs && (
              <button
                type="button"
                onClick={onClearDrawerLogs}
                className="bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 p-2 rounded-xl border border-slate-800 transition"
                title="Clear local test history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action / Reason Description</th>
                <th className="py-3 px-4">Hardware Signal</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No cash drawer events recorded matching your query.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 text-white font-bold whitespace-nowrap flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>{log.adminName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md">
                      {log.reason}
                    </td>
                    <td className="py-3 px-4 text-amber-400/90 whitespace-nowrap font-mono text-[10px]">
                      {log.voltage || '24V RJ11/12 Pulse'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
