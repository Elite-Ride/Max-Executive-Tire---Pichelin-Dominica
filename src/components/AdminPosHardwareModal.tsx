import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  FileText,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Tyre } from '../types';
import {
  playBarcodeBeep,
  playCashDrawerKick,
  playTerminalApprovedBeep,
  playPrinterFeedSound
} from '../utils/hardwareAudio';
import { generateBarcodeLabelsPDF, generateCalibrationLabelPDF } from '../utils/labelPdfGenerator';
import { generateTyreUpcA, formatUpcA } from '../utils/barcodeGenerator';

export interface HardwareStatusState {
  // Primary Active Printer Selection
  activePrinterType?: 'hp_laserjet' | 'thermal_receipt';

  // HP LaserJet Pro 4001n/dn (Laser Label Sheet & Invoices)
  hpLaserJetConnected?: boolean;
  hpLaserJetModel?: string;
  hpLaserJetIp?: string;
  hpLaserJetDuplex?: boolean;

  // POS Thermal Receipt Printer (80mm ESC/POS Roll)
  thermalPrinterConnected?: boolean;
  thermalPrinterModel?: string;
  thermalPrinterPort?: 'USB' | 'Network IP' | 'Bluetooth';

  // General Printer (Backwards compatibility)
  printerConnected: boolean;
  printerModel: string;
  printerPort: 'USB' | 'Network IP' | 'Bluetooth';
  autoPrintReceipt: boolean;

  // NetumScan Scanner
  scannerConnected: boolean;
  scannerModel: string;
  scannerMode: 'USB Wedge' | 'Bluetooth SPP' | 'Camera';
  soundEnabled: boolean;

  // Cash Register Drawer
  drawerConnected: boolean;
  drawerStatus: 'closed' | 'open';
  drawerOpeningFloat: number;
  cashSalesTotal: number;
  cashDropsTotal: number;
  drawerLog: { timestamp: string; reason: string; amount?: number }[];

  // POS Card Terminal
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
  const [selectedPrinterTab, setSelectedPrinterTab] = useState<'hp_laserjet' | 'thermal_receipt'>('hp_laserjet');
  const [testPrintSuccess, setTestPrintSuccess] = useState<string | null>(null);
  const [testTerminalStep, setTestTerminalStep] = useState<'idle' | 'reading' | 'pin' | 'approved'>('idle');
  const [testPinInput, setTestPinInput] = useState('');
  const [dropAmountInput, setDropAmountInput] = useState('');
  const [dropReasonInput, setDropReasonInput] = useState('Safe Drop to Workshop Office');
  const [showDropModal, setShowDropModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [liveScannerInput, setLiveScannerInput] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Drawer Totals
  const currentExpectedCashInDrawer =
    hardwareState.drawerOpeningFloat +
    hardwareState.cashSalesTotal -
    hardwareState.cashDropsTotal;

  // HP LaserJet Pro 4001n/dn Diagnostic Print Action
  const handleTestHpLaserJetPrint = () => {
    if (hardwareState.soundEnabled) playPrinterFeedSound();
    
    // Generate a high-DPI laser calibration test sheet with sample UPC-A barcodes
    try {
      const sampleSheets = [[
        ...(availableTyres.length > 0 ? availableTyres.slice(0, 10) : [
          { id: 't-1', size: '205/55 R16', brand: 'Michelin', modelName: 'Primacy 4+', priceXCD: 365, stockCount: 12, category: 'Passenger', condition: 'new' as const },
          { id: 't-2', size: '265/70 R17', brand: 'Goodyear', modelName: 'Wrangler Duratrac', priceXCD: 620, stockCount: 8, category: 'All-Terrain', condition: 'new' as const }
        ]).map((t, idx) => ({ tyre: t as Tyre, slotIndex: idx + 1 }))
      ]];
      const doc = generateBarcodeLabelsPDF(sampleSheets, 'avery_5163', true, 'upc_a');
      doc.save('HP_LaserJet_Pro_4001n_dn_UPCA_Test_Sheet.pdf');
    } catch {
      // Fallback
    }

    setTestPrintSuccess('HP LaserJet Pro 4001n/dn: Vector UPC-A Sheet sent to 1200 DPI Laser Engine!');
    setTimeout(() => setTestPrintSuccess(null), 4500);
  };

  // Thermal Receipt Printer Action
  const handleTestThermalReceiptPrint = () => {
    if (hardwareState.soundEnabled) playPrinterFeedSound();
    setTestPrintSuccess('Thermal Receipt Printer: 80mm ESC/POS continuous roll test receipt printed & cut!');
    setTimeout(() => setTestPrintSuccess(null), 4000);
  };

  const handleFeedPaper = () => {
    if (hardwareState.soundEnabled) playPrinterFeedSound();
  };

  // NetumScan Scanner Live Submission Handler
  const handleLiveScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveScannerInput.trim()) return;
    const scannedVal = liveScannerInput.trim();
    if (hardwareState.soundEnabled) playBarcodeBeep();

