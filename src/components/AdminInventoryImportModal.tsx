import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Tyre, TyreCategory, TyreCondition } from '../types';
import { getTyreBarcodeValue } from '../utils/barcodeGenerator';

interface ParsedTyreRow {
  rowNumber: number;
  id?: string;
  brand: string;
  modelName: string;
  size: string;
  condition: TyreCondition;
  category: TyreCategory;
  priceXCD: number;
  stockCount: number;
  rimDiameter?: number;
  width?: number;
  aspectRatio?: number;
  treadDepthMm?: number;
  speedRating?: string;
  loadIndex?: string;
  warranty?: string;
  dominicaMountainRating?: 1 | 2 | 3 | 4 | 5;
  matchedExistingTyre?: Tyre;
  isNew: boolean;
  isValid: boolean;
  validationError?: string;
}

interface AdminInventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTyres: Tyre[];
  onImportCompleted: (importedTyres: Tyre[], summary: { updatedCount: number; addedCount: number }) => void;
}

const VALID_CATEGORIES: TyreCategory[] = [
  'Passenger & Hatchback',
  'SUV, Crossover & 4x4',
  'All-Terrain (A/T)',
  'Mud-Terrain (M/T)',
  'Commercial Van & Minibus',
  'Heavy Duty Pickup & Truck'
];

