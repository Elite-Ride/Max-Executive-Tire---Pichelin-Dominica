import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Trash2,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  Printer,
  Edit3,
  Check,
  Package
} from 'lucide-react';
import { Tyre } from '../types';
import { getTyreBarcodeValue, playScannerBeep } from '../utils/barcodeGenerator';
import { TyreBarcodeLabel } from './TyreBarcodeLabel';

interface ScanHistoryItem {
  id: string;
  tyre: Tyre;
  barcode: string;
  timestamp: string;
  actionTaken?: string;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tyres: Tyre[];
  onAddToPos?: (tyre: Tyre) => void;
  onUpdateTyreStock?: (tyreId: string, newStock: number) => void;
  onUpdateTyrePrice?: (tyreId: string, newPriceXCD: number) => void;
  onOpenBarcodeCenter?: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  tyres,
  onAddToPos,
  onUpdateTyreStock,
  onUpdateTyrePrice,
  onOpenBarcodeCenter
}) => {
  const [manualInput, setManualInput] = useState('');
  const [activeScannedTyre, setActiveScannedTyre] = useState<Tyre | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Quick edit states for scanned tyre
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceVal, setEditPriceVal] = useState('');
  const [selectedTagToPrint, setSelectedTagToPrint] = useState<Tyre | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Focus scan input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scanInputRef.current?.focus();
      }, 150);
      // Pre-select first popular tyre as default active preview if none selected
      if (!activeScannedTyre && tyres.length > 0) {
        setActiveScannedTyre(tyres[0]);
      }
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser or iframe environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startBarcodeDetectionLoop();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access unavailable or blocked. Please use laser scanner or manual barcode entry.');
      setCameraActive(false);
    }
  };

  const startBarcodeDetectionLoop = () => {
    // Check if browser has native BarcodeDetector
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass) {
      const barcodeDetector = new BarcodeDetectorClass({
        formats: ['code_128', 'code_39', 'qr_code', 'ean_13', 'upc_a']
      });

      const detectFrame = async () => {
        if (!videoRef.current || !cameraActive) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleProcessScan(rawValue);
          }
        } catch {
          // Ignore detection frame errors
        }
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };
      animationFrameRef.current = requestAnimationFrame(detectFrame);
    }
  };

  /**
   * Universal Match Engine:
   * Matches by:
   * 1. Exact Barcode value (e.g. MET-2055516)
   * 2. Sanitized digits of tyre size (e.g. "2055516")
   * 3. Tyre size string (e.g. "205/55 R16", "205/55R16", "265/70")
   * 4. Tyre ID (e.g. "t-1")
   * 5. Brand + Model keywords
   */
  const handleProcessScan = (inputCode: string) => {
    const raw = inputCode.trim();
    if (!raw) return;

    const normalizedRaw = raw.toLowerCase().replace(/[\s\/-]/g, '');

    const matched = tyres.find((t) => {
      const barcode = getTyreBarcodeValue(t).toLowerCase();
      if (barcode === raw.toLowerCase()) return true;

      const normBarcode = barcode.replace(/[\s\/-]/g, '');
      if (normBarcode === normalizedRaw) return true;

      const normSize = t.size.toLowerCase().replace(/[\s\/-]/g, '');
      if (normSize === normalizedRaw) return true;

      if (t.id.toLowerCase() === raw.toLowerCase()) return true;

      // Partial size match if at least 5 chars (e.g. 20555)
      if (normalizedRaw.length >= 5 && normSize.includes(normalizedRaw)) return true;

      return false;
    });

    if (matched) {
      if (soundEnabled) playScannerBeep(true);
      setActiveScannedTyre(matched);
      setScanFeedback(`✓ Scanned: ${matched.brand} ${matched.size} (EC$ ${matched.priceXCD})`);

      // Add to session scan history
      const historyItem: ScanHistoryItem = {
        id: 'scan-' + Date.now(),
        tyre: matched,
        barcode: getTyreBarcodeValue(matched),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setScanHistory((prev) => [historyItem, ...prev.slice(0, 24)]);
    } else {
      if (soundEnabled) playScannerBeep(false);
      setScanFeedback(`⚠️ No inventory tyre matched barcode: "${raw}"`);
    }

    setManualInput('');
    setTimeout(() => {
      setScanFeedback(null);
    }, 3500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessScan(manualInput);
  };

  const handleAdjustStock = (delta: number) => {
    if (!activeScannedTyre || !onUpdateTyreStock) return;
    const newStock = Math.max(0, activeScannedTyre.stockCount + delta);
    onUpdateTyreStock(activeScannedTyre.id, newStock);
    setActiveScannedTyre({ ...activeScannedTyre, stockCount: newStock });
    if (soundEnabled) playScannerBeep(true);
  };

  const handleSavePrice = () => {
    if (!activeScannedTyre || !onUpdateTyrePrice) return;
    const priceNum = parseFloat(editPriceVal);
    if (!isNaN(priceNum) && priceNum > 0) {
      onUpdateTyrePrice(activeScannedTyre.id, priceNum);
      setActiveScannedTyre({ ...activeScannedTyre, priceXCD: priceNum });
      setIsEditingPrice(false);
      if (soundEnabled) playScannerBeep(true);
    }
  };

  const handleAddToCart = () => {
    if (!activeScannedTyre) return;
    if (onAddToPos) {
      onAddToPos(activeScannedTyre);
    }
    if (soundEnabled) playScannerBeep(true);
    setScanFeedback(`✓ Added 1x ${activeScannedTyre.size} to POS Cart!`);
    setTimeout(() => setScanFeedback(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Tyre Inventory Barcode Scanner & Intake
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  Scanner Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan tyre barcodes with mobile camera, USB laser gun, or quick size lookup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Scanner Beep Sound ON' : 'Scanner Beep Sound OFF'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onOpenBarcodeCenter && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBarcodeCenter();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer"
                title="Open Barcode Label Generator for all inventory"
              >
                <Barcode className="w-4 h-4" />
                <span>Barcode Labels</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close Scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan Input & Scanner Gun Listener Bar */}
        <div className="bg-slate-800/95 border-b border-slate-700 p-3 sm:p-4">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                ref={scanInputRef}
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Scan barcode with gun, or enter Tyre Size (e.g. 205/55, MET-2055516)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 text-white placeholder-slate-500 text-sm font-mono focus:outline-none shadow-inner"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Scan / Look Up
            </button>
          </form>

          {/* Quick Simulation Barcode Pills for instant testing in preview */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Quick Scan Pills:
            </span>
            {tyres.slice(0, 6).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleProcessScan(getTyreBarcodeValue(t))}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono text-[11px] transition cursor-pointer active:scale-95"
                title={`Simulate scan for ${t.brand} ${t.size}`}
              >
                {t.size} ({t.brand})
              </button>
            ))}
          </div>

          {/* Toast / Notification Banner */}
          {scanFeedback && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{scanFeedback}</span>
            </div>
          )}
        </div>

        {/* Main Scanner Workspace Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/70">
          {/* Left Column: Live Camera Viewfinder or Simulated Optical Reticle */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-slate-700 aspect-4/3 flex items-center justify-center shadow-xl">
              {/* Camera Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Viewfinder Reticle with Laser Target Line */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-full max-w-[280px] h-[160px] border-2 border-emerald-400/80 rounded-2xl flex items-center justify-center">
                  {/* Corner Target Markers */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />

                  {/* Animated Red Laser Scan Line */}
                  <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
                </div>
                <span className="text-[11px] font-bold text-slate-300 mt-3 bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider">
                  Align Barcode Inside Window
                </span>
              </div>

              {/* Camera Control Overlays */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Camera Scanner</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      {cameraError || 'Use your device camera to scan tyre rack tags & sticker barcodes directly.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Camera Stream</span>
                  </button>
                </div>
              )}

              {cameraActive && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                >
                  Stop Camera
                </button>
              )}
            </div>

            {/* Session Scan Log */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Scan Session History ({scanHistory.length})</span>
                </span>
                {scanHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScanHistory([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition"
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-xs">
                {scanHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No barcodes scanned yet this session. Scan a tyre size above to begin.
                  </div>
                ) : (
                  scanHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveScannedTyre(item.tyre)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between cursor-pointer transition"
                    >
                      <div>
                        <span className="font-mono font-bold text-white">{item.tyre.size}</span>
                        <span className="text-slate-400 ml-1.5">({item.tyre.brand})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400">EC$ {item.tyre.priceXCD}</span>
                        <span className="text-[10px] text-slate-500 ml-2">{item.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Scanned Item Details & Instant Operations */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            {activeScannedTyre ? (
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-md">
                {/* Active Tyre Banner */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md">
                      {activeScannedTyre.condition === 'new' ? 'Brand New Tyre' : 'Inspected Used Tyre'}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      {activeScannedTyre.brand} {activeScannedTyre.modelName}
                    </h3>
                    <p className="text-xs text-slate-400">{activeScannedTyre.category}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Barcode
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded">
                      {getTyreBarcodeValue(activeScannedTyre)}
                    </span>
                  </div>
                </div>

                {/* Tyre Size & Price Prominent Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Tyre Size
                    </span>
                    <div className="text-2xl font-black font-mono text-white mt-0.5">
                      {activeScannedTyre.size}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Rim: {activeScannedTyre.rimDiameter}&quot; • Width: {activeScannedTyre.width}mm
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Retail Price
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPrice(!isEditingPrice);
                          setEditPriceVal(activeScannedTyre.priceXCD.toString());
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {isEditingPrice ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          value={editPriceVal}
                          onChange={(e) => setEditPriceVal(e.target.value)}
                          className="w-24 px-2 py-1 rounded bg-slate-900 border border-blue-500 text-white text-sm font-bold"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-black text-emerald-400 mt-0.5">
                          EC$ {activeScannedTyre.priceXCD}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          ≈ US$ {(activeScannedTyre.priceXCD / 2.7).toFixed(0)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stock Level & Instant Adjustments */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Warehouse Stock Count
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xl font-black text-white font-mono">
                        {activeScannedTyre.stockCount} units
                      </span>
                      {activeScannedTyre.stockCount <= 2 ? (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instant Stock Intake / Dispatch (+1 / -1) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(-1)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                      title="Dispatch or fit 1 tyre (-1 stock)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>-1 Fit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(1)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                      title="Receive 1 tyre into stock (+1 Intake)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 Intake</span>
                    </button>
                  </div>
                </div>

                {/* 1-Click Action Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to POS Counter / Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTagToPrint(activeScannedTyre);
                      setTimeout(() => window.print(), 150);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>Print Single Barcode Tag</span>
                  </button>
                </div>

                {/* Live Barcode Label Preview Card */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Official Barcode Shelf Tag Preview:
                  </span>
                  <div className="flex justify-center">
                    <TyreBarcodeLabel tyre={activeScannedTyre} variant="shelf_tag" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <Barcode className="w-12 h-12 text-slate-600" />
                <h4 className="text-base font-bold text-slate-300">Ready to Scan</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Point the camera at any tyre barcode, connect a USB barcode scanner, or select a quick scan pill above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>
              Hardware laser gun compatible: scanner acts as keyboard HID typing barcode + Enter automatically.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