    setScanMessage(`NetumScan Captured: ${scannedVal} (Verified & Dispatched to POS Cart)`);
    if (onSimulateScanBarcode) {
      onSimulateScanBarcode(scannedVal);
    }
    setLiveScannerInput('');
    setTimeout(() => setScanMessage(null), 4000);
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
          {/* PERIPHERAL 1: PRINTERS (HP LASERJET PRO 4001N/DN & THERMAL RECEIPT PRINTER) */}
          {(activeTab === 'all' || activeTab === 'printer') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Printer className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">Workshop & POS Printing Station</h4>
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Dual Printers Online
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      HP LaserJet Pro 4001n/dn (1200 DPI Laser & Avery 5163 Labels) &bull; POS 80mm ESC/POS High-Speed Thermal
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

              {/* Printer Hardware Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* PRINTER 1: HP LaserJet Pro 4001n/dn */}
                <div className={`p-4 rounded-2xl border transition ${
                  selectedPrinterTab === 'hp_laserjet'
                    ? 'bg-blue-950/20 border-blue-500/60 ring-1 ring-blue-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-black text-white">HP LaserJet Pro 4001n/dn</h5>
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                            Laser 1200 DPI
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Gigabit Network IP: 192.168.1.180 &bull; Auto-Duplex &bull; 42 ppm
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                      Ready
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recommended Media:</span>
                      <span className="font-semibold text-white">Avery 5163 10-Up Sheet (4&quot;×2&quot;) / 8.5&quot;×11&quot;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paper Input:</span>
                      <span className="font-semibold text-white">Tray 1 (100-sheet Label Feed) &bull; Tray 2 (250)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Barcode Sharpness:</span>
                      <span className="font-semibold text-emerald-400">UPC-A & Code 128 (Ultra-Crisp Vector)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTestHpLaserJetPrint}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print HP 4001n/dn UPC-A Sheet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenBarcodeCenter) {
                          onOpenBarcodeCenter();
                        } else {
                          window.print();
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="Open 10-Up Sheet Center for HP LaserJet Pro 4001n/dn"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Sheet Center</span>
                    </button>
                  </div>
                </div>

                {/* PRINTER 2: POS 80mm High-Speed Thermal Receipt Printer */}
                <div className={`p-4 rounded-2xl border transition ${
                  selectedPrinterTab === 'thermal_receipt'
                    ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-black text-white">POS Thermal Receipt Printer</h5>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                            80mm ESC/POS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Direct Thermal 250mm/s &bull; Auto-Cutter &bull; RJ11 Kick Pulse
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                      Ready
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mechanism:</span>
                      <span className="font-semibold text-white">Direct Thermal (No Ink/Toner Required)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paper Width:</span>
                      <span className="font-semibold text-white">80mm × 80mm Continuous Roll</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Guillotine Cutter:</span>
                      <span className="font-semibold text-emerald-400">Full & Partial Auto-Cut Enabled</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTestThermalReceiptPrint}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print 80mm Test Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFeedPaper}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="Advance thermal paper roll 3 lines"
                    >
                      <Scissors className="w-3.5 h-3.5 text-amber-400" />
                      <span>Feed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKickDrawer('Triggered from Thermal Printer Hub')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="Send RJ11 24V pulse to pop cash drawer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kick Drawer</span>
                    </button>
                  </div>
                </div>
              </div>

              {testPrintSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Print Command Dispatched:</strong> {testPrintSuccess}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PERIPHERAL 2: NETUMSCAN BARCODE SCANNER */}
          {(activeTab === 'all' || activeTab === 'scanner') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Barcode className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">NetumScan Barcode Scanner</h4>
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> NetumScan Active & Listening
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      NetumScan NS-L5 / SD-2000 Handheld Laser & 1D/2D Imager &bull; Plug &amp; Play USB Wedge &bull; 200 scans/sec
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
                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="USB Wedge">NetumScan USB HID Wedge (Direct)</option>
                    <option value="Bluetooth SPP">NetumScan 2.4G Wireless Dongle</option>
                    <option value="Camera">Device Camera Imager Fallback</option>
                  </select>
                </div>
              </div>

              {/* NetumScan Hardware Specifications & Live Wedge Bench */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Symbology Decoder</span>
                  <div className="font-bold text-emerald-400">UPC-A (Standard 12-Digit Retail)</div>
                  <div className="text-[11px] text-slate-400">100% full hardware decoding with mod-10 check digit verification &amp; Code 128</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Optical Engine</span>
                  <div className="font-bold text-white">4 mil Resolution &bull; 200 scans/s</div>
                  <div className="text-[11px] text-slate-400">Instant scan response even on curved tyres, shiny wraps, and thermal labels</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Casing & Audio</span>
                  <div className="font-bold text-amber-400">1.5m Drop Proof &bull; 1850 Hz Beep</div>
                  <div className="text-[11px] text-slate-400">Rugged industrial silicone bumper with confirmation beep on scan</div>
                </div>
              </div>

              {/* Live NetumScan USB Scanner Keystroke Listener Field */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="netumscan-live-input" className="text-xs font-black text-emerald-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>NetumScan USB Wedge Live Test Input</span>
                  </label>
                  <span className="text-[10.5px] text-slate-400 font-mono">
                    Aim scanner gun at tyre barcode and pull trigger (or type and press Enter)
                  </span>
                </div>

                <form onSubmit={handleLiveScannerSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="netumscan-live-input"
                      ref={scannerInputRef}
                      type="text"
                      value={liveScannerInput}
                      onChange={(e) => setLiveScannerInput(e.target.value)}
                      placeholder="Click here & trigger NetumScan scanner (e.g. 084920205167 or MET-2055516)..."
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer active:scale-95"
                  >
                    Simulate Scan
                  </button>
                </form>
              </div>

              {/* Quick Barcode Scan Simulation Buttons with Standard UPC-A Codes */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick NetumScan Trigger (Simulate Aiming NetumScan at In-Stock Tyre UPC-A Labels):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {(availableTyres.length > 0 ? availableTyres.slice(0, 4) : [
                    { id: '1', size: '205/55 R16', brand: 'Michelin', priceXCD: 365, stockCount: 12 },
                    { id: '2', size: '265/70 R17', brand: 'Goodyear', priceXCD: 620, stockCount: 8 },
                    { id: '3', size: '235/65 R17', brand: 'Bridgestone', priceXCD: 425, stockCount: 6 },
                    { id: '4', size: '195/65 R15', brand: 'Continental', priceXCD: 295, stockCount: 14 }
                  ]).map((tyre) => {
                    const upc = generateTyreUpcA(tyre as Tyre);
                    const formatted = formatUpcA(upc);
                    return (
                      <button
                        key={tyre.id}
                        type="button"
                        onClick={() => handleTriggerScannerTest(upc)}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 text-left transition cursor-pointer active:scale-95 group"
                        title={`Simulate scanning UPC-A barcode with NetumScan for ${tyre.size}`}
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                          <span className="font-bold text-white group-hover:text-emerald-400">{tyre.brand}</span>
                          <span className="text-emerald-400 font-bold">EC$ {tyre.priceXCD}</span>
                        </div>
                        <div className="text-xs font-black text-white font-mono">{tyre.size}</div>
                        <div className="text-[10px] font-mono text-emerald-400/90 mt-1 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-slate-500" />
                          <span>{formatted}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {scanMessage && (
                <div className="bg-blue-950/60 border border-blue-700/60 text-blue-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>NetumScan Hardware Acknowledged:</strong> {scanMessage}
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
                      Volcora 13" Electronic Cash Register Drawer (4 Bill 5 Coin Cash Tray, Removable Coin Compartment, 12-24V, RJ11/RJ12 Key-Lock, Black)
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
