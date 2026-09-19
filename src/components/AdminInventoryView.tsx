import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  Check, 
  X, 
  Printer, 
  Download, 
  ShoppingBag, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Car, 
  Package, 
  Filter,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  History,
  TrendingDown,
  Clock,
  Barcode,
  Camera,
  ScanLine,
  CheckSquare,
  Square,
  Eye,
  Grid,
  HelpCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload
} from 'lucide-react';
import { Tyre, TyreCondition, TyreCategory } from '../types';
import { getTyreBarcodeValue } from '../utils/barcodeGenerator';
import { TyreBarcodeLabel } from './TyreBarcodeLabel';
import { InventoryBarcodeCenterModal } from './InventoryBarcodeCenterModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PrinterGuide } from './PrinterGuide';
import { AdminQuickAdjustModal } from './AdminQuickAdjustModal';
import { AdminInventoryImportModal } from './AdminInventoryImportModal';

export interface PriceUpdateRecord {
  id: string;
  tyreId: string;
  brand: string;
  modelName: string;
  size: string;
  category: string;
  oldPriceXCD: number;
  newPriceXCD: number;
  diffXCD: number;
  timestamp: string;
  updatedBy: string;
}

const DEFAULT_PRICE_HISTORY: PriceUpdateRecord[] = [
  {
    id: 'ph-1',
    tyreId: 't-1',
    brand: 'Michelin',
    modelName: 'Primacy 4+',
    size: '205/55 R16',
    category: 'Passenger & Hatchback',
    oldPriceXCD: 345,
    newPriceXCD: 365,
    diffXCD: 20,
    timestamp: 'Yesterday, 4:15 PM',
    updatedBy: 'Manager Max'
  },
  {
    id: 'ph-2',
    tyreId: 't-3',
    brand: 'Goodyear',
    modelName: 'Wrangler Duratrac RT',
    size: '265/70 R17',
    category: 'All-Terrain (A/T)',
    oldPriceXCD: 595,
    newPriceXCD: 620,
    diffXCD: 25,
    timestamp: '3 days ago',
    updatedBy: 'Manager Max'
  },
  {
    id: 'ph-3',
    tyreId: 't-5',
    brand: 'Bridgestone',
    modelName: 'Dueler A/T 001',
    size: '235/65 R17',
    category: 'SUV, Crossover & 4x4',
    oldPriceXCD: 440,
    newPriceXCD: 425,
    diffXCD: -15,
    timestamp: 'Last week',
    updatedBy: 'Manager Max'
  }
];

