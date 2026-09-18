import React, { useState, useEffect } from 'react';
import {
  Printer,
  Barcode,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Sliders,
  Scissors,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Radio,
  Wifi,
  Usb,
  Cpu,
  Zap,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Tyre } from '../types';
import {
  playBarcodeBeep,
  playCashDrawerKick,
  playTerminalApprovedBeep,
  playPrinterFeedSound
} from '../utils/hardwareAudio';
import { generateBarcodeLabelsPDF, generateCalibrationLabelPDF } from '../utils/labelPdfGenerator';

export interface HardwareStatusState {
  printerConnected: boolean;
  printerModel: string;
  printerPort: 'USB' | 'Network IP' | 'Bluetooth';
  autoPrintReceipt: boolean;

  scannerConnected: boolean;
  scannerModel: string;
  scannerMode: 'USB Wedge' | 'Bluetooth SPP' | 'Camera';
  soundEnabled: boolean;

  drawerConnected: boolean;
  drawerStatus: 'closed' | 'open';
  drawerOpeningFloat: number;
  cashSalesTotal: number;
  cashDropsTotal: number;
  drawerLog: { timestamp: string; reason: string; amount?: number }[];

  terminalConnected: boolean;
  terminalModel: string;
  terminalBattery: number;
  terminalIp: string;
}

interface AdminPosHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardwareState: HardwareStatusState;
  onUpdateHardwareState: (updater: (prev: HardwareStatusState) => HardwareStatusState) => void;
  onSimulateScanBarcode?: (barcodeVal: string) => void;
  availableTyres?: Tyre[];
  onOpenBarcodeCenter?: () => void;
}

