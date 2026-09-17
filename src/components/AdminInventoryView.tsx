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
  DollarSign
} from 'lucide-react';
import { Tyre, TyreCondition, TyreCategory } from '../types';

interface AdminInventoryViewProps {
  tyres: Tyre[];
  onUpdateTyrePrice?: (tyreId: string, newPriceXCD: number) => void;
  onUpdateTyreStock?: (tyreId: string, newStock: number) => void;
  onAddNewTyre?: (newTyre: Tyre) => void;
  onAddToPos?: (tyre: Tyre) => void;
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  tyres,
  onUpdateTyrePrice,
  onUpdateTyreStock,
  onAddNewTyre,
  onAddToPos,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<'ALL' | 'new' | 'used'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

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

  // Statistics
  const totalUnits = useMemo(() => tyres.reduce((acc, t) => acc + (t.stockCount || 0), 0), [tyres]);
  const newCount = useMemo(() => tyres.filter(t => t.condition === 'new').length, [tyres]);
  const usedCount = useMemo(() => tyres.filter(t => t.condition === 'used').length, [tyres]);
  const lowStockCount = useMemo(() => tyres.filter(t => t.stockCount > 0 && t.stockCount <= 4).length, [tyres]);
  const outOfStockCount = useMemo(() => tyres.filter(t => t.stockCount <= 0).length, [tyres]);

  const handleSavePrice = (tyreId: string) => {
    const val = parseFloat(editingPriceVal);
    if (!isNaN(val) && val > 0 && onUpdateTyrePrice) {
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

  const handleExportCSV = () => {
    const headers = ['ID', 'Brand', 'Model', 'Size', 'Condition', 'Category', 'Price_XCD', 'Stock_Count'];
    const rows = filteredTyres.map(t => [
      t.id,
      `"${t.brand}"`,
      `"${t.modelName}"`,
      `"${t.size}"`,
      t.condition,
      `"${t.category}"`,
      t.priceXCD,
      t.stockCount
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `maranatha_tyre_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <strong>Total Active SKUs:</strong> ${filteredTyres.length} &nbsp;|&nbsp; 
          <strong>Total Units in Stock:</strong> ${filteredTyres.reduce((sum, t) => sum + t.stockCount, 0)}
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
            ${filteredTyres.map((t, idx) => `
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
            onClick={() => setIsAddModalOpen(true)}
            id="admin-inventory-add-btn"
            className="inline-flex items-center gap-1.5 bg-[#0984E3] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
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
            id="admin-inventory-export-btn"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition"
            title="Export filtered inventory to CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

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
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Inventory Listings ({filteredTyres.length} Tyres)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing matching shop inventory
          </span>
        </div>

        {filteredTyres.length === 0 ? (
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
                  <th className="py-3 px-4">Tyre & Model</th>
                  <th className="py-3 px-3">Size & Rim</th>
                  <th className="py-3 px-3">Condition</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price (EC$ / US$)</th>
                  <th className="py-3 px-3 text-center">Stock Count</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTyres.map(tyre => {
                  const isEditingPrice = editingPriceId === tyre.id;
                  const isEditingStock = editingStockId === tyre.id;
                  const isLow = tyre.stockCount > 0 && tyre.stockCount <= 4;
                  const isOut = tyre.stockCount <= 0;

                  return (
                    <tr key={tyre.id} className="hover:bg-slate-50/80 transition group">
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
                          <div className="flex items-center gap-1.5">
                            <div>
                              <span className="font-black text-slate-900 text-xs block">
                                EC$ {tyre.priceXCD.toFixed(2)}
                              </span>
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
    </div>
  );
};
