import React, { useState, useMemo } from 'react';
import {
  Barcode,
  Printer,
  X,
  Search,
  CheckSquare,
  Square,
  Download,
  Filter,
  Camera,
  Layers,
  Sparkles,
  RefreshCw,
  Tag,
  Check,
  FileText,
  Sliders,
  Eye,
  Settings,
  Grid,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  QrCode,
  LayoutGrid
} from 'lucide-react';
import { Tyre } from '../types';
import { TyreBarcodeLabel } from './TyreBarcodeLabel';
import { PrinterGuide } from './PrinterGuide';
import { getTyreBarcodeValue } from '../utils/barcodeGenerator';
import { generateBarcodeLabelsPDF } from '../utils/labelPdfGenerator';
import { printHtmlViaIframe } from '../utils/printHelper';
import { playPrinterFeedSound } from '../utils/hardwareAudio';
import { AlertCircle, CheckCircle2, FileDown } from 'lucide-react';

export type LabelPaperFormat = 'avery_5163' | 'grid_2x4' | 'shelf_tag' | 'compact_sticker';
export type LabelQuantityMode = 'one_each' | 'stock_qty' | 'custom';

interface InventoryBarcodeCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tyres: Tyre[];
  initialSelectedIds?: string[];
  initialFormat?: LabelPaperFormat;
  onOpenScanner?: () => void;
  customQueuedTyres?: Tyre[];
  sourceTitle?: string;
}

