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
  ZoomOut
} from 'lucide-react';
import { Tyre } from '../types';
import { TyreBarcodeLabel } from './TyreBarcodeLabel';
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
}

export const InventoryBarcodeCenterModal: React.FC<InventoryBarcodeCenterModalProps> = ({
  isOpen,
  onClose,
  tyres,
  initialSelectedIds,
  initialFormat,
  onOpenScanner
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
  const [viewMode, setViewMode] = useState<'sheet' | 'grid'>('sheet');
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);

  // Initialize selected IDs with initialSelectedIds or all tyres
  React.useEffect(() => {
    if (isOpen) {
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
      } else {
        setSelectedIds(tyres.map((t) => t.id));
      }
    }
  }, [isOpen, tyres, initialSelectedIds]);

  React.useEffect(() => {
    if (isOpen && initialFormat) {
      setLabelFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  const filteredTyres = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tyres.filter((t) => {
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
  }, [tyres, searchQuery, selectedCondition]);

  // Expand selected tyres according to quantity mode
  const queuedLabels = useMemo(() => {
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
  }, [filteredTyres, selectedIds, quantityMode, customCopies]);

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
          setTimeout(() => {
            setIsPrinting(false);
            setPrintStatusMessage(null);
            document.body.classList.remove('is-printing-barcode-sheet');
          }, 3500);
          return;
        }

        console.warn('Iframe print failed or sandbox restricted:', printResult.reason);
      }

      // Fallback: direct window.print()
      try {
        window.print();
        setPrintStatusMessage('System print dialog opened.');
        setTimeout(() => {
          setIsPrinting(false);
          setPrintStatusMessage(null);
          document.body.classList.remove('is-printing-barcode-sheet');
        }, 2500);
      } catch (printErr) {
        console.warn('window.print() restricted in sandbox iframe, generating vector PDF:', printErr);
        // Automatic graceful fallback for sandboxed iframes
        handleDownloadPDF();
        setPrintStatusMessage('Notice: Browser iframe sandbox restricted print dialog. Auto-generated 8.5"×11" Avery 5163 PDF for direct printing!');
        setTimeout(() => {
          setIsPrinting(false);
          setPrintStatusMessage(null);
          document.body.classList.remove('is-printing-barcode-sheet');
        }, 6000);
      }
    } catch (err) {
      console.error('Print failure:', err);
      // Fallback to PDF
      handleDownloadPDF();
      setPrintStatusMessage('Printer route completed via vector 8.5"×11" PDF download.');
      setTimeout(() => {
        setIsPrinting(false);
        setPrintStatusMessage(null);
        document.body.classList.remove('is-printing-barcode-sheet');
      }, 4000);
    }
  };

  const handleDownloadPDF = () => {
    try {
      playPrinterFeedSound();
      setPrintStatusMessage('Generating high-resolution vector 8.5"×11" Avery 5163 label PDF...');
      const doc = generateBarcodeLabelsPDF(sheets, labelFormat, showBorders);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Max_Executive_Tires_Labels_Avery5163_${dateStr}.pdf`;
      doc.save(fileName);
      setPrintStatusMessage(`Downloaded ${fileName} (10 labels per sheet ready for printing)`);
      setTimeout(() => setPrintStatusMessage(null), 4000);
    } catch (pdfErr) {
      console.error('PDF Generation failed:', pdfErr);
      setPrintStatusMessage('Failed to generate PDF. Please retry.');
      setTimeout(() => setPrintStatusMessage(null), 3000);
    }
  };

  const handlePrintSingleLabel = (targetTyre: Tyre) => {
    try {
      playPrinterFeedSound();
      const singleSheet = [[{ tyre: targetTyre, slotIndex: 1 }]];
      const doc = generateBarcodeLabelsPDF(singleSheet, labelFormat, showBorders);
      const cleanSize = targetTyre.size.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Label_${cleanSize}_${targetTyre.brand}_2x4.pdf`;
      doc.save(fileName);
      setPrintStatusMessage(`Generated 2"×4" label PDF for ${targetTyre.size} (${targetTyre.brand})`);
      setTimeout(() => setPrintStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to print single label:', err);
    }
  };

  const handleExportBarcodeCSV = () => {
    const headers = [
      'Barcode',
      'Tyre_Size',
      'Brand',
      'Model',
      'Condition',
      'Price_XCD',
      'Price_USD',
      'Stock_Count',
      'Category'
    ];
    const rows = filteredTyres.map((t) => [
      `"${getTyreBarcodeValue(t)}"`,
      `"${t.size}"`,
      `"${t.brand}"`,
      `"${t.modelName}"`,
      t.condition,
      t.priceXCD,
      (t.priceXCD / 2.7).toFixed(2),
      t.stockCount,
      `"${t.category}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `max_executive_tires_barcodes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  return (
    <div
      id="barcode-center-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Header Bar */}
        <div id="barcode-center-header" className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Inventory Barcode Generator & Print Center
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  8.5&quot; × 11&quot; Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Print 2&quot;×4&quot; labels on standard 8½&quot;×11&quot; label sheets (Avery 5163 / 5263 / 8163) with Tyre Size, Size Barcode, and Retail Price in EC$ & US$.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenScanner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-2.5 rounded-xl shadow-md transition cursor-pointer active:scale-95"
                title="Open live barcode scanner to look up tyres or adjust stock"
              >
                <Camera className="w-4 h-4" />
                <span>Launch Scanner</span>
              </button>
            )}

            <button
              id="barcode-print-sheet-btn"
              type="button"
              onClick={handlePrintSheet}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition cursor-pointer active:scale-95"
              title="Print 2x4 labels on 8.5x11 paper"
            >
              <Printer className="w-4 h-4" />
              <span>Print 2&quot;×4&quot; Labels ({queuedLabels.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportBarcodeCSV}
              className="hidden sm:inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Export all barcode data to CSV"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCsv ? 'Exported' : 'CSV'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Primary Controls & Sheet Specifications Toolbar */}
        <div id="barcode-center-filters" className="bg-slate-800/95 border-b border-slate-700 px-4 py-3 flex flex-col gap-3 text-xs">
          {/* Row 1: Search, Condition, Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tyre size (e.g. 205/55), brand..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Condition Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-1">
                Condition:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCondition('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  selectedCondition === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({tyres.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('new')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  selectedCondition === 'new' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Brand New
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('used')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  selectedCondition === 'used' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Used
              </button>
            </div>

            {/* Selection toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer"
              >
                {selectedIds.length === filteredTyres.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {selectedIds.length === filteredTyres.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              <div className="h-4 w-px bg-slate-700" />

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('sheet')}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'sheet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Preview exact 8.5x11 printed sheets with margins"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>8.5×11 Sheet View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="List all labels in a compact grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: 2x4 on 8.5x11 Paper Setup & Calibration */}
          <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
            {/* Paper Template Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-400 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Label Template:
              </span>

              {/* Avery 5163 - 2" x 4" on 8.5" x 11" Paper */}
              <button
                type="button"
                onClick={() => setLabelFormat('avery_5163')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                  labelFormat === 'avery_5163'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Avery 5163 / 5263 / 8163 standard: 10 labels per 8.5x11 sheet (2 columns x 5 rows)"
              >
                2&quot; × 4&quot; Labels (8½&quot; × 11&quot; • 10-Up Avery)
              </button>

              {/* 2 Cols x 5 Rows on 8.5" x 11" Paper */}
              <button
                type="button"
                onClick={() => setLabelFormat('grid_2x4')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  labelFormat === 'grid_2x4'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Generic 2x4 Grid template: 10 labels per 8.5x11 sheet (2 columns x 5 rows of 2x4 labels with cut guides)"
              >
                Generic 2×4 Grid (10-Up • 2×5)
              </button>

              {/* Shelf Tag */}
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

              {/* Compact Sticker */}
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

            {/* Print Options: Quantities, Starting Position, Borders, Scaling */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Print Preview Scaling Control */}
              <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1 mr-1">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Preview Scale:</span>
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
                    { label: '100% (1:1)', val: 1.0 }
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

              {/* Quantity Strategy */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-700">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Qty:</span>
                <select
                  value={quantityMode}
                  onChange={(e) => setQuantityMode(e.target.value as LabelQuantityMode)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="one_each" className="bg-slate-900 text-white">1 per Tyre Size</option>
                  <option value="stock_qty" className="bg-slate-900 text-white">Match In-Stock Quantity</option>
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

              {/* Start at Position Offset (To save partially used Avery sheets) */}
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

        {/* Content Area: Either 8.5" x 11" Sheet Pages or Grid List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80">
          {/* Printable Sheet View: Real 8.5" x 11" Paper Pages */}
          <div id="printable-barcode-sheet" className="space-y-8 print:space-y-0">
            {viewMode === 'sheet' && (labelFormat === 'avery_5163' || labelFormat === 'grid_2x4') ? (
              sheets.map((sheet, pageIdx) => {
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
                            // Blank slot (either offset from start position or empty ending slot)
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
                                onPrintSingle={() => handlePrintSingleLabel(tyre)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Grid / List View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 justify-items-center print:grid-cols-3 print:gap-3">
                {filteredTyres.map((tyre) => {
                  const isSelected = selectedIds.includes(tyre.id);
                  return (
                    <div
                      key={tyre.id}
                      className={`relative group transition ${
                        isSelected ? 'opacity-100' : 'opacity-35 grayscale print:hidden'
                      }`}
                    >
                      {/* Selection Checkbox for each tag */}
                      <button
                        type="button"
                        onClick={() => handleToggleSingle(tyre.id)}
                        className="no-print absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-600 text-white flex items-center justify-center hover:border-blue-400 transition cursor-pointer shadow-md"
                        title={isSelected ? 'Deselect from print batch' : 'Include in print batch'}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-blue-400 stroke-3" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                      </button>

                      {/* Render tag */}
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
                        onPrintSingle={() => handlePrintSingleLabel(tyre)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
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

            {/* Direct Vector PDF Download (Always 100% Operational) */}
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
    </div>
  );
};