export const AdminInventoryImportModal: React.FC<AdminInventoryImportModalProps> = ({
  isOpen,
  onClose,
  existingTyres,
  onImportCompleted
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedTyreRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'update_only' | 'add_only'>('upsert');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to parse CSV lines taking into account quotes and commas
  const parseCsvToGrid = (text: string): string[][] => {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip CRLF
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        lines.push(currentRow);
      }
    }

    return lines;
  };

  const normalizeHeaderKey = (header: string): string => {
    return header
      .toLowerCase()
      .replace(/[\s_\-#]+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const parseSizeDimensions = (sizeStr: string) => {
    // e.g. "205/55 R16", "265/70R17", "31x10.5 R15"
    const match = sizeStr.match(/(\d+)\/(\d+)\s*[rR]?\s*(\d+)/);
    if (match) {
      return {
        width: parseInt(match[1], 10),
        aspectRatio: parseInt(match[2], 10),
        rimDiameter: parseInt(match[3], 10)
      };
    }
    const rimMatch = sizeStr.match(/[rR]\s*(\d+)/i);
    return {
      width: 215,
      aspectRatio: 60,
      rimDiameter: rimMatch ? parseInt(rimMatch[1], 10) : 16
    };
  };

  const handleProcessFile = (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setCsvRawText(text);
        const grid = parseCsvToGrid(text);

        if (grid.length < 2) {
          setParseError('The uploaded CSV does not contain sufficient rows. Please ensure it has a header row and at least one data row.');
          setIsParsing(false);
          return;
        }

        const headers = grid[0].map(normalizeHeaderKey);

        // Find column indices
        const colIdx = {
          id: headers.findIndex((h) => h.includes('id') || h.includes('sku')),
          brand: headers.findIndex((h) => h.includes('brand') || h.includes('make')),
          model: headers.findIndex((h) => h.includes('model') || h.includes('pattern') || h.includes('name')),
          size: headers.findIndex((h) => h.includes('size') || h.includes('dimension')),
          condition: headers.findIndex((h) => h.includes('condition') || h.includes('state')),
          category: headers.findIndex((h) => h.includes('category') || h.includes('type')),
          price: headers.findIndex((h) => h.includes('pricexcd') || h.includes('price') || h.includes('cost') || h.includes('xcd') || h.includes('ec')),
          stock: headers.findIndex((h) => h.includes('stockcount') || h.includes('stock') || h.includes('qty') || h.includes('quantity')),
          rim: headers.findIndex((h) => h.includes('rim') || h.includes('diameter')),
          tread: headers.findIndex((h) => h.includes('tread') || h.includes('depth')),
          speed: headers.findIndex((h) => h.includes('speed')),
          load: headers.findIndex((h) => h.includes('load')),
          warranty: headers.findIndex((h) => h.includes('warranty')),
          rating: headers.findIndex((h) => h.includes('mountain') || h.includes('rating'))
        };

        if (colIdx.brand === -1 && colIdx.size === -1 && colIdx.price === -1) {
          setParseError('Could not locate required columns (Brand, Size, Price). Please verify your CSV header row matches the Max Executive schema.');
          setIsParsing(false);
          return;
        }

        const rows: ParsedTyreRow[] = [];

        for (let i = 1; i < grid.length; i++) {
          const cells = grid[i];
          if (cells.length === 0 || cells.every((c) => !c)) continue;

          const rawId = colIdx.id !== -1 ? cells[colIdx.id] : undefined;
          const brand = colIdx.brand !== -1 ? cells[colIdx.brand] : 'Universal';
          const modelName = colIdx.model !== -1 ? cells[colIdx.model] : 'Highway All-Season';
          const size = colIdx.size !== -1 ? cells[colIdx.size] : '205/55 R16';

          const rawCondition = colIdx.condition !== -1 ? cells[colIdx.condition]?.toLowerCase() : 'new';
          const condition: TyreCondition = rawCondition.includes('used') ? 'used' : 'new';

          const rawCategory = colIdx.category !== -1 ? cells[colIdx.category] : '';
          let matchedCategory: TyreCategory = 'Passenger & Hatchback';
          if (rawCategory) {
            const found = VALID_CATEGORIES.find(
              (c) => c.toLowerCase() === rawCategory.toLowerCase() || rawCategory.toLowerCase().includes(c.toLowerCase().slice(0, 5))
            );
            if (found) matchedCategory = found;
          }

          const rawPrice = colIdx.price !== -1 ? cells[colIdx.price] : '350';
          const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

          const rawStock = colIdx.stock !== -1 ? cells[colIdx.stock] : '8';
          const cleanStock = parseInt(rawStock.replace(/[^0-9]/g, ''), 10) || 0;

          const dims = parseSizeDimensions(size);
          const rawRim = colIdx.rim !== -1 ? parseInt(cells[colIdx.rim], 10) : undefined;
          const rimDiameter = !isNaN(Number(rawRim)) && rawRim ? rawRim : dims.rimDiameter;

          // Check if matches existing inventory tyre
          const matched = existingTyres.find((t) => {
            if (rawId && t.id.toLowerCase() === rawId.toLowerCase()) return true;
            return (
              t.brand.toLowerCase() === brand.toLowerCase() &&
              t.size.toLowerCase().replace(/\s+/g, '') === size.toLowerCase().replace(/\s+/g, '') &&
              t.condition === condition
            );
          });

          const isValid = Boolean(brand && size && cleanPrice > 0 && cleanStock >= 0);
          let validationError: string | undefined;
          if (!brand) validationError = 'Missing Brand name';
          else if (!size) validationError = 'Missing Tyre Size';
          else if (cleanPrice <= 0) validationError = 'Price must be greater than EC$ 0';
          else if (cleanStock < 0) validationError = 'Stock count cannot be negative';

          rows.push({
            rowNumber: i + 1,
            id: rawId || (matched ? matched.id : undefined),
            brand,
            modelName,
            size,
            condition,
            category: matchedCategory,
            priceXCD: cleanPrice,
            stockCount: cleanStock,
            rimDiameter,
            width: dims.width,
            aspectRatio: dims.aspectRatio,
            treadDepthMm: colIdx.tread !== -1 ? parseFloat(cells[colIdx.tread]) || (condition === 'new' ? 8.5 : 6.0) : (condition === 'new' ? 8.5 : 6.0),
            speedRating: colIdx.speed !== -1 ? cells[colIdx.speed] : 'H (210 km/h)',
            loadIndex: colIdx.load !== -1 ? cells[colIdx.load] : '91 (615 kg)',
            warranty: colIdx.warranty !== -1 ? cells[colIdx.warranty] : (condition === 'new' ? '1-Year Workshop Warranty' : '30-Day Exchange Warranty'),
            dominicaMountainRating: (colIdx.rating !== -1 ? Math.min(5, Math.max(1, parseInt(cells[colIdx.rating], 10) || 4)) : 4) as 1 | 2 | 3 | 4 | 5,
            matchedExistingTyre: matched,
            isNew: !matched,
            isValid,
            validationError
          });
        }

        setParsedRows(rows);
        setIsParsing(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown parsing error occurred';
        setParseError(`Failed to parse CSV file: ${message}`);
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
      setIsParsing(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.type.includes('csv') || droppedFile.type.includes('text/plain')) {
        handleProcessFile(droppedFile);
      } else {
        setParseError('Please upload a valid .csv file.');
      }
    }
  };

  const handleDownloadSampleCsv = () => {
    const sampleHeaders = [
      'Brand',
      'Model_Name',
      'Size',
      'Rim_Diameter_Inch',
      'Condition',
      'Category',
      'Price_XCD',
      'Stock_Count',
      'Tread_Depth_mm',
      'Speed_Rating',
      'Load_Index',
      'Warranty',
      'Dominica_Mountain_Rating'
    ];

    const sampleRows = [
      [
        'Michelin',
        'Primacy 4+',
        '205/55 R16',
        '16',
        'new',
        'Passenger & Hatchback',
        '365.00',
        '12',
        '8.5',
        'H (210 km/h)',
        '91 (615 kg)',
        '1-Year Workshop Warranty',
        '5'
      ],
      [
        'BFGoodrich',
        'All-Terrain T/A KO2',
        '265/70 R17',
        '17',
        'new',
        'All-Terrain (A/T)',
        '650.00',
        '8',
        '12.0',
        'S (180 km/h)',
        '112/109S',
        '2-Year Dominica Road Guarantee',
        '5'
      ],
      [
        'Bridgestone',
        'Dueler H/T 684 II',
        '245/70 R16',
        '16',
        'used',
        'SUV, Crossover & 4x4',
        '220.00',
        '4',
        '6.8',
        'T (190 km/h)',
        '107T',
        '30-Day Workshop Warranty',
        '4'
      ]
    ];

    const csvString = [sampleHeaders.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'max_executive_inventory_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    let updatedCount = 0;
    let addedCount = 0;

    const finalTyresToSubmit: Tyre[] = [];

    validRows.forEach((row, idx) => {
      if (row.matchedExistingTyre) {
        if (importMode === 'add_only') return;
        updatedCount++;
        const updatedTyre: Tyre = {
          ...row.matchedExistingTyre,
          brand: row.brand,
          modelName: row.modelName,
          size: row.size,
          category: row.category,
          condition: row.condition,
          priceXCD: row.priceXCD,
          stockCount: row.stockCount,
          rimDiameter: row.rimDiameter || row.matchedExistingTyre.rimDiameter,
          width: row.width || row.matchedExistingTyre.width,
          aspectRatio: row.aspectRatio || row.matchedExistingTyre.aspectRatio,
          treadDepthMm: row.treadDepthMm || row.matchedExistingTyre.treadDepthMm
        };
        finalTyresToSubmit.push(updatedTyre);
      } else {
        if (importMode === 'update_only') return;
        addedCount++;
        const newTyreId = row.id || `t-imported-${Date.now()}-${idx + 1}`;
        const defaultImage =
          row.category === 'All-Terrain (A/T)' || row.category === 'Mud-Terrain (M/T)'
            ? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
            : row.category === 'SUV, Crossover & 4x4'
            ? 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=600&auto=format&fit=crop&q=80';

        const newTyre: Tyre = {
          id: newTyreId,
          brand: row.brand,
          modelName: row.modelName,
          size: row.size,
          width: row.width || 215,
          aspectRatio: row.aspectRatio || 60,
          rimDiameter: row.rimDiameter || 16,
          condition: row.condition,
          category: row.category,
          priceXCD: row.priceXCD,
          stockCount: row.stockCount,
          image: defaultImage,
          treadDepthMm: row.treadDepthMm || (row.condition === 'new' ? 8.5 : 6.0),
          originalTreadMm: row.condition === 'new' ? 8.5 : 10.0,
          speedRating: row.speedRating || 'H (210 km/h)',
          loadIndex: row.loadIndex || '91 (615 kg)',
          warranty: row.warranty || (row.condition === 'new' ? '1-Year Workshop Warranty' : '30-Day Exchange Warranty'),
          wetGripRating: 'A',
          potholeResistance: 'Reinforced Extra Load (XL)',
          dominicaMountainRating: row.dominicaMountainRating || 4,
          shortDescription: `${row.brand} ${row.modelName} ${row.size} imported inventory item fitted at Maranatha Square, Pichelin.`,
          features: ['Mountain Grade Compound', 'Reinforced Pichelin Sidewall', 'Wet Weather Safety'],
          inspectionPassed: true
        };
        // Generate barcode
        newTyre.barcode = getTyreBarcodeValue(newTyre);
        finalTyresToSubmit.push(newTyre);
      }
    });

    onImportCompleted(finalTyresToSubmit, { updatedCount, addedCount });
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const matchCount = parsedRows.filter((r) => r.isValid && r.matchedExistingTyre).length;
  const newSkuCount = parsedRows.filter((r) => r.isValid && !r.matchedExistingTyre).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div
      id="admin-inventory-import-modal-backdrop"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0984E3] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Import Inventory via CSV
                <span className="text-[10.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Bulk Updater
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Bulk upload tyre items to update stock levels, prices, and register new SKUs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Download pre-formatted CSV template"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Sample CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50">
          {/* File Upload Zone */}
          {!parsedRows.length && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-[#0984E3] bg-blue-50/80 scale-[0.99]'
                  : 'border-slate-300 bg-white hover:border-[#0984E3] hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-[#0984E3] flex items-center justify-center mb-4 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Click to browse or drag & drop inventory CSV file
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Supports official Max Executive inventory exports, vendor spreadsheets, or custom tyre catalogues with columns: Brand, Model, Size, Price, and Stock Count.
              </p>
              <div className="flex items-center gap-2 mt-5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto schema column detection
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Upsert & stock matching
                </span>
              </div>
            </div>
          )}

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold">CSV Parsing Issue:</strong>
                <p className="mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {/* Parsed Results Overview & Configuration */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* File details & reset */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <span>{file?.name || 'Uploaded File'}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        ({(file?.size ? (file.size / 1024).toFixed(1) : '0')} KB)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Found {parsedRows.length} total rows &bull; {validCount} valid for import
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFile(null);
                      setCsvRawText('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>

              {/* Status Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Rows
                  </span>
                  <span className="text-lg font-black text-slate-900">{parsedRows.length}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
                  <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Existing Matches
                  </span>
                  <span className="text-lg font-black text-emerald-700">{matchCount} to update</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
                  <span className="text-[10.5px] font-bold text-blue-700 uppercase tracking-wider block">
                    New Tyre SKUs
                  </span>
                  <span className="text-lg font-black text-blue-700">{newSkuCount} to add</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
                  <span className="text-[10.5px] font-bold text-rose-700 uppercase tracking-wider block">
                    Invalid Rows
                  </span>
                  <span className="text-lg font-black text-rose-700">{errorCount} errors</span>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2 shadow-xs">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0984E3]" />
                  Import Execution Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'upsert'
                        ? 'border-[#0984E3] bg-blue-50/60 font-bold text-blue-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold">Update & Add New (Recommended)</div>
                      <div className="text-[10.5px] text-slate-500 font-normal">
                        Updates price & stock on matches; registers new tyre sizes.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'update_only'
                        ? 'border-[#0984E3] bg-blue-50/60 font-bold text-blue-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'update_only'}
                      onChange={() => setImportMode('update_only')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold">Update Existing Matches Only</div>
                      <div className="text-[10.5px] text-slate-500 font-normal">
                        Only modifies existing inventory items; ignores unknown SKUs.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'add_only'
                        ? 'border-[#0984E3] bg-blue-50/60 font-bold text-blue-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'add_only'}
                      onChange={() => setImportMode('add_only')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold">Add New SKUs Only</div>
                      <div className="text-[10.5px] text-slate-500 font-normal">
                        Inserts new catalogue entries without touching existing records.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">
                    Preview of Mapped Inventory Data ({parsedRows.length} Rows)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Showing first {Math.min(parsedRows.length, 100)} items
                  </span>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Status / Action</th>
                        <th className="py-2.5 px-3">Brand & Model</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Condition</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Price (EC$)</th>
                        <th className="py-2.5 px-3">Stock Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 100).map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50/80 transition ${
                            !row.isValid ? 'bg-rose-50/40 text-rose-900' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {!row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Invalid ({row.validationError})
                              </span>
                            ) : row.matchedExistingTyre ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Will Update
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Plus className="w-3 h-3" /> New SKU
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {row.brand} <span className="font-normal text-slate-600">{row.modelName}</span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {row.size}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                row.condition === 'new'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {row.condition}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-600 max-w-[140px] truncate">
                            {row.category}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            EC$ {row.priceXCD.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {row.stockCount} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                Ready to apply: <strong>{validCount}</strong> items ({matchCount} updates, {newSkuCount} additions)
              </span>
            ) : (
              <span>Upload your inventory spreadsheet to begin mapping.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="confirm-apply-bulk-import-btn"
              disabled={validCount === 0 || isParsing}
              onClick={handleApplyImport}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition shadow-md cursor-pointer ${
                validCount === 0 || isParsing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#0984E3] hover:bg-blue-600 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Bulk Import ({validCount} Items)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