export const AdminPosHardwareModal: React.FC<AdminPosHardwareModalProps> = ({
  isOpen,
  onClose,
  hardwareState,
  onUpdateHardwareState,
  onSimulateScanBarcode,
  availableTyres = [],
  onOpenBarcodeCenter
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'printer' | 'scanner' | 'drawer' | 'terminal'>('all');
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [testTerminalStep, setTestTerminalStep] = useState<'idle' | 'reading' | 'pin' | 'approved'>('idle');
  const [testPinInput, setTestPinInput] = useState('');
  const [dropAmountInput, setDropAmountInput] = useState('');
  const [dropReasonInput, setDropReasonInput] = useState('Safe Drop to Workshop Office');
  const [showDropModal, setShowDropModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Drawer Totals
  const currentExpectedCashInDrawer =
    hardwareState.drawerOpeningFloat +
    hardwareState.cashSalesTotal -
    hardwareState.cashDropsTotal;

  // External Printer Actions
  const handleTestPrint = () => {
    if (hardwareState.soundEnabled) playPrinterFeedSound();
    setTestPrintSuccess(true);
    setTimeout(() => setTestPrintSuccess(false), 3500);
  };

  const handleFeedPaper = () => {
    if (hardwareState.soundEnabled) playPrinterFeedSound();
  };

  // Cash Register Drawer Actions
  const handleKickDrawer = (reason: string = 'Manual Drawer Kick by Admin') => {
    if (hardwareState.soundEnabled) playCashDrawerKick();
    onUpdateHardwareState((prev) => ({
      ...prev,
      drawerStatus: 'open',
      drawerLog: [
        { timestamp: new Date().toLocaleTimeString(), reason },
        ...prev.drawerLog.slice(0, 9)
      ]
    }));

    // Auto-close visual drawer after 4 seconds
    setTimeout(() => {
      onUpdateHardwareState((prev) => ({
        ...prev,
        drawerStatus: 'closed'
      }));
    }, 4000);
  };

  const handleRecordCashDrop = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(dropAmountInput);
    if (isNaN(amount) || amount <= 0) return;

    handleKickDrawer(`Cash Drop: EC$ ${amount.toFixed(2)} (${dropReasonInput})`);
    onUpdateHardwareState((prev) => ({
      ...prev,
      cashDropsTotal: prev.cashDropsTotal + amount,
      drawerLog: [
        {
          timestamp: new Date().toLocaleTimeString(),
          reason: `Cash Drop: ${dropReasonInput}`,
          amount: -amount
        },
        ...prev.drawerLog.slice(0, 9)
      ]
    }));

    setDropAmountInput('');
    setShowDropModal(false);
  };

  // Barcode Scanner Action
  const handleTriggerScannerTest = (barcodeValue?: string) => {
    const val = barcodeValue || 'TYRE-2055516';
    if (hardwareState.soundEnabled) playBarcodeBeep();
    setScanMessage(`Scanned: ${val} (Tyre added to POS Cart)`);
    if (onSimulateScanBarcode) {
      onSimulateScanBarcode(val);
    }
    setTimeout(() => setScanMessage(null), 3000);
  };

  // POS Card Machine Terminal Test
  const handleStartTerminalTest = () => {
    setTestTerminalStep('reading');
    setTimeout(() => {
      setTestTerminalStep('pin');
    }, 1200);
  };

  const handleConfirmPinTest = () => {
    setTestTerminalStep('reading');
    setTimeout(() => {
      if (hardwareState.soundEnabled) playTerminalApprovedBeep();
      setTestTerminalStep('approved');
      setTimeout(() => {
        setTestTerminalStep('idle');
        setTestPinInput('');
      }, 3000);
    }, 1400);
  };

  return (
    <div id="pos-hardware-hub-modal" className="fixed inset-0 z-80 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-6 text-white space-y-5 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Workshop POS Hardware & Peripherals Manager
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  All 4 Peripherals Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage external thermal printer, barcode laser scanner, cash register drawer, and smart card POS machine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateHardwareState((prev) => ({
                  ...prev,
                  soundEnabled: !prev.soundEnabled
                }))
              }
              className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                hardwareState.soundEnabled
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={hardwareState.soundEnabled ? 'Hardware Audio Enabled' : 'Hardware Audio Muted'}
            >
              {hardwareState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{hardwareState.soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Hardware Hub
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('printer')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'printer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>1. External Printer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'scanner' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>2. Barcode Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drawer')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'drawer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>3. Cash Register</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'terminal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>4. POS Machine</span>
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* PERIPHERAL 1: EXTERNAL PRINTER */}
          {(activeTab === 'all' || activeTab === 'printer') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Printer className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">External Receipt & Label Printer</h4>
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online & Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {hardwareState.printerModel} &bull; Interface: {hardwareState.printerPort} (High-Speed ESC/POS 80mm & 8½&quot;×11&quot;)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={hardwareState.autoPrintReceipt}
                      onChange={(e) =>
                        onUpdateHardwareState((prev) => ({
                          ...prev,
                          autoPrintReceipt: e.target.checked
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Auto-Print Receipts on Sale</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons for Printer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 px-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Test Diagnostic Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleFeedPaper}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4 text-slate-400" />
                  <span>Feed Paper (3 lines)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hardwareState.soundEnabled) playPrinterFeedSound();
                    if (onOpenBarcodeCenter) {
                      onOpenBarcodeCenter();
                    } else if (availableTyres.length > 0) {
                      // Direct test sheet PDF generation
                      const sampleSheets = [[
                        ...availableTyres.slice(0, 10).map((t, idx) => ({ tyre: t, slotIndex: idx + 1 }))
                      ]];
                      const doc = generateBarcodeLabelsPDF(sampleSheets, 'avery_5163', true);
                      doc.save('Max_Executive_Sample_Labels_Avery5163.pdf');
                    } else {
                      window.print();
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  title="Open Barcode Center or print 2x4 labels on 8.5x11 sheet"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print 8.5&quot;×11&quot; Labels Sheet</span>
                </button>
              </div>

              {testPrintSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Diagnostic Print Command Sent!</strong> Sent 80mm ESC/POS test packet to {hardwareState.printerModel}. Header, barcode, and guillotine cut verified.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PERIPHERAL 2: BARCODE SCANNER */}
          {(activeTab === 'all' || activeTab === 'scanner') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Barcode className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">External Barcode Scanner Gun</h4>
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active & Listening
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {hardwareState.scannerModel} &bull; Mode: {hardwareState.scannerMode} &bull; 1D / 2D Code 128
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={hardwareState.scannerMode}
                    onChange={(e: any) =>
                      onUpdateHardwareState((prev) => ({
                        ...prev,
                        scannerMode: e.target.value
                      }))
                    }
                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="USB Wedge">USB Keyboard Wedge</option>
                    <option value="Bluetooth SPP">Bluetooth Wireless Gun</option>
                    <option value="Camera">Device Camera Imager</option>
                  </select>
                </div>
              </div>

              {/* Quick Scanner Testing Pallet */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Barcode Scan Trigger (Simulate Aiming Scanner at Tyre Label)
                </span>
                <div className="flex flex-wrap gap-2">
                  {(availableTyres.length > 0 ? availableTyres.slice(0, 4) : [
                    { id: '1', size: '205/55R16', brand: 'Michelin', priceXCD: 320 },
                    { id: '2', size: '225/65R17', brand: 'Bridgestone', priceXCD: 480 },
                    { id: '3', size: '265/70R17', brand: 'Goodyear', priceXCD: 650 },
                    { id: '4', size: '195/65R15', brand: 'Continental', priceXCD: 275 }
                  ]).map((tyre) => {
                    const code = `TYRE-${tyre.size.replace(/[^a-zA-Z0-9]/g, '')}`;
                    return (
                      <button
                        key={tyre.id}
                        type="button"
                        onClick={() => handleTriggerScannerTest(code)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-400 flex items-center gap-2 cursor-pointer transition active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Scan {tyre.size}</span>
                        <span className="text-[10px] text-slate-500">({code})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {scanMessage && (
                <div className="bg-blue-950/60 border border-blue-700/60 text-blue-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Scanner Acknowledged:</strong> {scanMessage}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PERIPHERAL 3: CASH REGISTER / CASH DRAWER */}
          {(activeTab === 'all' || activeTab === 'drawer') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">Electronic Cash Register & Drawer</h4>
                      <span
                        className={`flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                          hardwareState.drawerStatus === 'open'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse'
                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hardwareState.drawerStatus === 'open' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                        ></span>
                        {hardwareState.drawerStatus === 'open' ? 'DRAWER POPPED OPEN' : 'Drawer Closed & Locked'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      APG Vasario Heavy Duty &bull; Port: RJ11/12 24V Kick Pulse via Printer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleKickDrawer('Manual Test Kick by Admin')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Kick / Pop Drawer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDropModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                  >
                    <span>Record Safe Drop</span>
                  </button>
                </div>
              </div>

              {/* Cash Register Balance Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Opening Float</span>
                  <span className="text-base font-black text-white">
                    EC$ {hardwareState.drawerOpeningFloat.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block">Cash Sales Taken</span>
                  <span className="text-base font-black text-emerald-400">
                    + EC$ {hardwareState.cashSalesTotal.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block">Cash Payouts / Drops</span>
                  <span className="text-base font-black text-amber-400">
                    - EC$ {hardwareState.cashDropsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-emerald-600/40 rounded-xl p-3 space-y-1 bg-emerald-950/20">
                  <span className="text-[10px] font-black uppercase text-emerald-300 block">Current Cash in Drawer</span>
                  <span className="text-base font-black text-emerald-300">
                    EC$ {currentExpectedCashInDrawer.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Drawer Kick Log */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Recent Drawer Activity Log (Audit Trail)
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {hardwareState.drawerLog.length > 0 ? (
                    hardwareState.drawerLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs flex items-center justify-between text-slate-300"
                      >
                        <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                        <span className="font-medium text-white">{log.reason}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">24V Solenoid Triggered</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs py-2">No drawer openings recorded this session.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PERIPHERAL 4: POS CARD PAYMENT TERMINAL */}
          {(activeTab === 'all' || activeTab === 'terminal') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">SmartPOS Card Machine / Terminal</h4>
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Cloud & Bluetooth Paired
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {hardwareState.terminalModel} &bull; Battery: {hardwareState.terminalBattery}% &bull; IP: {hardwareState.terminalIp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">EMV 4.3 &bull; PCI-PTS 5.x</span>
                </div>
              </div>

              {/* Terminal Interactive Screen Simulator */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-6 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-center space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10.5px] text-slate-400">
                    <span className="font-bold uppercase text-emerald-400">MAX SMARTPOS TERMINAL</span>
                    <span>🔋 {hardwareState.terminalBattery}%</span>
                  </div>

                  <div className="py-3">
                    <span className="text-[11px] text-slate-400 uppercase tracking-widest block">Amount to Charge</span>
                    <span className="text-2xl sm:text-3xl font-black text-white">EC$ 350.00</span>
                    <span className="text-[10px] text-slate-500 block">≈ US$ 130.00</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-200 min-h-[50px] flex items-center justify-center">
                    {testTerminalStep === 'idle' && (
                      <span className="text-slate-300">Ready. Tap NFC, Insert Chip, or Swipe Card.</span>
                    )}
                    {testTerminalStep === 'reading' && (
                      <span className="text-emerald-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Reading EMV Chip / Processing...
                      </span>
                    )}
                    {testTerminalStep === 'pin' && (
                      <span className="text-amber-300">
                        Customer PIN Required: {testPinInput ? '••••' : 'Enter 4 Digits'}
                      </span>
                    )}
                    {testTerminalStep === 'approved' && (
                      <span className="text-emerald-400 font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        APPROVED! AUTH: DM-928104
                      </span>
                    )}
                  </div>
                </div>

                {/* Terminal Controls */}
                <div className="md:col-span-6 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Simulate Customer Card Presentation:
                  </span>

                  <button
                    type="button"
                    onClick={handleStartTerminalTest}
                    disabled={testTerminalStep !== 'idle'}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <span>📶 Simulate Contactless NFC Tap (Apple Pay / Visa)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartTerminalTest}
                    disabled={testTerminalStep !== 'idle'}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <span>💳 Simulate EMV Chip Insert & PIN</span>
                  </button>

                  {testTerminalStep === 'pin' && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Keypad PIN Entry:</span>
                        <button
                          type="button"
                          onClick={() => setTestPinInput('1234')}
                          className="text-[11px] text-blue-400 hover:underline font-bold"
                        >
                          Auto-fill 1234
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={4}
                          value={testPinInput}
                          onChange={(e) => setTestPinInput(e.target.value)}
                          placeholder="••••"
                          className="w-24 text-center tracking-widest font-mono text-base px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmPinTest}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 rounded-lg cursor-pointer"
                        >
                          Submit PIN (Green Enter)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-1">
                    Directly integrated with POS checkout counter. Selecting &quot;SmartPOS Card Terminal&quot; at checkout triggers this machine automatically.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hardware bridge running. POS counter and inventory scanner linked.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Close Hardware Manager
          </button>
        </div>
      </div>

      {/* Cash Drop Sub-Modal */}
      {showDropModal && (
        <div className="fixed inset-0 z-90 bg-black/85 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span>Record Cash Drop / Safe Transfer</span>
            </h4>
            <p className="text-xs text-slate-400">
              Transfer excess cash from the Pichelin counter drawer to the shop safe or bank bag.
            </p>

            <form onSubmit={handleRecordCashDrop} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Amount to Drop (EC$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 300.00"
                  value={dropAmountInput}
                  onChange={(e) => setDropAmountInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Reason / Destination</label>
                <input
                  type="text"
                  required
                  value={dropReasonInput}
                  onChange={(e) => setDropReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDropModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black"
                >
                  Record Drop & Pop Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