export const InventoryBarcodeCenterModal: React.FC<InventoryBarcodeCenterModalProps> = ({
  isOpen,
  onClose,
  tyres,
  initialSelectedIds,
  initialFormat,
  onOpenScanner,
  customQueuedTyres,
  sourceTitle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<'ALL' | 'new' | 'used'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [labelFormat, setLabelFormat] = useState<LabelPaperFormat>('avery_5163');
  const [previewScale, setPreviewScale] = useState<number>(0.85); // 0.5, 0.75, 0.85 (Fit), 1.0 (1:1)
  const [quantityMode, setQuantityMode] = useState<LabelQuantityMode>('one_each');
  const [customCopies, setCustomCopies] = useState<number>(2);
  const [startPosition, setStartPosition] = useState<number>(1);
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<'grid' | 'content_only'>('grid');
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showPrinterGuide, setShowPrinterGuide] = useState<boolean>(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);

  // Initialize selected IDs with initialSelectedIds, customQueuedTyres, or all tyres
  React.useEffect(() => {
    if (isOpen) {
      if (customQueuedTyres && customQueuedTyres.length > 0) {
        setSelectedIds(Array.from(new Set(customQueuedTyres.map((t) => t.id))));
      } else if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
      } else {
        setSelectedIds(tyres.map((t) => t.id));
      }
    }
  }, [isOpen, tyres, initialSelectedIds, customQueuedTyres]);

  React.useEffect(() => {
    if (isOpen && initialFormat) {
      setLabelFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  const effectiveTyrePool = useMemo(() => {
    if (customQueuedTyres && customQueuedTyres.length > 0) {
      // Merge custom queued tyres with base tyres to ensure full metadata
      const poolMap = new Map<string, Tyre>();
      customQueuedTyres.forEach((t) => poolMap.set(t.id, t));
      tyres.forEach((t) => {
        if (!poolMap.has(t.id)) poolMap.set(t.id, t);
      });
      return Array.from(poolMap.values());
    }
    return tyres;
  }, [tyres, customQueuedTyres]);

  const filteredTyres = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return effectiveTyrePool.filter((t) => {
      const matchCondition = selectedCondition === 'ALL' || t.condition === selectedCondition;
      if (!matchCondition) return false;

      if (!q) return true;
      const barcode = getTyreBarcodeValue(t).toLowerCase();
      return (
        t.size.toLowerCase().includes(q) ||
        t.brand.toLowerCase().includes(q) ||
        t.modelName.toLowerCase().includes(q) ||
        barcode.includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [effectiveTyrePool, searchQuery, selectedCondition]);

  // Expand selected tyres according to quantity mode
  const queuedLabels = useMemo(() => {
    // If customQueuedTyres were passed and user hasn't toggled quantity mode from one_each
    if (customQueuedTyres && customQueuedTyres.length > 0 && quantityMode === 'one_each') {
      const list = customQueuedTyres.filter((t) => selectedIds.includes(t.id));
      if (list.length > 0) return list;
    }

    const list: Tyre[] = [];
    filteredTyres.forEach((tyre) => {
      if (!selectedIds.includes(tyre.id)) return;
      let count = 1;
      if (quantityMode === 'stock_qty') {
        count = Math.max(1, tyre.stockCount);
      } else if (quantityMode === 'custom') {
        count = Math.max(1, customCopies);
      }
      for (let i = 0; i < count; i++) {
        list.push(tyre);
      }
    });
    return list;
  }, [filteredTyres, selectedIds, quantityMode, customCopies, customQueuedTyres]);

  // Calculate labels per sheet based on format
  const labelsPerSheet = useMemo(() => {
    if (labelFormat === 'avery_5163' || labelFormat === 'grid_2x4') return 10; // 2 cols x 5 rows of 2"x4" labels
    if (labelFormat === 'shelf_tag') return 9;   // 3 cols x 3 rows
    return 16;                                   // 4 cols x 4 rows
  }, [labelFormat]);

  // Paginate queued labels into 8.5" x 11" sheets with starting position offset
  const sheets = useMemo(() => {
    const pages: Array<Array<{ tyre: Tyre | null; slotIndex: number }>> = [];
    let currentSheet: Array<{ tyre: Tyre | null; slotIndex: number }> = [];

    // On page 1 only: offset for partially used sheets
    const offset = Math.max(0, Math.min(labelsPerSheet - 1, startPosition - 1));
    for (let i = 0; i < offset; i++) {
      currentSheet.push({ tyre: null, slotIndex: i + 1 });
    }

    for (const tyre of queuedLabels) {
      currentSheet.push({ tyre, slotIndex: currentSheet.length + 1 });
      if (currentSheet.length === labelsPerSheet) {
        pages.push(currentSheet);
        currentSheet = [];
      }
    }

    if (currentSheet.length > 0) {
      // pad remaining slots to complete sheet boundary
      while (currentSheet.length < labelsPerSheet) {
        currentSheet.push({ tyre: null, slotIndex: currentSheet.length + 1 });
      }
      pages.push(currentSheet);
    }

    if (pages.length === 0) {
      pages.push(
        Array.from({ length: labelsPerSheet }, (_, i) => ({
          tyre: null,
          slotIndex: i + 1
        }))
      );
    }

    return pages;
  }, [queuedLabels, labelsPerSheet, startPosition]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTyres.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTyres.map((t) => t.id));
    }
  };

  const handleToggleSingle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePrintSheet = async () => {
    try {
      playPrinterFeedSound();
      setIsPrinting(true);
      setPrintStatusMessage('Processing print queue for 2"×4" Avery labels on 8.5"×11" sheet...');

      // Add print class to document body
      document.body.classList.add('is-printing-barcode-sheet');

      const printableElement = document.getElementById('printable-barcode-sheet');
      if (printableElement) {
        // Try isolated hidden iframe printing first (bypasses modal fixed/overflow clipping and dark background)
        const printResult = await printHtmlViaIframe(
          printableElement.innerHTML,
          `Max Executive Tires - 2x4 Barcode Labels (${queuedLabels.length} labels)`
        );

        if (printResult.success) {
          setPrintStatusMessage('Print job successfully delivered to printer!');
          setTimeout(() => setPrintStatusMessage(null), 5000);
          return;
        }
      }

      // Fallback: standard window.print
      window.print();
      setPrintStatusMessage('Print dialogue triggered. Remember to set Margins: None and Scale: 100%!');
      setTimeout(() => setPrintStatusMessage(null), 6000);
    } catch (err) {
      console.error('Printing failed, invoking standard print dialog:', err);
      window.print();
    } finally {
      setIsPrinting(false);
      setTimeout(() => {
        document.body.classList.remove('is-printing-barcode-sheet');
      }, 1000);
    }
  };

  const handlePrintSingleLabel = async (tyre: Tyre) => {
    playPrinterFeedSound();
    const barcodeVal = getTyreBarcodeValue(tyre);
    const html = `
      <div style="width: 4.0in; height: 2.0in; padding: 0.15in; box-sizing: border-box; font-family: monospace; border: 1px dashed #94a3b8; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">
          <span style="font-size: 10px; font-weight: bold;">MAX EXECUTIVE TIRES • PICHELIN</span>
          <span style="font-size: 9px; font-weight: bold;">${tyre.condition === 'new' ? 'BRAND NEW' : 'USED'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
          <div>
            <div style="font-size: 8px; color: #64748b;">SIZE</div>
            <div style="font-size: 18px; font-weight: 900;">${tyre.size}</div>
            <div style="font-size: 10px; font-weight: bold;">${tyre.brand} ${tyre.modelName}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 8px; color: #64748b;">PRICE</div>
            <div style="font-size: 16px; font-weight: 900; color: #047857;">EC$ ${tyre.priceXCD}</div>
          </div>
        </div>
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
          <div style="font-size: 10px; letter-spacing: 2px; font-weight: bold;">*${barcodeVal}*</div>
          <div style="font-size: 8px; color: #64748b;">Stock: ${tyre.stockCount} | Category: ${tyre.category}</div>
        </div>
      </div>
    `;
    await printHtmlViaIframe(html, `Label - ${tyre.size}`);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generateBarcodeLabelsPDF(sheets, labelFormat, showBorders);
      doc.save(`Max_Executive_Barcode_Labels_${Date.now()}.pdf`);
      setPrintStatusMessage('PDF generated and downloaded successfully!');
      setTimeout(() => setPrintStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Unable to generate PDF directly. You can use Print -> Save as PDF.');
    }
  };

  const handleCopyBarcodeCsv = () => {
    const rows = [
      ['Tyre ID', 'Size', 'Brand', 'Model', 'Condition', 'Price_XCD', 'Barcode_Code128', 'Stock_Count'],
      ...queuedLabels.map((t) => [
        t.id,
        `"${t.size}"`,
        `"${t.brand}"`,
        `"${t.modelName}"`,
        t.condition,
        t.priceXCD,
        `"${getTyreBarcodeValue(t)}"`,
        t.stockCount
      ])
    ];
    const csvContent = rows.map((e) => e.join(',')).join('\n');
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2500);
    });
  };

  return (
    <div
      id="inventory-barcode-center-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Header & Controls Bar */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 shrink-0 space-y-3">
          {/* Row 1: Brand Title, Search, Printer Guide, Close */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{sourceTitle || 'Max Executive Tires — Barcode & Label Center'}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Avery 5163 Calibrated
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Generate US Letter (8½&quot; × 11&quot;) 10-up label sheets with Code-128 barcodes and product QR codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Printer Calibration Guide Button */}
              <button
                type="button"
                onClick={() => setShowPrinterGuide(true)}
                id="barcode-center-printer-guide-btn"
                className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition shadow-md cursor-pointer ring-2 ring-amber-300/40"
                title="Printer Calibration Guide: Instructions for Margin: None and Scale: 100%"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-950" />
                <span>Printer Guide</span>
              </button>

              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                  title="Open live camera barcode scanner"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Camera Scanner</span>
                </button>
              )}

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Close Barcode Center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: Search, Filters, Preview Mode Toggle, QR Toggle */}
          <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search and Condition Filter */}
            <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tyre sizes (e.g. 205/55R16, Hilux, Bridgestone)..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Conditions</option>
                <option value="new">Brand New Only</option>
                <option value="used">Inspected Used Only</option>
              </select>
            </div>

            {/* PREVIEW MODE TOGGLE: Grid Layout vs Content-Only */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                id="barcode-preview-mode-toggle"
                className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 shadow-xs"
                title="Switch preview between actual 8.5x11 Sheet Grid layout and Content-Only verification mode"
              >
                <button
                  type="button"
                  onClick={() => setPreviewMode('grid')}
                  id="preview-mode-grid-btn"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    previewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="View actual 8.5x11 grid layout with Avery 5163 alignment"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid Layout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('content_only')}
                  id="preview-mode-content-only-btn"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    previewMode === 'content_only'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Content-only preview mode: inspect barcode and tyre data without the sheet outline or paper margins"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Content-Only</span>
                </button>
              </div>

              {/* QR Code Toggle */}
              <button
                type="button"
                onClick={() => setShowQrCode((prev) => !prev)}
                id="toggle-label-qr-code-btn"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  showQrCode
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
                title="Include small product details QR code on each label linking directly to the tyre page"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Product QR Code</span>
                <span className={`w-2 h-2 rounded-full ${showQrCode ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              </button>

              {/* Select / Deselect All */}
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
                title="Select or deselect all items in list"
              >
                {selectedIds.length === filteredTyres.length && filteredTyres.length > 0 ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Select All ({filteredTyres.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 3: Templates, Quantities, Scaling, Cut Guides */}
          <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
            {/* Template Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-400 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Template:
              </span>

              <button
                type="button"
                onClick={() => setLabelFormat('avery_5163')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                  labelFormat === 'avery_5163'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Avery 5163 standard: 10 labels per 8.5x11 sheet (2 columns x 5 rows)"
              >
                2&quot; × 4&quot; Avery 5163 (10-Up Sheet)
              </button>

              <button
                type="button"
                onClick={() => setLabelFormat('grid_2x4')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  labelFormat === 'grid_2x4'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Generic 2x4 Grid template: 10 labels per 8.5x11 sheet with cut guides"
              >
                Generic 2×4 Grid
              </button>

              <button
                type="button"
                onClick={() => setLabelFormat('shelf_tag')}
                className={`px-2.5 py-1.5 rounded-xl font-medium text-xs transition cursor-pointer border ${
                  labelFormat === 'shelf_tag'
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Shelf Tag Cards
              </button>

              <button
                type="button"
                onClick={() => setLabelFormat('compact_sticker')}
                className={`px-2.5 py-1.5 rounded-xl font-medium text-xs transition cursor-pointer border ${
                  labelFormat === 'compact_sticker'
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Compact Stickers
              </button>
            </div>

            {/* Print Options: Quantities, Starting Position, Cut Guides, Scaling */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Zoom scaling for Grid View */}
              {previewMode === 'grid' && (
                <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700 text-xs">
                  <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1 mr-1">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Zoom:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewScale((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-black transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-0.5">
                    {[
                      { label: '50%', val: 0.5 },
                      { label: '75%', val: 0.75 },
                      { label: '85% Fit', val: 0.85 },
                      { label: '100%', val: 1.0 }
                    ].map((s) => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => setPreviewScale(s.val)}
                        className={`px-1.5 py-0.5 rounded text-[10.5px] font-extrabold transition cursor-pointer ${
                          previewScale === s.val
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewScale((prev) => Math.min(1.25, Number((prev + 0.1).toFixed(2))))}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-black transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quantity Strategy */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Qty:</span>
                <select
                  value={quantityMode}
                  onChange={(e) => setQuantityMode(e.target.value as LabelQuantityMode)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="one_each" className="bg-slate-900 text-white">1 per Selected Tyre</option>
                  <option value="stock_qty" className="bg-slate-900 text-white">Match Stock Qty</option>
                  <option value="custom" className="bg-slate-900 text-white">Custom Copies</option>
                </select>

                {quantityMode === 'custom' && (
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={customCopies}
                    onChange={(e) => setCustomCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-center text-white text-xs font-bold"
                  />
                )}
              </div>

              {/* Start at Position Offset */}
              {(labelFormat === 'avery_5163' || labelFormat === 'grid_2x4') && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700" title="Start printing at this label slot if top labels on your 8.5x11 sheet are already peeled off">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Start Slot:</span>
                  <select
                    value={startPosition}
                    onChange={(e) => setStartPosition(parseInt(e.target.value) || 1)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: labelsPerSheet }, (_, i) => i + 1).map((pos) => (
                      <option key={pos} value={pos} className="bg-slate-900 text-white">
                        Label #{pos} {pos === 1 ? '(Top Left)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cut Guides / Outlines */}
              <button
                type="button"
                onClick={() => setShowBorders((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  showBorders
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
                title="Toggle border cut line around each 2x4 label"
              >
                <span className={`w-2 h-2 rounded-full ${showBorders ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>Cut Guides</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area: Either Content-Only Verification View OR 8.5" x 11" Sheet Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80">
          {previewMode === 'content_only' && (
            /* CONTENT-ONLY VERIFICATION VIEW (NO SHEET OUTLINE, NO 8.5x11 MARGINS) */
            <div id="barcode-content-only-view" className="space-y-6 max-w-6xl mx-auto animate-fade-in no-print">
              {/* Verification Header Banner */}
              <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-400/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>Content-Only Verification View</span>
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                        {queuedLabels.length} Labels Queued
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Direct label data inspection without sheet margins, paper borders, or slot offsets. Verify barcodes and product QR codes before printing.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('grid')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    Switch to 8.5&quot;×11&quot; Sheet Grid →
                  </button>
                </div>
              </div>

              {/* Grid of clean labels without sheet borders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
                {queuedLabels.map((tyre, idx) => (
                  <div
                    key={`content-preview-${tyre.id}-${idx}`}
                    className="bg-white rounded-2xl p-3 shadow-lg border border-slate-300 hover:border-blue-400 transition-all flex flex-col items-center group relative w-full max-w-[4.2in]"
                  >
                    <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 pb-1.5 mb-1.5 border-b border-slate-100">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        Label #{idx + 1} of {queuedLabels.length}
                      </span>
                      <span className="text-slate-400">
                        ID: {tyre.id} • Stock: {tyre.stockCount}
                      </span>
                    </div>

                    <TyreBarcodeLabel
                      tyre={tyre}
                      variant={
                        labelFormat === 'avery_5163'
                          ? 'avery_2x4'
                          : labelFormat === 'grid_2x4'
                          ? 'large_2x4'
                          : labelFormat
                      }
                      showBorder={showBorders}
                      showQr={showQrCode}
                      onPrintSingle={() => handlePrintSingleLabel(tyre)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTUAL 8.5" x 11" SHEET GRID LAYOUT VIEW (Visible in 'grid' mode, hidden on screen in 'content_only' mode, available in DOM for printing in both modes) */}
          <div
            id="printable-barcode-sheet"
            className={previewMode === 'content_only' ? 'hidden print:block print:space-y-0' : 'space-y-8 print:space-y-0'}
          >
              {sheets.map((sheet, pageIdx) => {
                const sheetNumber = pageIdx + 1;
                const totalSheets = sheets.length;

                return (
                  <div key={pageIdx} className="flex flex-col items-center">
                    {/* Screen-only Sheet Header Bar */}
                    <div className="no-print w-full max-w-[8.5in] flex items-center justify-between mb-2 text-xs text-slate-400 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          Sheet {sheetNumber} of {totalSheets}
                        </span>
                        <span className="font-semibold text-slate-300">
                          8.5&quot; × 11&quot; US Letter Paper ({labelFormat === 'avery_5163' ? '2" × 4" Labels • Avery 5163' : 'Generic 2×4 Grid'})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        10 Labels (2 columns × 5 rows) • Display Zoom: {Math.round(previewScale * 100)}%
                      </span>
                    </div>

                    {/* Actual 8.5" x 11" Sheet Container with Preview Zoom Scaling */}
                    <div
                      className="sheet-preview-zoom-wrapper transition-transform duration-150 origin-top flex justify-center w-full"
                      style={{
                        transform: previewScale !== 1 ? `scale(${previewScale})` : undefined,
                        transformOrigin: 'top center',
                        marginBottom: previewScale < 1 ? `-${(11.0 * (1 - previewScale)).toFixed(2)}in` : undefined
                      }}
                    >
                      <div
                        className={`label-sheet-8x11 bg-white text-slate-900 shadow-2xl rounded-sm print:rounded-none print:shadow-none ${
                          labelFormat === 'avery_5163' ? 'avery-5163-sheet' : 'grid-2x4-sheet'
                        }`}
                        style={{
                          width: '8.5in',
                          minHeight: '11.0in',
                          height: '11.0in',
                          padding: '0.5in 0.15625in',
                          boxSizing: 'border-box',
                          display: 'grid',
                          gridTemplateColumns: '4.0in 4.0in',
                          gridTemplateRows: 'repeat(5, 2.0in)',
                          columnGap: '0.1875in',
                          rowGap: '0in',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {sheet.map((item, idx) => {
                          const { tyre, slotIndex } = item;

                          if (!tyre) {
                            // Blank slot
                            return (
                              <div
                                key={`empty-${pageIdx}-${idx}`}
                                className={`label-2x4-item ${
                                  labelFormat === 'avery_5163' ? 'avery-2x4-label' : 'large-2x4-label'
                                } border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 select-none bg-slate-50/50 print:border-none print:bg-transparent`}
                                style={{
                                  width: '4.0in',
                                  height: '2.0in',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <span className="no-print text-[10px] font-mono font-semibold text-slate-400">
                                  Slot #{slotIndex}
                                </span>
                                <span className="no-print text-[9px] text-slate-400">
                                  {pageIdx === 0 && slotIndex < startPosition ? '(Skipped - Used Label)' : '(Empty Slot)'}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`tyre-${tyre.id}-${pageIdx}-${idx}`}
                              className={`label-2x4-item relative group ${
                                labelFormat === 'avery_5163' ? 'avery-2x4-label' : 'large-2x4-label'
                              }`}
                              style={{
                                width: '4.0in',
                                height: '2.0in',
                                boxSizing: 'border-box'
                              }}
                            >
                              <TyreBarcodeLabel
                                tyre={tyre}
                                variant={labelFormat === 'avery_5163' ? 'avery_2x4' : 'large_2x4'}
                                showBorder={showBorders}
                                showQr={showQrCode}
                                onPrintSingle={() => handlePrintSingleLabel(tyre)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          {filteredTyres.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Barcode className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-60" />
              <p className="font-bold text-sm text-slate-300">No inventory tyres match your search.</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for a different size (e.g. 205/55 or 265/70) or brand.</p>
            </div>
          )}
        </div>

        {/* Print Status Feedback Banner */}
        {printStatusMessage && (
          <div className="bg-blue-950/90 border-t border-blue-700/60 px-4 py-2.5 text-xs text-blue-200 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{printStatusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintStatusMessage(null)}
              className="text-blue-300 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Footer info & Print Trigger Bar */}
        <div id="barcode-center-footer" className="bg-slate-900 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Format: <strong className="text-white">2&quot; × 4&quot; on 8½&quot; × 11&quot; Paper</strong> ({labelsPerSheet} per sheet • Avery 5163 standard). Barcodes calibrated for laser scanner & mobile guns.
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="text-right mr-1 hidden sm:block">
              <span className="font-mono text-slate-200 font-bold block">
                {queuedLabels.length} labels queued ({sheets.length} page{sheets.length > 1 ? 's' : ''} of 8.5&quot;×11&quot;)
              </span>
              <span className="text-[10px] text-slate-400">
                {selectedIds.length} tyre size{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Direct Vector PDF Download */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 text-xs"
              title="Download exact 8.5x11 US Letter PDF with 10 Avery 5163 labels per sheet"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Download PDF (8.5&quot;×11&quot;)</span>
            </button>

            {/* Primary Print Button */}
            <button
              type="button"
              onClick={handlePrintSheet}
              disabled={isPrinting}
              id="barcode-center-primary-print-btn"
              className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 text-xs ${
                isPrinting ? 'opacity-70 cursor-wait' : ''
              }`}
              title="Send 2x4 labels directly to printer"
            >
              <Printer className={`w-4 h-4 ${isPrinting ? 'animate-spin' : ''}`} />
              <span>{isPrinting ? 'Printing Labels...' : `Print 2"×4" Labels (${queuedLabels.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printer Alignment Guide Modal */}
      {showPrinterGuide && (
        <PrinterGuide isOpen={showPrinterGuide} onClose={() => setShowPrinterGuide(false)} />
      )}
    </div>
  );
};