interface AdminInventoryViewProps {
  tyres: Tyre[];
  onUpdateTyrePrice?: (tyreId: string, newPriceXCD: number) => void;
  onUpdateTyreStock?: (tyreId: string, newStock: number) => void;
  onAddNewTyre?: (newTyre: Tyre) => void;
  onAddToPos?: (tyre: Tyre) => void;
  onOpenScanner?: () => void;
  onOpenBarcodeCenter?: () => void;
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  tyres,
  onUpdateTyrePrice,
  onUpdateTyreStock,
  onAddNewTyre,
  onAddToPos,
  onOpenScanner,
  onOpenBarcodeCenter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<'ALL' | 'new' | 'used'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [showPriceTrendView, setShowPriceTrendView] = useState(false);
  const [priceHistorySearch, setPriceHistorySearch] = useState('');
  const [isBarcodeCenterOpen, setIsBarcodeCenterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [singleTyreToPrint, setSingleTyreToPrint] = useState<Tyre | null>(null);
  const [singlePreviewMode, setSinglePreviewMode] = useState<'grid' | 'content_only'>('grid');
  const [isSinglePrinterGuideOpen, setIsSinglePrinterGuideOpen] = useState(false);
  const [selectedTyreIds, setSelectedTyreIds] = useState<string[]>([]);
  const [batchPrintIds, setBatchPrintIds] = useState<string[] | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Quick Adjust Modal State
  const [quickAdjustTyre, setQuickAdjustTyre] = useState<Tyre | null>(null);
  const [inventoryNotification, setInventoryNotification] = useState<string | null>(null);

  // Price history state with localStorage fallback
  const [priceHistory, setPriceHistory] = useState<PriceUpdateRecord[]>(() => {
    try {
      const saved = localStorage.getItem('max_executive_price_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PRICE_HISTORY;
  });

  // Sync price history to local storage
  const savePriceHistory = (updated: PriceUpdateRecord[]) => {
    setPriceHistory(updated);
    try {
      localStorage.setItem('max_executive_price_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Inline editing state for price and stock
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<string>('');

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>('');

  // Add Tyre Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newCondition, setNewCondition] = useState<TyreCondition>('new');
  const [newCategory, setNewCategory] = useState<TyreCategory>('SUV, Crossover & 4x4');
  const [newPriceXCD, setNewPriceXCD] = useState<number>(350);
  const [newStockCount, setNewStockCount] = useState<number>(8);
  const [newDescription, setNewDescription] = useState('');
  const [addSuccessMessage, setAddSuccessMessage] = useState(false);

  // Filtered tyres
  const filteredTyres = useMemo(() => {
    return tyres.filter(t => {
      // Condition filter
      if (selectedCondition !== 'ALL' && t.condition !== selectedCondition) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
        return false;
      }
      // Stock filter
      if (stockFilter === 'LOW' && (t.stockCount <= 0 || t.stockCount > 4)) {
        return false;
      }
      if (stockFilter === 'OUT' && t.stockCount > 0) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          t.brand.toLowerCase().includes(q) ||
          t.modelName.toLowerCase().includes(q) ||
          t.size.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.plyRating && t.plyRating.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [tyres, searchQuery, selectedCondition, selectedCategory, stockFilter]);

  // Column sorting state
  const [sortField, setSortField] = useState<'brand' | 'size' | 'barcode' | 'condition' | 'category' | 'price' | 'stock' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'brand' | 'size' | 'barcode' | 'condition' | 'category' | 'price' | 'stock') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      // For price and stock, default to highest first ('desc') on first click
      setSortDirection(field === 'price' || field === 'stock' ? 'desc' : 'asc');
    }
  };

  // Sorted and filtered tyres
  const sortedTyres = useMemo(() => {
    if (!sortField) return filteredTyres;
    return [...filteredTyres].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'brand': {
          const brandCmp = a.brand.localeCompare(b.brand);
          comparison = brandCmp !== 0 ? brandCmp : a.modelName.localeCompare(b.modelName);
          break;
        }
        case 'size': {
          const rimA = a.rimDiameter || 0;
          const rimB = b.rimDiameter || 0;
          comparison = rimA !== rimB ? rimA - rimB : a.size.localeCompare(b.size);
          break;
        }
        case 'barcode': {
          const bcA = getTyreBarcodeValue(a);
          const bcB = getTyreBarcodeValue(b);
          comparison = bcA.localeCompare(bcB);
          break;
        }
        case 'condition': {
          comparison = a.condition.localeCompare(b.condition);
          break;
        }
        case 'category': {
          comparison = a.category.localeCompare(b.category);
          break;
        }
        case 'price': {
          comparison = (a.priceXCD || 0) - (b.priceXCD || 0);
          break;
        }
        case 'stock': {
          comparison = (a.stockCount || 0) - (b.stockCount || 0);
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTyres, sortField, sortDirection]);

  const renderSortIcon = (field: 'brand' | 'size' | 'barcode' | 'condition' | 'category' | 'price' | 'stock') => {
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-[#0984E3] shrink-0" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-[#0984E3] shrink-0" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover/th:text-slate-600 shrink-0 opacity-50 transition" />;
  };

  // Statistics
  const totalUnits = useMemo(() => tyres.reduce((acc, t) => acc + (t.stockCount || 0), 0), [tyres]);
  const newCount = useMemo(() => tyres.filter(t => t.condition === 'new').length, [tyres]);
  const usedCount = useMemo(() => tyres.filter(t => t.condition === 'used').length, [tyres]);
  const lowStockCount = useMemo(() => tyres.filter(t => t.stockCount > 0 && t.stockCount <= 4).length, [tyres]);
  const outOfStockCount = useMemo(() => tyres.filter(t => t.stockCount <= 0).length, [tyres]);

  const handleSavePrice = (tyreId: string) => {
    const val = parseFloat(editingPriceVal);
    if (!isNaN(val) && val > 0 && onUpdateTyrePrice) {
      const targetTyre = tyres.find((t) => t.id === tyreId);
      if (targetTyre && targetTyre.priceXCD !== val) {
        const diff = Number((val - targetTyre.priceXCD).toFixed(2));
        const newRecord: PriceUpdateRecord = {
          id: 'ph-' + Date.now(),
          tyreId,
          brand: targetTyre.brand,
          modelName: targetTyre.modelName,
          size: targetTyre.size,
          category: targetTyre.category,
          oldPriceXCD: targetTyre.priceXCD,
          newPriceXCD: val,
          diffXCD: diff,
          timestamp: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          updatedBy: 'Admin Workshop'
        };
        savePriceHistory([newRecord, ...priceHistory]);
      }
      onUpdateTyrePrice(tyreId, val);
    }
    setEditingPriceId(null);
  };

  const handleSaveStock = (tyreId: string) => {
    const val = parseInt(editingStockVal, 10);
    if (!isNaN(val) && val >= 0 && onUpdateTyreStock) {
      onUpdateTyreStock(tyreId, val);
    }
    setEditingStockId(null);
  };

  const handleStockDelta = (tyre: Tyre, delta: number) => {
    if (!onUpdateTyreStock) return;
    const nextStock = Math.max(0, (tyre.stockCount || 0) + delta);
    onUpdateTyreStock(tyre.id, nextStock);
  };

  const handleToggleSelectTyre = (id: string) => {
    setSelectedTyreIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSortedSelected = sortedTyres.length > 0 && sortedTyres.every(t => selectedTyreIds.includes(t.id));
  const isAllInventorySelected = tyres.length > 0 && tyres.every(t => selectedTyreIds.includes(t.id));
  const isSomeSelected = selectedTyreIds.length > 0 && !isAllSortedSelected && !isAllInventorySelected;

  const handleToggleSelectAll = () => {
    if (isAllSortedSelected || isAllInventorySelected) {
      setSelectedTyreIds([]);
    } else {
      setSelectedTyreIds(sortedTyres.map(t => t.id));
    }
  };

  const handleSelectAllInventory = () => {
    setSelectedTyreIds(tyres.map(t => t.id));
  };

  const handlePrintSelectedBarcodes = () => {
    if (selectedTyreIds.length === 0) return;
    setBatchPrintIds(selectedTyreIds);
    setIsBarcodeCenterOpen(true);
  };

  const handleImportCompleted = (
    importedTyres: Tyre[],
    summary: { updatedCount: number; addedCount: number }
  ) => {
    const newPriceHistoryEntries: PriceUpdateRecord[] = [];

    importedTyres.forEach((imported) => {
      const existing = tyres.find((t) => t.id === imported.id);
      if (existing) {
        if (existing.priceXCD !== imported.priceXCD) {
          const diff = Number((imported.priceXCD - existing.priceXCD).toFixed(2));
          newPriceHistoryEntries.push({
            id: 'ph-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            tyreId: existing.id,
            brand: existing.brand,
            modelName: existing.modelName,
            size: existing.size,
            category: existing.category,
            oldPriceXCD: existing.priceXCD,
            newPriceXCD: imported.priceXCD,
            diffXCD: diff,
            timestamp: new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }),
            updatedBy: 'Bulk CSV Import'
          });
          if (onUpdateTyrePrice) onUpdateTyrePrice(existing.id, imported.priceXCD);
        }
        if (existing.stockCount !== imported.stockCount) {
          if (onUpdateTyreStock) onUpdateTyreStock(existing.id, imported.stockCount);
        }
      } else {
        if (onAddNewTyre) onAddNewTyre(imported);
      }
    });

    if (newPriceHistoryEntries.length > 0) {
      savePriceHistory([...newPriceHistoryEntries, ...priceHistory]);
    }

    setInventoryNotification(
      `CSV Import Complete: ${summary.updatedCount} items updated, ${summary.addedCount} new items added to inventory`
    );
    setTimeout(() => setInventoryNotification(null), 6000);
  };

  const handleSaveQuickAdjust = (tyreId: string, newPriceXCD: number, newStockCount: number) => {
    const targetTyre = tyres.find((t) => t.id === tyreId);
    if (!targetTyre) return;

    const changes: string[] = [];

    if (targetTyre.priceXCD !== newPriceXCD) {
      const diff = Number((newPriceXCD - targetTyre.priceXCD).toFixed(2));
      const newRecord: PriceUpdateRecord = {
        id: 'ph-' + Date.now(),
        tyreId,
        brand: targetTyre.brand,
        modelName: targetTyre.modelName,
        size: targetTyre.size,
        category: targetTyre.category,
        oldPriceXCD: targetTyre.priceXCD,
        newPriceXCD,
        diffXCD: diff,
        timestamp: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }),
        updatedBy: 'Admin Quick Adjust'
      };
      savePriceHistory([newRecord, ...priceHistory]);
      if (onUpdateTyrePrice) onUpdateTyrePrice(tyreId, newPriceXCD);
      changes.push(`Price: EC$ ${newPriceXCD.toFixed(2)} (${diff > 0 ? '+' : ''}${diff})`);
    }

    if (targetTyre.stockCount !== newStockCount) {
      if (onUpdateTyreStock) onUpdateTyreStock(tyreId, newStockCount);
      changes.push(`Stock: ${newStockCount} units`);
    }

    if (changes.length > 0) {
      setInventoryNotification(`Quick Adjusted ${targetTyre.brand} ${targetTyre.modelName}: ${changes.join(', ')}`);
      setTimeout(() => setInventoryNotification(null), 4500);
    }
  };

  const handleExportCSV = () => {
    // Export complete inventory with all custom prices and stock counts
    const headers = [
      'Tyre_ID',
      'Brand',
      'Model_Name',
      'Size',
      'Rim_Diameter_Inch',
      'Condition',
      'Category',
      'Price_XCD',
      'Price_USD',
      'Stock_Count',
      'Stock_Status',
      'Barcode_Code128',
      'Tread_Depth_mm',
      'Speed_Rating',
      'Load_Index',
      'Warranty',
      'Dominica_Mountain_Rating',
      'Workshop_Location',
      'Export_Date'
    ];

    const rows = tyres.map(t => {
      const usdPrice = (t.priceXCD / 2.70).toFixed(2);
      const stockStatus = t.stockCount <= 0 ? 'Out of Stock' : t.stockCount <= 4 ? 'Low Stock' : 'In Stock';
      const barcode = getTyreBarcodeValue(t);

      return [
        t.id,
        `"${(t.brand || '').replace(/"/g, '""')}"`,
        `"${(t.modelName || '').replace(/"/g, '""')}"`,
        `"${(t.size || '').replace(/"/g, '""')}"`,
        t.rimDiameter || '',
        t.condition,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        t.priceXCD.toFixed(2),
        usdPrice,
        t.stockCount,
        `"${stockStatus}"`,
        `"${barcode}"`,
        t.treadDepthMm || '',
        `"${t.speedRating || ''}"`,
        `"${t.loadIndex || ''}"`,
        `"${(t.warranty || '').replace(/"/g, '""')}"`,
        t.dominicaMountainRating || '',
        `"Maranatha Square, Pichelin, Dominica"`,
        `"${new Date().toISOString()}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `max_executive_full_inventory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const totalStock = tyres.reduce((sum, t) => sum + t.stockCount, 0);
    setInventoryNotification(`Downloaded full inventory CSV: ${tyres.length} tyre SKUs (${totalStock} total units in stock)!`);
    setTimeout(() => setInventoryNotification(null), 4500);
  };

  const handlePrintStockSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Max Executive Tires - Inventory Stock Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 25px; color: #1e293b; }
          .header { border-bottom: 2px solid #0984E3; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: bold; color: #0984E3; }
          .sub { font-size: 11px; color: #64748b; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th { background: #f1f5f9; padding: 8px 6px; text-align: left; border-bottom: 1px solid #cbd5e1; font-weight: bold; }
          td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
          .badge-new { background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
          .badge-used { background: #fef9c3; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 25px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Max Executive Tires & Fitment Workshop</div>
            <div class="sub">Maranatha Square, Pichelin, Dominica • Tel: (767) 275-8973 / 616-0155</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 12px;">INVENTORY STOCK AUDIT SHEET</div>
            <div class="sub">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div>
          <strong>Total Active SKUs:</strong> ${sortedTyres.length} &nbsp;|&nbsp; 
          <strong>Total Units in Stock:</strong> ${sortedTyres.reduce((sum, t) => sum + t.stockCount, 0)}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Brand & Model</th>
              <th>Size</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Price (EC$)</th>
              <th>Stock Qty</th>
              <th>Audit Verified</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTyres.map((t, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${t.brand}</strong> ${t.modelName}</td>
                <td><strong>${t.size}</strong></td>
                <td>${t.category}</td>
                <td><span class="${t.condition === 'new' ? 'badge-new' : 'badge-used'}">${t.condition === 'new' ? 'BRAND NEW' : 'INSPECTED USED'}</span></td>
                <td>EC$ ${t.priceXCD.toFixed(2)}</td>
                <td style="font-weight: bold; font-size: 12px;">${t.stockCount}</td>
                <td style="border-bottom: 1px dashed #cbd5e1; width: 80px;">[ &nbsp; ]</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Max Executive Tires • Official Workshop Stock Inventory
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleCreateTyreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !newModel.trim() || !newSize.trim()) {
      alert('Please fill in Tyre Brand, Model, and Size.');
      return;
    }

    const createdTyre: Tyre = {
      id: 'custom-' + Date.now(),
      brand: newBrand.trim(),
      modelName: newModel.trim(),
      size: newSize.trim(),
      width: parseInt(newSize.split('/')[0]) || 225,
      aspectRatio: parseInt(newSize.split('/')[1]?.split('R')[0]) || 65,
      rimDiameter: parseInt(newSize.split('R')[1]) || 17,
      condition: newCondition,
      treadDepthMm: newCondition === 'new' ? 10.5 : 7.5,
      originalTreadMm: 11.0,
      category: newCategory,
      priceXCD: newPriceXCD,
      stockCount: newStockCount,
      image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80',
      features: ['Reinforced Sidewall for Dominica Potholes', 'Wet Grip Tread Pattern', 'Maranatha Fitting Ready'],
      warranty: newCondition === 'new' ? '12-Month Factory Road Hazard' : '30-Day Workshop Fitment Guarantee',
      speedRating: 'H (210 km/h)',
      loadIndex: '102 (850 kg)',
      wetGripRating: 'A',
      potholeResistance: 'Reinforced Extra Load (XL)',
      dominicaMountainRating: 5,
      shortDescription: newDescription.trim() || `${newBrand} ${newModel} tyre sized ${newSize}, tailored for Dominica mountainous roads.`,
      inspectionPassed: true
    };

    if (onAddNewTyre) {
      onAddNewTyre(createdTyre);
    }
    setAddSuccessMessage(true);
    setTimeout(() => {
      setAddSuccessMessage(false);
      setIsAddModalOpen(false);
      setNewBrand('');
      setNewModel('');
      setNewSize('');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-fade-in">
      {/* Header Banner & Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0984E3] text-white flex items-center justify-center font-bold shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Workshop Tyre Inventory</h3>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Stock
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage stock levels, update retail prices in EC$ & US$, and audit Pichelin warehouse inventory.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (onOpenScanner) onOpenScanner();
              else setIsScannerOpen(true);
            }}
            id="admin-inventory-scanner-btn"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            title="Open live barcode scanner & inventory intake"
          >
            <Camera className="w-4 h-4" />
            <span>Barcode Scanner</span>
          </button>

          {/* Print Selected Barcodes Button (Batch Action) */}
          {selectedTyreIds.length > 0 && (
            <button
              onClick={handlePrintSelectedBarcodes}
              id="admin-inventory-print-selected-barcodes-btn"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition active:scale-95 cursor-pointer ring-2 ring-amber-300 animate-pulse"
              title={`Print barcodes for ${selectedTyreIds.length} selected tyres`}
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Print Selected Barcodes ({selectedTyreIds.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setBatchPrintIds(null);
              if (onOpenBarcodeCenter) onOpenBarcodeCenter();
              else setIsBarcodeCenterOpen(true);
            }}
            id="admin-inventory-barcodes-btn"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            title="Generate & print barcodes for all inventory (Tyre Size, Barcode, Retail Price)"
          >
            <Barcode className="w-4 h-4 text-blue-200" />
            <span>Barcode Labels</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            id="admin-inventory-add-btn"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add New Tyre</span>
          </button>

          <button
            onClick={handlePrintStockSheet}
            id="admin-inventory-print-btn"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition"
            title="Print printable stock sheet with checkboxes for warehouse audit"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print Stock Sheet</span>
          </button>

          <button
            onClick={handleExportCSV}
            id="admin-inventory-download-csv-btn"
            data-testid="admin-inventory-export-btn"
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 border border-emerald-500/60 cursor-pointer"
            title="Download full inventory list including custom tyre prices and stock levels for offline record keeping"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            id="admin-inventory-import-csv-btn"
            data-testid="admin-inventory-import-btn"
            className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 border border-blue-500/60 cursor-pointer"
            title="Upload and parse a CSV file to bulk-update inventory data, prices, and stock counts"
          >
            <Upload className="w-4 h-4 text-blue-200" />
            <span>Import Inventory</span>
          </button>

          <button
            onClick={() => setShowPriceTrendView(!showPriceTrendView)}
            id="admin-inventory-price-trends-btn"
            className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer ${
              showPriceTrendView
                ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
            }`}
            title="Toggle Price Trend & Update History view"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>{showPriceTrendView ? 'Hide Price Trends' : 'Price Trends & History'}</span>
            <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded-full text-[10px] font-extrabold">
              {priceHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOGGLEABLE PRICE TREND & REVISION HISTORY VIEW               */}
      {/* ============================================================ */}
      {showPriceTrendView && (
        <div className="bg-gradient-to-b from-amber-500/10 via-white to-white border-2 border-amber-400/80 rounded-3xl p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  Tyre Price Trend & Update History
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                    {priceHistory.length} Updates Logged
                  </span>
                </h4>
                <p className="text-xs text-slate-600">
                  Track retail price revisions, supplier adjustments, and inflation trends for Dominica
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPriceTrendView(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>

          {/* Price Trend Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price Revisions</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{priceHistory.length}</span>
              <span className="text-[10px] text-slate-400">Total logged changes</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Price Increases</span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                {priceHistory.filter(h => h.diffXCD > 0).length}
              </span>
              <span className="text-[10px] text-emerald-600/80">Supplier / Freight changes</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Price Reductions</span>
              <span className="text-xl font-black text-blue-700 mt-0.5 block">
                {priceHistory.filter(h => h.diffXCD < 0).length}
              </span>
              <span className="text-[10px] text-blue-600/80">Promotions / Clearance</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Avg Delta</span>
              <span className="text-xl font-black text-amber-900 mt-0.5 block">
                {priceHistory.length > 0 
                  ? `EC$ ${(priceHistory.reduce((acc, h) => acc + h.diffXCD, 0) / priceHistory.length).toFixed(1)}` 
                  : 'EC$ 0'}
              </span>
              <span className="text-[10px] text-slate-400">Net price variance</span>
            </div>
          </div>

          {/* Search Price History */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search price revision history by brand, model, size..."
              value={priceHistorySearch}
              onChange={(e) => setPriceHistorySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-2.5">Tyre Model & Size</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Old Price</th>
                    <th className="p-2.5">New Price</th>
                    <th className="p-2.5">Difference</th>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {priceHistory
                    .filter(h => {
                      const q = priceHistorySearch.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        h.brand.toLowerCase().includes(q) ||
                        h.modelName.toLowerCase().includes(q) ||
                        h.size.toLowerCase().includes(q) ||
                        h.category.toLowerCase().includes(q)
                      );
                    })
                    .map((item) => {
                      const isUp = item.diffXCD > 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5 font-semibold text-slate-900">
                            <div>{item.brand} {item.modelName}</div>
                            <span className="text-[10px] text-slate-400">{item.size}</span>
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px]">{item.category}</td>
                          <td className="p-2.5 text-slate-500 font-medium line-through">
                            EC$ {item.oldPriceXCD.toFixed(2)}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            EC$ {item.newPriceXCD.toFixed(2)}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                isUp
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {isUp ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
                              {isUp ? '+' : ''}EC$ {item.diffXCD.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{item.timestamp}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-500 text-[10px]">{item.updatedBy}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total SKUs</span>
          <span className="text-xl font-black text-slate-800 mt-0.5 block">{tyres.length}</span>
          <span className="text-[10px] text-slate-400 font-medium">Unique tyre profiles</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Units in Stock</span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">{totalUnits}</span>
          <span className="text-[10px] text-emerald-600/80 font-medium">Ready in Pichelin</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Brand New</span>
          <span className="text-xl font-black text-blue-700 mt-0.5 block">{newCount} SKUs</span>
          <span className="text-[10px] text-blue-600/80 font-medium">Factory fresh imports</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Inspected Used</span>
          <span className="text-xl font-black text-amber-700 mt-0.5 block">{usedCount} SKUs</span>
          <span className="text-[10px] text-amber-600/80 font-medium">Pressure & tread tested</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Low / Out of Stock</span>
          <span className="text-xl font-black text-rose-700 mt-0.5 block">{lowStockCount + outOfStockCount}</span>
          <span className="text-[10px] text-rose-600/80 font-medium">{outOfStockCount} zero stock, {lowStockCount} low</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand (e.g. Michelin, Dunlop), model, size (e.g. 265/70R17)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Condition Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setSelectedCondition('ALL')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCondition === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedCondition('new')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCondition === 'new'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Brand New
            </button>
            <button
              onClick={() => setSelectedCondition('used')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCondition === 'used'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inspected Used
            </button>
          </div>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW">Low Stock (&le; 4 Units)</option>
            <option value="OUT">Out of Stock (0 Units)</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs whitespace-nowrap">
          <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {[
            'ALL',
            'SUV, Crossover & 4x4',
            'All-Terrain (A/T)',
            'Mud-Terrain (M/T)',
            'Passenger & Hatchback',
            'Commercial Van & Minibus',
            'Heavy Duty Pickup & Truck'
          ].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Vehicle Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tyres Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Inventory Listings ({sortedTyres.length} Tyres)
            </span>
            {selectedTyreIds.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 font-black text-xs px-2.5 py-0.5 rounded-full border border-blue-300">
                <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
                {selectedTyreIds.length} Selected
              </span>
            )}
            {/* Active Sort Indicator Pill */}
            {sortField && (
              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs px-2.5 py-0.5 rounded-full">
                <span className="text-slate-500 font-medium text-[11px]">Sorted:</span>
                <span className="font-bold capitalize text-[11px]">
                  {sortField === 'brand' ? 'Brand & Model' : sortField === 'size' ? 'Size & Rim' : sortField === 'stock' ? 'Stock Count' : sortField}
                </span>
                <span className="text-[9px] bg-blue-200 text-blue-950 px-1 py-0.2 rounded font-black uppercase">
                  {sortDirection}
                </span>
                <button
                  type="button"
                  onClick={() => setSortField(null)}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded transition cursor-pointer"
                  title="Clear column sort"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              id="table-inventory-download-csv-btn"
              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Download CSV containing all tyre inventory data (brand, model, size, price, and stock levels)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              id="table-inventory-import-csv-btn"
              data-testid="table-inventory-import-btn"
              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Upload and parse a CSV file to bulk-update inventory data, prices, and stock counts"
            >
              <Upload className="w-3.5 h-3.5 text-blue-700" />
              <span>Import Inventory</span>
            </button>

            {selectedTyreIds.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handlePrintSelectedBarcodes}
                  id="print-selected-barcodes-table-btn"
                  data-testid="print-selected-barcodes-btn"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  title="Print barcode labels for selected tyres"
                >
                  <Barcode className="w-3.5 h-3.5 text-blue-200" />
                  <span>Print Selected Barcodes ({selectedTyreIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTyreIds([])}
                  className="text-slate-500 hover:text-slate-700 font-bold text-xs px-2 py-1 rounded-lg transition cursor-pointer"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-slate-500 hover:text-slate-800 font-bold text-xs px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Select all filtered tyres"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Select All Filtered</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Selection Banner */}
        {isAllSortedSelected && tyres.length > sortedTyres.length && (
          <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 text-xs flex items-center justify-between text-blue-900 animate-fade-in flex-wrap gap-2">
            <span>
              All <strong>{sortedTyres.length}</strong> tyres on this view are selected.
            </span>
            <button
              type="button"
              id="select-all-entire-inventory-btn"
              onClick={handleSelectAllInventory}
              className="font-bold underline text-[#0984E3] hover:text-blue-800 cursor-pointer"
            >
              Select all {tyres.length} tyres in entire inventory for batch print &amp; management →
            </button>
          </div>
        )}
        {isAllInventorySelected && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs flex items-center justify-between text-emerald-900 font-medium animate-fade-in flex-wrap gap-2">
            <span>
              ✓ All <strong>{tyres.length}</strong> items in the entire workshop inventory are selected ({totalUnits} total physical tyres). Clicking &apos;Print Selected Barcodes&apos; will batch print labels for every tyre in the inventory.
            </span>
            <button
              type="button"
              onClick={() => setSelectedTyreIds([])}
              className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        )}

        {sortedTyres.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No tyres match your filter criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try changing your search terms or clearing your condition and category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCondition('ALL');
                setSelectedCategory('ALL');
                setStockFilter('ALL');
                setSortField(null);
              }}
              className="bg-[#0984E3] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <div className="flex items-center justify-center">
                      <label htmlFor="global-select-all-inventory-checkbox" className="sr-only">
                        Select All Inventory Items
                      </label>
                      <input
                        type="checkbox"
                        id="global-select-all-inventory-checkbox"
                        data-testid="global-select-all-inventory-checkbox"
                        checked={isAllSortedSelected || isAllInventorySelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = isSomeSelected;
                          }
                        }}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 text-[#0984E3] border-slate-300 rounded focus:ring-[#0984E3] cursor-pointer"
                        title={
                          isAllSortedSelected || isAllInventorySelected
                            ? "Deselect All Items"
                            : "Select All Filtered Tyres (or click banner for entire inventory)"
                        }
                      />
                    </div>
                  </th>
                  <th
                    id="th-sort-brand"
                    onClick={() => handleSort('brand')}
                    className={`py-3 px-4 cursor-pointer select-none transition ${
                      sortField === 'brand' ? 'bg-blue-50/90 text-[#0984E3]' : 'hover:bg-slate-200/70 text-slate-700'
                    }`}
                    title="Click header to sort by Brand Name & Model"
                  >
                    <button
                      id="sort-btn-brand"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort('brand');
                      }}
                      className="inline-flex items-center gap-1 font-bold text-left transition cursor-pointer select-none group/th w-full"
                    >
                      <span>Brand Name & Model</span>
                      {renderSortIcon('brand')}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('size')}
                      className={`inline-flex items-center gap-1 font-bold text-left transition cursor-pointer select-none group/th ${
                        sortField === 'size' ? 'text-[#0984E3]' : 'text-slate-700 hover:text-[#0984E3]'
                      }`}
                      title="Sort by Rim Diameter & Dimensions"
                    >
                      <span>Size & Rim</span>
                      {renderSortIcon('size')}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('barcode')}
                      className={`inline-flex items-center gap-1 font-bold text-left transition cursor-pointer select-none group/th ${
                        sortField === 'barcode' ? 'text-[#0984E3]' : 'text-slate-700 hover:text-[#0984E3]'
                      }`}
                      title="Sort by Barcode"
                    >
                      <span>Barcode of Size</span>
                      {renderSortIcon('barcode')}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('condition')}
                      className={`inline-flex items-center gap-1 font-bold text-left transition cursor-pointer select-none group/th ${
                        sortField === 'condition' ? 'text-[#0984E3]' : 'text-slate-700 hover:text-[#0984E3]'
                      }`}
                      title="Sort by Condition (New / Used)"
                    >
                      <span>Condition</span>
                      {renderSortIcon('condition')}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('category')}
                      className={`inline-flex items-center gap-1 font-bold text-left transition cursor-pointer select-none group/th ${
                        sortField === 'category' ? 'text-[#0984E3]' : 'text-slate-700 hover:text-[#0984E3]'
                      }`}
                      title="Sort by Vehicle Category"
                    >
                      <span>Category</span>
                      {renderSortIcon('category')}
                    </button>
                  </th>
                  <th
                    id="th-sort-price"
                    onClick={() => handleSort('price')}
                    className={`py-3 px-3 cursor-pointer select-none transition ${
                      sortField === 'price' ? 'bg-blue-50/90 text-[#0984E3]' : 'hover:bg-slate-200/70 text-slate-700'
                    }`}
                    title="Click header to sort by Price (EC$)"
                  >
                    <button
                      id="sort-btn-price"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort('price');
                      }}
                      className="inline-flex items-center gap-1 font-bold text-left transition cursor-pointer select-none group/th w-full"
                    >
                      <span>Price (EC$ / US$)</span>
                      {renderSortIcon('price')}
                    </button>
                  </th>
                  <th
                    id="th-sort-stock"
                    onClick={() => handleSort('stock')}
                    className={`py-3 px-3 text-center cursor-pointer select-none transition ${
                      sortField === 'stock' ? 'bg-blue-50/90 text-[#0984E3]' : 'hover:bg-slate-200/70 text-slate-700'
                    }`}
                    title="Click header to sort by Stock Count"
                  >
                    <button
                      id="sort-btn-stock"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort('stock');
                      }}
                      className="inline-flex items-center justify-center gap-1 font-bold transition cursor-pointer select-none group/th mx-auto"
                    >
                      <span>Stock Count</span>
                      {renderSortIcon('stock')}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTyres.map(tyre => {
                  const isEditingPrice = editingPriceId === tyre.id;
                  const isEditingStock = editingStockId === tyre.id;
                  const isLow = tyre.stockCount > 0 && tyre.stockCount <= 4;
                  const isOut = tyre.stockCount <= 0;
                  const isSelected = selectedTyreIds.includes(tyre.id);

                  return (
                    <tr key={tyre.id} className={`hover:bg-slate-50/80 transition group ${isSelected ? 'bg-blue-50/50' : ''}`}>
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectTyre(tyre.id);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer inline-flex items-center justify-center"
                          title={isSelected ? "Deselect Tyre" : "Select Tyre for Barcode Printing"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0984E3]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Brand & Model */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tyre.image}
                            alt={tyre.modelName}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            loading="lazy"
                          />
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#0984E3] tracking-wider block">
                              {tyre.brand}
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs block">
                              {tyre.modelName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              ID: {tyre.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3">
                        <span className="font-black text-slate-800 text-xs block">
                          {tyre.size}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Rim: {tyre.rimDiameter}" • {tyre.speedRating}
                        </span>
                      </td>

                      {/* Barcode of Tyre Size */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setSingleTyreToPrint(tyre)}
                          className="group/bc inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 font-mono text-[10.5px] font-bold transition cursor-pointer"
                          title="Print Barcode Tag (Tyre Size, Barcode, Retail Price)"
                        >
                          <Barcode className="w-3.5 h-3.5 text-slate-500 group-hover/bc:text-blue-600" />
                          <span>{getTyreBarcodeValue(tyre)}</span>
                        </button>
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3">
                        {tyre.condition === 'new' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            BRAND NEW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-700" />
                            INSPECTED USED
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-700 font-semibold block">
                          {tyre.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tyre.potholeResistance}
                        </span>
                      </td>

                      {/* Price with inline edit */}
                      <td className="py-3 px-3">
                        {isEditingPrice ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">EC$</span>
                            <input
                              type="number"
                              value={editingPriceVal}
                              onChange={(e) => setEditingPriceVal(e.target.value)}
                              className="w-20 px-2 py-1 bg-white border border-[#0984E3] rounded-md text-xs font-bold focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(tyre.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save Price"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5">
                            <div>
                              <span className="font-black text-slate-900 text-xs block">
                                EC$ {tyre.priceXCD.toFixed(2)}
                              </span>
                              {(() => {
                                const latestChange = priceHistory.find((h) => h.tyreId === tyre.id);
                                if (!latestChange) return null;
                                const isUp = latestChange.diffXCD > 0;
                                return (
                                  <div
                                    className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                                    title={`Last updated ${latestChange.timestamp}: Was EC$ ${latestChange.oldPriceXCD.toFixed(2)}`}
                                  >
                                    <span className={isUp ? 'text-emerald-700' : 'text-red-700'}>
                                      {isUp ? '▲ +' : '▼ -'}EC$ {Math.abs(latestChange.diffXCD).toFixed(0)}
                                    </span>
                                    <span className="text-slate-400 font-normal text-[8px]">
                                      ({latestChange.timestamp.split(',')[0]})
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                            {onUpdateTyrePrice && (
                              <button
                                onClick={() => {
                                  setEditingPriceId(tyre.id);
                                  setEditingPriceVal(tyre.priceXCD.toString());
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#0984E3] rounded transition"
                                title="Edit Price"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock count with +/- controls */}
                      <td className="py-3 px-3 text-center">
                        {isEditingStock ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={editingStockVal}
                              onChange={(e) => setEditingStockVal(e.target.value)}
                              className="w-14 px-2 py-1 bg-white border border-[#0984E3] rounded-md text-xs font-bold text-center focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStock(tyre.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center gap-1.5">
                              {onUpdateTyreStock && (
                                <button
                                  onClick={() => handleStockDelta(tyre, -1)}
                                  disabled={tyre.stockCount <= 0}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition"
                                  title="Decrease stock by 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (onUpdateTyreStock) {
                                    setEditingStockId(tyre.id);
                                    setEditingStockVal(tyre.stockCount.toString());
                                  }
                                }}
                                className={`font-black text-sm px-2 py-0.5 rounded ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-700'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'text-slate-900 hover:bg-slate-100'
                                }`}
                                title="Click to enter exact stock"
                              >
                                {tyre.stockCount}
                              </button>

                              {onUpdateTyreStock && (
                                <button
                                  onClick={() => handleStockDelta(tyre, 1)}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                                  title="Increase stock by 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Stock badge */}
                            <span className="text-[10px] mt-0.5 font-bold">
                              {isOut ? (
                                <span className="text-rose-600">Out of Stock</span>
                              ) : isLow ? (
                                <span className="text-amber-600">Low Stock ({tyre.stockCount})</span>
                              ) : (
                                <span className="text-emerald-600">Available</span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Adjust Button */}
                          <button
                            id={`quick-adjust-btn-${tyre.id}`}
                            type="button"
                            onClick={() => setQuickAdjustTyre(tyre)}
                            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] px-2 py-1.5 rounded-lg transition cursor-pointer active:scale-95 shadow-2xs"
                            title="Quick Adjust Price or Stock Count"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                            <span>Quick Adjust</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSingleTyreToPrint(tyre)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] px-2 py-1.5 rounded-lg transition cursor-pointer"
                            title="Print Barcode Tag (Tyre Size, Barcode, Price)"
                          >
                            <Barcode className="w-3 h-3 text-slate-600" />
                            <span>Label</span>
                          </button>

                          {onAddToPos && (
                            <button
                              onClick={() => onAddToPos(tyre)}
                              className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-[#0984E3] border border-blue-200 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition"
                              title="Add to SmartPOS Checkout Counter"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>POS</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Tyre Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0984E3] text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Add New Tyre to Inventory</h4>
                  <p className="text-xs text-slate-500">Enter specifications for new stock at Pichelin workshop</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccessMessage && (
              <div className="bg-emerald-500 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>New tyre added to active inventory successfully!</span>
              </div>
            )}

            <form onSubmit={handleCreateTyreSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michelin, Bridgestone, Maxxis"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Model / Pattern *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LTX Trail A/T, Dueler H/T"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tyre Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 265/70 R17"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Condition *</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as TyreCondition)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  >
                    <option value="new">Brand New (Factory)</option>
                    <option value="used">Inspected Used (75%+)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TyreCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  >
                    <option value="SUV, Crossover & 4x4">SUV & 4x4</option>
                    <option value="All-Terrain (A/T)">All-Terrain (A/T)</option>
                    <option value="Mud-Terrain (M/T)">Mud-Terrain (M/T)</option>
                    <option value="Passenger & Hatchback">Passenger & Hatchback</option>
                    <option value="Commercial Van & Minibus">Commercial Van & Minibus</option>
                    <option value="Heavy Duty Pickup & Truck">Heavy Duty Pickup & Truck</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Retail Price (EC$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">EC$</span>
                    <input
                      type="number"
                      required
                      min={10}
                      value={newPriceXCD}
                      onChange={(e) => setNewPriceXCD(parseFloat(e.target.value) || 0)}
                      className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newStockCount}
                    onChange={(e) => setNewStockCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description & Road Recommendations</label>
                <textarea
                  rows={2}
                  placeholder="Notes on Dominica mountain road suitability, tread compound, warranty..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0984E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0984E3] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Tyre to Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Center Modal (All Inventory Barcodes or Batch Selected) */}
      <InventoryBarcodeCenterModal
        isOpen={isBarcodeCenterOpen}
        onClose={() => {
          setIsBarcodeCenterOpen(false);
          setBatchPrintIds(null);
        }}
        tyres={tyres}
        initialSelectedIds={batchPrintIds || undefined}
        customQueuedTyres={
          batchPrintIds && batchPrintIds.length > 0
            ? tyres.filter((t) => batchPrintIds.includes(t.id))
            : undefined
        }
        sourceTitle={
          batchPrintIds && batchPrintIds.length > 0
            ? `Batch Print — ${batchPrintIds.length} Selected Inventory Items`
            : undefined
        }
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Live Barcode Scanner & Stock Intake Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        tyres={tyres}
        onAddToPos={onAddToPos}
        onUpdateTyreStock={onUpdateTyreStock}
        onUpdateTyrePrice={onUpdateTyrePrice}
        onOpenBarcodeCenter={() => setIsBarcodeCenterOpen(true)}
      />

      {/* Single Tyre Barcode Tag Print Preview Modal */}
      {singleTyreToPrint && (
        <div id="single-barcode-print-modal" className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-black text-white">2&quot; × 4&quot; Tyre Barcode Label</h4>
                  <p className="text-[11px] text-slate-400">Compatible with 8½&quot; × 11&quot; label sheets (Avery 5163 / 5263 / 8163)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSinglePrinterGuideOpen((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isSinglePrinterGuideOpen
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                      : 'bg-slate-800 text-amber-300 border-amber-400/40 hover:bg-slate-700'
                  }`}
                  title="View printer settings: Margins None and Scale 100%"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Printer Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleTyreToPrint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printer Guide Panel when opened */}
            {isSinglePrinterGuideOpen && (
              <div className="animate-fade-in">
                <PrinterGuide inline={true} className="border border-amber-400/30" />
              </div>
            )}

            {/* Preview Mode Switch: Grid / Sheet Layout vs Content-Only */}
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Preview Display:</span>
              <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 shadow-xs">
                <button
                  type="button"
                  onClick={() => setSinglePreviewMode('grid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    singlePreviewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grid view with label sheet borders and cut outlines"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid Outline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSinglePreviewMode('content_only')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    singlePreviewMode === 'content_only'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Content-only preview: inspect barcode and text without sheet outline borders"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Content-Only</span>
                </button>
              </div>
            </div>

            <div className={`flex justify-center py-3 rounded-xl p-4 overflow-hidden transition-all ${
              singlePreviewMode === 'content_only'
                ? 'bg-white shadow-inner border-2 border-dashed border-amber-400/40'
                : 'bg-slate-950/80 border border-slate-800'
            }`}>
              <TyreBarcodeLabel
                tyre={singleTyreToPrint}
                variant="avery_2x4"
                showBorder={singlePreviewMode === 'grid'}
                showQr={true}
              />
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Label Dimensions:</span>
                <span className="font-mono font-bold text-white">4.0&quot; wide × 2.0&quot; high (10-Up on 8.5&quot;×11&quot;)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tyre Size & Barcode:</span>
                <span className="font-mono font-bold text-blue-400">{singleTyreToPrint.size} • {getTyreBarcodeValue(singleTyreToPrint)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Price Display:</span>
                <span className="text-emerald-400 font-bold">EC$ {singleTyreToPrint.priceXCD} (≈ US$ {(singleTyreToPrint.priceXCD / 2.7).toFixed(0)})</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSingleTyreToPrint(null);
                  if (onOpenBarcodeCenter) onOpenBarcodeCenter();
                  else setIsBarcodeCenterOpen(true);
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition underline underline-offset-2 cursor-pointer"
              >
                Open Multi-Sheet Print Center →
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSingleTyreToPrint(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print 2&quot;×4&quot; Label</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Adjust Dialog */}
      <AdminQuickAdjustModal
        isOpen={!!quickAdjustTyre}
        tyre={quickAdjustTyre}
        onClose={() => setQuickAdjustTyre(null)}
        onSave={handleSaveQuickAdjust}
      />

      {/* Bulk CSV Inventory Import Modal */}
      <AdminInventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTyres={tyres}
        onImportCompleted={handleImportCompleted}
      />

      {/* Notification Toast */}
      {inventoryNotification && (
        <div className="fixed bottom-6 right-6 z-60 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{inventoryNotification}</span>
        </div>
      )}
    </div>
  );
};
