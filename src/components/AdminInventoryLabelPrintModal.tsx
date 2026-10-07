import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Search,
  CheckSquare,
  Square,
  Download,
  Filter,
  Layers,
  Sparkles,
  Tag,
  Check,
  FileText,
  Sliders,
  Eye,
  Grid,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  QrCode,
  LayoutGrid,
  Plus,
  Minus,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight,
  Barcode
} from 'lucide-react';
import { Tyre } from '../types';
import { TyreBarcodeLabel } from './TyreBarcodeLabel';
import { PrinterGuide } from './PrinterGuide';
import { getTyreBarcodeValue, generateTyreUpcA, formatUpcA } from '../utils/barcodeGenerator';
import { generateBarcodeLabelsPDF, LabelSheetItem } from '../utils/labelPdfGenerator';
import { printHtmlViaIframe } from '../utils/printHelper';
import { playPrinterFeedSound } from '../utils/hardwareAudio';

export interface AdminInventoryLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  tyres: Tyre[];
  initialSelectedTyre?: Tyre | null;
  initialSelectedIds?: string[];
  title?: string;
}

export const AdminInventoryLabelPrintModal: React.FC<AdminInventoryLabelPrintModalProps> = ({
  isOpen,
  onClose,
  tyres,
  initialSelectedTyre,
  initialSelectedIds,
  title = 'Print 2×4 Inventory Barcode & Pricing Labels'
}) => {
  // Selection and quantity mapping: tyreId -> copy count
  const [itemCopies, setItemCopies] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'ALL' | 'new' | 'used'>('ALL');
  
  // Label format & print settings
  const [labelVariant, setLabelVariant] = useState<'large_2x4' | 'avery_2x4'>('large_2x4');
  const [symbology, setSymbology] = useState<'upc_a' | 'code128'>('upc_a');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showCutBorders, setShowCutBorders] = useState(true);
  const [startSlot, setStartSlot] = useState<number>(1); // 1-10
  const [previewZoom, setPreviewZoom] = useState<number>(0.85); // 0.65, 0.85, 1.0
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [isPrinterGuideOpen, setIsPrinterGuideOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Initialize or reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, number> = {};
      if (initialSelectedTyre) {
        initialMap[initialSelectedTyre.id] = 1;
      } else if (initialSelectedIds && initialSelectedIds.length > 0) {
        initialSelectedIds.forEach((id) => {
          initialMap[id] = 1;
        });
      } else {
        // Default to 1 copy for all available inventory items
        tyres.forEach((t) => {
          initialMap[t.id] = 1;
        });
      }
      setItemCopies(initialMap);
      setStartSlot(1);
      setActiveSheetIndex(0);
    }
  }, [isOpen, initialSelectedTyre, initialSelectedIds, tyres]);

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Filtered tyres list for left drawer selection
  const filteredTyres = useMemo(() => {
    return tyres.filter((t) => {
      const matchesSearch =
        !searchQuery.trim() ||
        t.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.barcode && t.barcode.includes(searchQuery)) ||
        (t.upcCode && t.upcCode.includes(searchQuery));
      const matchesCondition =
        conditionFilter === 'ALL' || t.condition === conditionFilter;
      return matchesSearch && matchesCondition;
    });
  }, [tyres, searchQuery, conditionFilter]);

  // Total selected tyres count
  const selectedCount = useMemo(() => {
    return Object.values(itemCopies).filter((q) => q > 0).length;
  }, [itemCopies]);

  // Flattened queue of tyres to print based on copies
  const queuedTyres = useMemo(() => {
    const queue: Tyre[] = [];
    tyres.forEach((tyre) => {
      const count = itemCopies[tyre.id] || 0;
      for (let i = 0; i < count; i++) {
        queue.push(tyre);
      }
    });
    return queue;
  }, [tyres, itemCopies]);

  // Group into 2x4 sheets (10 slots per sheet: 2 cols x 5 rows)
  const sheets: LabelSheetItem[][] = useMemo(() => {
    if (queuedTyres.length === 0) return [];

    const resultSheets: LabelSheetItem[][] = [];
    let currentSheet: LabelSheetItem[] = [];

    // On the first sheet, fill slots prior to startSlot with blank nulls (to skip used labels)
    const blankOffset = Math.max(0, startSlot - 1);
    for (let i = 0; i < blankOffset; i++) {
      currentSheet.push({ tyre: null, slotIndex: i });
    }

    queuedTyres.forEach((tyre) => {
      currentSheet.push({ tyre, slotIndex: currentSheet.length });
      if (currentSheet.length === 10) {
        resultSheets.push(currentSheet);
        currentSheet = [];
      }
    });

    // Pad last sheet up to 10 slots with empty placeholder spaces
    if (currentSheet.length > 0) {
      while (currentSheet.length < 10) {
        currentSheet.push({ tyre: null, slotIndex: currentSheet.length });
      }
      resultSheets.push(currentSheet);
    }

    return resultSheets;
  }, [queuedTyres, startSlot]);

  // Ensure active sheet index is valid
  React.useEffect(() => {
    if (activeSheetIndex >= sheets.length && sheets.length > 0) {
      setActiveSheetIndex(sheets.length - 1);
    }
  }, [sheets.length, activeSheetIndex]);

  // Quick quantity presets
  const handleSetAllCopies = (count: number) => {
    const updated: Record<string, number> = {};
    tyres.forEach((t) => {
      updated[t.id] = count;
    });
    setItemCopies(updated);
  };

  const handleMatchStockCount = () => {
    const updated: Record<string, number> = {};
    tyres.forEach((t) => {
      updated[t.id] = Math.max(1, t.stockCount);
    });
    setItemCopies(updated);
    showToast('Quantities matched to live inventory stock counts.');
  };

  const handleToggleTyreSelection = (tyreId: string) => {
    setItemCopies((prev) => {
      const current = prev[tyreId] || 0;
      return {
        ...prev,
        [tyreId]: current > 0 ? 0 : 1
      };
    });
  };

  const handleAdjustCopies = (tyreId: string, delta: number) => {
    setItemCopies((prev) => {
      const current = prev[tyreId] || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [tyreId]: next
      };
    });
  };

  // Print execution via browser / iframe
  const handlePrint = () => {
    if (queuedTyres.length === 0) {
      alert('Please select at least one inventory item to print.');
      return;
    }

    playPrinterFeedSound();

    // Use printHtmlViaIframe to isolate printable 2x4 grid sheets
    const container = document.getElementById('inventory-2x4-print-sheets-container');
    if (container) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Max Executive Tires - 2x4 Barcode Labels (${queuedTyres.length} labels)</title>
            <style>
              @page {
                size: 8.5in 11.0in portrait;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .grid-2x4-sheet {
                width: 8.5in !important;
                max-width: 8.5in !important;
                height: 11.0in !important;
                max-height: 11.0in !important;
                min-height: 11.0in !important;
                box-sizing: border-box !important;
                margin: 0 auto !important;
                padding-top: 0.5in !important;
                padding-bottom: 0.5in !important;
                padding-left: 0.15625in !important;
                padding-right: 0.15625in !important;
                background: #ffffff !important;
                display: grid !important;
                grid-template-columns: 4.0in 4.0in !important;
                grid-template-rows: repeat(5, 2.0in) !important;
                column-gap: 0.1875in !important;
                row-gap: 0in !important;
                overflow: hidden !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .grid-2x4-sheet:last-of-type {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .large-2x4-label, .avery-2x4-label {
                width: 4.0in !important;
                height: 2.0in !important;
                max-width: 4.0in !important;
                max-height: 2.0in !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                background: #ffffff !important;
                overflow: hidden !important;
              }
            </style>
          </head>
          <body>
            ${container.innerHTML}
          </body>
        </html>
      `;
      printHtmlViaIframe(html, `2x4_Barcode_Labels_${queuedTyres.length}_Items`);
      showToast(`Sent ${queuedTyres.length} labels (${sheets.length} sheets) to printer.`);
    } else {
      window.print();
    }
  };

  // Download PDF vector document
  const handleDownloadPdf = () => {
    if (queuedTyres.length === 0) {
      alert('Please select at least one item to generate a PDF.');
      return;
    }

    try {
      const pdf = generateBarcodeLabelsPDF(
        sheets,
        labelVariant === 'large_2x4' ? 'grid_2x4' : 'avery_5163',
        showCutBorders,
        symbology
      );
      const filename = `MaxExecutiveTires_2x4_Labels_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      showToast(`Downloaded ${filename} successfully!`);
    } catch (err) {
      console.error('Failed to generate label PDF:', err);
      showToast('Error generating PDF document.');
    }
  };

  if (!isOpen) return null;

  const currentSheet = sheets[activeSheetIndex] || [];

  return (
    <div
      id="modal-admin-inventory-label-print"
      data-testid="modal-admin-inventory-label-print"
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================================================================== */}
        {/* MODAL HEADER                                                          */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <Barcode className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{title}</span>
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Grid className="w-3 h-3" />
                  <span>2″×4″ Sheet Grid (10 / Page)</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrated 2-column by 5-row layout on standard 8.5″×11″ Letter paper with barcodes, prices &amp; size specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrinterGuideOpen(!isPrinterGuideOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                isPrinterGuideOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-amber-300 border-amber-400/30 hover:bg-slate-700'
              }`}
              title="Printer setup guide for Margins: None and Scale: 100%"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Printer Guide</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printer Guide Drawer if toggled */}
        {isPrinterGuideOpen && (
          <div className="p-4 bg-slate-950 border-b border-amber-400/30 shrink-0 animate-fade-in">
            <PrinterGuide inline={true} />
          </div>
        )}

        {/* ===================================================================== */}
        {/* MAIN BODY: 2 COLUMNS (CONTROLS & LIVE 2X4 SHEET PREVIEW)              */}
        {/* ===================================================================== */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT PANEL: INVENTORY ITEMS SELECTION & QUANTITIES (380px)        */}
          {/* ----------------------------------------------------------------- */}
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 flex flex-col overflow-hidden shrink-0">
            {/* Search & Presets Bar */}
            <div className="p-3.5 border-b border-slate-800 space-y-2.5 shrink-0 bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search size, brand, model, UPC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filter Pills & Select All / Clear */}
              <div className="flex items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setConditionFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                      conditionFilter === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({tyres.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConditionFilter('new')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                      conditionFilter === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setConditionFilter('used')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                      conditionFilter === 'used'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Used
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSetAllCopies(1)}
                    className="text-blue-400 hover:text-blue-300 font-bold"
                  >
                    All 1×
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleMatchStockCount}
                    className="text-amber-400 hover:text-amber-300 font-bold"
                    title="Set quantity to match current units in stock"
                  >
                    Stock Qty
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => handleSetAllCopies(0)}
                    className="text-rose-400 hover:text-rose-300 font-bold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Items List with Quantity Steppers */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-800/40">
              {filteredTyres.map((tyre) => {
                const copies = itemCopies[tyre.id] || 0;
                const isSelected = copies > 0;

                return (
                  <div
                    key={tyre.id}
                    className={`p-2 rounded-xl transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-800/80 border border-blue-500/40'
                        : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      onClick={() => handleToggleTyreSelection(tyre.id)}
                    >
                      <button
                        type="button"
                        className="text-slate-400 hover:text-white shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-white truncate">
                            {tyre.size}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${
                              tyre.condition === 'new'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {tyre.condition}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {tyre.brand} {tyre.modelName} • <strong className="text-emerald-400">EC$ {tyre.priceXCD}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper (+ / -) */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdjustCopies(tyre.id, -1)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Decrease label quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center text-xs font-mono font-bold text-white">
                        {copies}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleAdjustCopies(tyre.id, 1)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Increase label quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredTyres.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching tyres found in inventory.
                </div>
              )}
            </div>

            {/* Left Drawer Summary Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
              <div>
                <span className="text-slate-400">Total queued:</span>{' '}
                <strong className="text-white font-mono">{queuedTyres.length} labels</strong>
              </div>
              <div className="text-slate-400">
                Sheets:{' '}
                <strong className="text-blue-400 font-mono">{sheets.length}</strong>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT PANEL: 2X4 GRID TEMPLATE CONFIG & LIVE SHEET PREVIEW        */}
          {/* ----------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Top Toolbar: Format, Symbology, Start Slot, Zoom Controls */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              {/* Template & Symbology Pickers */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLabelVariant('large_2x4')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      labelVariant === 'large_2x4'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Generic 2x4 Grid with high-contrast tyre branding"
                  >
                    Generic 2×4 Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelVariant('avery_2x4')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      labelVariant === 'avery_2x4'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Avery 5163 / 5263 standard template"
                  >
                    Avery 5163
                  </button>
                </div>

                {/* Symbology Toggle */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSymbology('upc_a')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      symbology === 'upc_a'
                        ? 'bg-slate-800 text-amber-300 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    UPC-A (12-Digit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymbology('code128')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      symbology === 'code128'
                        ? 'bg-slate-800 text-amber-300 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Code 128
                  </button>
                </div>

                {/* QR Code & Border Toggles */}
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                    showQrCode
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle QR code for mobile smartphone lookup"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCutBorders(!showCutBorders)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                    showCutBorders
                      ? 'bg-slate-800 text-blue-400 border-blue-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle cut guide border around each 2x4 label"
                >
                  <span>Cut Lines</span>
                </button>
              </div>

              {/* Start Slot Offset (1-10) Selector & Zoom */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Start Slot:</span>
                  <select
                    value={startSlot}
                    onChange={(e) => setStartSlot(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-hidden"
                    title="Select start slot (1-10) to reuse partially printed sticker sheets"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        Slot #{num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview Zoom */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(0.6, z - 0.1))}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 px-1">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(1.2, z + 0.1))}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* SHEET PREVIEW CANVAS (Using existing .grid-2x4-sheet style)     */}
            {/* --------------------------------------------------------------- */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-start bg-slate-950/90 relative">
              {sheets.length > 0 ? (
                <div className="flex flex-col items-center gap-6">
                  {/* Sheet Navigation Header if multi-page */}
                  {sheets.length > 1 && (
                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-md text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveSheetIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeSheetIndex === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="font-bold text-slate-200">
                        Sheet <strong className="text-blue-400">{activeSheetIndex + 1}</strong> of{' '}
                        <strong className="text-slate-100">{sheets.length}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveSheetIndex((prev) => Math.min(sheets.length - 1, prev + 1))}
                        disabled={activeSheetIndex === sheets.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* 8.5" x 11" 2x4 Label Sheet Preview */}
                  <div
                    style={{
                      transform: `scale(${previewZoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease-out'
                    }}
                    className="shrink-0 shadow-2xl rounded-sm"
                  >
                    {/* Leverages the exact .grid-2x4-sheet CSS class */}
                    <div className={`grid-2x4-sheet ${labelVariant === 'avery_2x4' ? 'avery-5163-sheet' : ''}`}>
                      {currentSheet.map((item, idx) => {
                        const { tyre, slotIndex } = item;

                        if (!tyre) {
                          // Blank / Unused slot (offset or trailing empty)
                          return (
                            <div
                              key={`empty-${slotIndex}-${idx}`}
                              className="large-2x4-label border border-dashed border-slate-200/80 bg-slate-50/50 flex flex-col items-center justify-center text-center p-4 text-slate-300 select-none"
                              style={{ width: '4.0in', height: '2.0in', boxSizing: 'border-box' }}
                            >
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                [Slot #{slotIndex + 1} - Blank]
                              </span>
                              <span className="text-[8px] text-slate-400 mt-0.5">
                                Unused label position
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`tyre-${tyre.id}-${idx}`}
                            className="large-2x4-label relative group"
                            style={{ width: '4.0in', height: '2.0in', boxSizing: 'border-box' }}
                          >
                            <TyreBarcodeLabel
                              tyre={tyre}
                              variant={labelVariant}
                              symbology={symbology}
                              showBorder={showCutBorders}
                              showQr={showQrCode}
                            />
                            {/* Slot Badge Overlay in Preview */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-slate-900/80 text-white text-[8px] font-mono px-1.5 py-0.5 rounded pointer-events-none">
                              Slot #{slotIndex + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 space-y-3">
                  <Barcode className="w-12 h-12 text-slate-600 stroke-1" />
                  <h4 className="text-base font-bold text-slate-300">No Labels Queued for Printing</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select tyres from the inventory list on the left and specify copy counts to generate your 2×4 sheet.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSetAllCopies(1)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Select All Inventory Items (1 Each)
                  </button>
                </div>
              )}
            </div>

            {/* Hidden container with ALL sheets for complete multi-page browser print */}
            <div id="inventory-2x4-print-sheets-container" className="hidden">
              {sheets.map((sheet, sIdx) => (
                <div
                  key={`print-sheet-${sIdx}`}
                  className={`grid-2x4-sheet ${labelVariant === 'avery_2x4' ? 'avery-5163-sheet' : ''}`}
                >
                  {sheet.map((item, idx) => {
                    const { tyre, slotIndex } = item;
                    if (!tyre) {
                      return (
                        <div
                          key={`print-empty-${sIdx}-${idx}`}
                          className="large-2x4-label"
                          style={{ width: '4.0in', height: '2.0in', boxSizing: 'border-box', border: showCutBorders ? '1px dashed #e2e8f0' : 'none' }}
                        />
                      );
                    }
                    return (
                      <div
                        key={`print-tyre-${sIdx}-${idx}`}
                        className="large-2x4-label"
                        style={{ width: '4.0in', height: '2.0in', boxSizing: 'border-box' }}
                      >
                        <TyreBarcodeLabel
                          tyre={tyre}
                          variant={labelVariant}
                          symbology={symbology}
                          showBorder={showCutBorders}
                          showQr={showQrCode}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MODAL FOOTER WITH PRINT & PDF EXPORT BUTTONS                          */}
        {/* ===================================================================== */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              {queuedTyres.length} labels queued
            </span>
            <span>•</span>
            <span>
              {sheets.length} sheet{sheets.length === 1 ? '' : 's'} (8.5″×11″ Letter)
            </span>
            {startSlot > 1 && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-bold">
                  Offset starts at Slot #{startSlot}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-download-2x4-labels-pdf"
              data-testid="btn-download-2x4-labels-pdf"
              onClick={handleDownloadPdf}
              disabled={queuedTyres.length === 0}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Download calibrated vector PDF for external sharing or backup"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              id="btn-print-2x4-labels-now"
              data-testid="btn-print-2x4-labels-now"
              onClick={handlePrint}
              disabled={queuedTyres.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40"
              title="Print 2x4 labels using browser or laser printer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print 2×4 Labels ({queuedTyres.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status Toast */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-[130] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}
    </div>
  );
};
