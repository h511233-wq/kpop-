import React, { useState, useMemo } from 'react';
import { ExpenseItem, KPopGroup, MerchCategory, PaymentStatus } from '../types/store';
import { CATEGORY_LABELS } from '../data/initialData';
import { BarcodeBadge } from './BarcodeBadge';
import { generateRandomBarcode } from '../utils/barcode';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShoppingBag,
  Info,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Save,
  Percent,
  Check,
  Barcode
} from 'lucide-react';

interface ExpenseLedgerProps {
  expenses: ExpenseItem[];
  groups: KPopGroup[];
  selectedGroupId: string | null;
  selectedCategory: string | null;
  onClearFilters: () => void;
  onSelectGroup: (groupId: string | null) => void;
  onSelectCategory: (cat: string | null) => void;
  onEditExpense: (item: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onQuickSell: (id: string, delta: number) => void;
  onOpenAddModal: () => void;
  onUpdateExpense?: (item: ExpenseItem) => void;
  onBatchUpdateStatus?: (ids: string[], status: PaymentStatus) => void;
  onBatchDelete?: (ids: string[]) => void;
  onBatchMarkup?: (ids: string[], multiplier: number) => void;
  onOpenScanner?: (barcodeOrId?: string) => void;
}

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  expenses,
  groups,
  selectedGroupId,
  selectedCategory,
  onClearFilters,
  onSelectGroup,
  onSelectCategory,
  onEditExpense,
  onDeleteExpense,
  onQuickSell,
  onOpenAddModal,
  onUpdateExpense,
  onBatchUpdateStatus,
  onBatchDelete,
  onBatchMarkup,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'cost-desc' | 'cost-asc' | 'stock-desc'>('date-desc');
  
  // Fast Inline Edit Mode
  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [quickEditingBarcodeId, setQuickEditingBarcodeId] = useState<string | null>(null);
  const [tempBarcodeValue, setTempBarcodeValue] = useState('');
  
  // Selected IDs for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return expenses
      .filter(item => {
        // Group filter
        if (selectedGroupId && item.groupId !== selectedGroupId) return false;
        // Category filter
        if (selectedCategory && item.category !== selectedCategory) return false;
        // Status filter
        if (statusFilter !== 'all' && item.paymentStatus !== statusFilter) return false;
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const groupName = groupMap.get(item.groupId)?.name.toLowerCase() || '';
          const matchTitle = item.title.toLowerCase().includes(term);
          const matchBarcode = (item.barcode || '').toLowerCase().includes(term);
          const matchSupplier = (item.supplier || '').toLowerCase().includes(term);
          const matchNote = (item.note || '').toLowerCase().includes(term);
          const matchGroup = groupName.includes(term);
          if (!matchTitle && !matchSupplier && !matchNote && !matchGroup && !matchBarcode) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
        if (sortBy === 'cost-desc') return b.totalCostTWD - a.totalCostTWD;
        if (sortBy === 'cost-asc') return a.totalCostTWD - b.totalCostTWD;
        if (sortBy === 'stock-desc') {
          const stockA = a.quantity - a.soldQuantity - a.defectCount;
          const stockB = b.quantity - b.soldQuantity - b.defectCount;
          return stockB - stockA;
        }
        return 0;
      });
  }, [expenses, selectedGroupId, selectedCategory, statusFilter, searchTerm, sortBy, groupMap]);

  // Subtotals for current filtered view
  const currentTotalExpenses = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + curr.totalCostTWD, 0);
  }, [filteredItems]);

  const currentTotalUnits = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [filteredItems]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Direct cell editing handler
  const handleCellChange = (item: ExpenseItem, field: keyof ExpenseItem, value: any) => {
    if (!onUpdateExpense) return;

    let updated = { ...item, [field]: value };

    // Auto recalculations if numbers changed
    if (field === 'unitWholesaleKRW' || field === 'quantity' || field === 'shippingCostTWD' || field === 'customsTaxTWD' || field === 'packagingCostTWD') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const krw = field === 'unitWholesaleKRW' ? Number(value) : item.unitWholesaleKRW;
      const ship = field === 'shippingCostTWD' ? Number(value) : item.shippingCostTWD;
      const customs = field === 'customsTaxTWD' ? Number(value) : item.customsTaxTWD;
      const pkg = field === 'packagingCostTWD' ? Number(value) : item.packagingCostTWD;

      const baseCostTWD = Math.round(krw * (item.exchangeRate || 0.024) * qty);
      const totalCostTWD = baseCostTWD + ship + customs + pkg;
      const unitLandedCostTWD = qty > 0 ? Math.round(totalCostTWD / qty) : totalCostTWD;

      updated = {
        ...updated,
        baseCostTWD,
        totalCostTWD,
        unitLandedCostTWD,
      };
    }

    onUpdateExpense(updated);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              門市進貨開銷與採購帳冊
            </h1>
            <span className="flex items-center gap-1 rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] text-emerald-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>即時同步存檔</span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span>篩選共 {filteredItems.length} 筆</span>
            <span aria-hidden="true">·</span>
            <span>採購量 <strong className="font-mono text-neutral-200">{currentTotalUnits}</strong> 件</span>
            <span aria-hidden="true">·</span>
            <span>總開銷 <strong className="font-mono text-pink-400 font-semibold">NT$ {currentTotalExpenses.toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Barcode Scanner Modal Button */}
          {onOpenScanner && (
            <button
              onClick={() => onOpenScanner()}
              className="flex items-center gap-1.5 rounded-lg bg-pink-950/80 hover:bg-pink-900 border border-pink-700/60 px-3.5 py-2 text-xs font-semibold text-pink-200 hover:text-white transition-all shadow-sm"
            >
              <Barcode className="h-4 w-4 text-pink-400" />
              <span>條碼槍掃描盤點機</span>
            </button>
          )}

          {/* Toggle Inline Quick Edit Mode */}
          <button
            onClick={() => setIsInlineEditMode(!isInlineEditMode)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all border ${
              isInlineEditMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-inner'
                : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{isInlineEditMode ? '✓ 行內修改模式中' : '開啟行內直接修改 (Excel)'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-600/25 hover:bg-pink-500 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>登記進貨或支出</span>
          </button>
        </div>
      </div>

      {/* Batch Actions Bar (Visible when items selected) */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-pink-500/40 bg-pink-950/20 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">
              已勾選 {selectedIds.size} 筆項目
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-neutral-400 hover:text-white underline ml-1"
            >
              取消勾選
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onUpdateExpense && (
              <button
                onClick={() => {
                  Array.from(selectedIds).forEach(id => {
                    const it = expenses.find(x => x.id === id);
                    if (it && !it.barcode) {
                      onUpdateExpense({ ...it, barcode: generateRandomBarcode() });
                    }
                  });
                  setSelectedIds(new Set());
                }}
                className="rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1"
                title="為選取但尚無條碼的商品自動產生 EAN-13 條碼"
              >
                <Barcode className="h-3.5 w-3.5 text-pink-400" />
                <span>批次補齊商品條碼</span>
              </button>
            )}

            {onBatchUpdateStatus && (
              <>
                <button
                  onClick={() => {
                    onBatchUpdateStatus(Array.from(selectedIds), 'paid');
                    setSelectedIds(new Set());
                  }}
                  className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  批次標為已付款
                </button>
                <button
                  onClick={() => {
                    onBatchUpdateStatus(Array.from(selectedIds), 'pending');
                    setSelectedIds(new Set());
                  }}
                  className="rounded bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  批次標為待結清
                </button>
              </>
            )}

            {onBatchMarkup && (
              <button
                onClick={() => {
                  onBatchMarkup(Array.from(selectedIds), 1.1); // +10%
                  setSelectedIds(new Set());
                }}
                className="rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Percent className="h-3 w-3" />
                <span>售價全面調升 +10%</span>
              </button>
            )}

            {onBatchDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`確定要批次刪除選取的 ${selectedIds.size} 筆開銷記錄嗎？`)) {
                    onBatchDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }
                }}
                className="rounded bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>批次刪除</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
        {/* Top search & sorting row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜尋品項名稱 (如：手燈、小卡、BORN PINK、ANITEEZ、YG SELECT)..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-4 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Category Select */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory || ''}
              onChange={e => onSelectCategory(e.target.value ? e.target.value : null)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none"
            >
              <option value="">所有品項類別 (手燈/小卡/專...)</option>
              <option value="lightstick">應援手燈 (Lightstick)</option>
              <option value="photocard">特典小卡 / 簽售卡</option>
              <option value="album_physical">實體專輯 (Photobook)</option>
              <option value="album_digital">電子專 / 平台專 (Nemo)</option>
              <option value="plush_doll">偶像娃娃 / 毛絨吊飾</option>
              <option value="other_merch">官方周邊 / 應援物</option>
              <option value="logistics_customs">國際空運與海關稅費</option>
              <option value="store_rent_overhead">門市租金水電</option>
              <option value="packaging_supplies">包裝耗材與硬卡套</option>
              <option value="staff_payroll">門市薪資</option>
              <option value="event_marketing">回歸宣傳打卡佈置</option>
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none"
            >
              <option value="all">付款狀態：全部</option>
              <option value="paid">已付清</option>
              <option value="pending">待結算 / 欠款</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none"
            >
              <option value="date-desc">支出日期 (新 ⭢ 舊)</option>
              <option value="date-asc">支出日期 (舊 ⭢ 新)</option>
              <option value="cost-desc">開銷金額 (高 ⭢ 低)</option>
              <option value="cost-asc">開銷金額 (低 ⭢ 高)</option>
              <option value="stock-desc">在庫現貨數量 (多 ⭢ 少)</option>
            </select>
          </div>
        </div>

        {/* Group Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-neutral-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>偶像團體：</span>
          </span>
          <button
            onClick={() => onSelectGroup(null)}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${
              selectedGroupId === null
                ? 'bg-neutral-200 text-neutral-900 font-semibold'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            全部天團
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => onSelectGroup(g.id === selectedGroupId ? null : g.id)}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap font-medium flex items-center gap-1.5 ${
                selectedGroupId === g.id
                  ? 'bg-pink-600 text-white font-semibold shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {g.id !== 'store_general' && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: g.colorAccent }}
                />
              )}
              <span>{g.name}</span>
            </button>
          ))}

          {(selectedGroupId || selectedCategory || searchTerm || statusFilter !== 'all') && (
            <button
              onClick={onClearFilters}
              className="text-pink-400 hover:text-pink-300 ml-2 whitespace-nowrap underline underline-offset-2"
            >
              清除所有篩選
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 font-medium">
                <th className="py-3 px-3 w-8 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    title="全選 / 取消全選"
                    className="text-neutral-400 hover:text-white"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? (
                      <CheckSquare className="h-4 w-4 text-pink-500" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">品項名稱與規格</th>
                <th className="py-3 px-3">商品條碼</th>
                <th className="py-3 px-3">所屬團體</th>
                <th className="py-3 px-3">周邊品類</th>
                <th className="py-3 px-3 text-right">進價(KRW)</th>
                <th className="py-3 px-3 text-right">到手單件成本</th>
                <th className="py-3 px-3 text-right">門市定價</th>
                <th className="py-3 px-3 text-center">採購 / 售出 / 現貨</th>
                <th className="py-3 px-3 text-right">總開銷 (TWD)</th>
                <th className="py-3 px-3 text-center">付款狀態</th>
                <th className="py-3 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-neutral-500">
                    <Info className="mx-auto h-8 w-8 text-neutral-600 mb-2" />
                    <p className="text-sm font-medium text-neutral-400">查無符合條件的進貨或開銷記錄</p>
                    <p className="text-xs text-neutral-500 mt-1">請嘗試調整搜尋關鍵字或清除篩選條件</p>
                    <button
                      onClick={onClearFilters}
                      className="mt-3 text-xs text-pink-400 hover:underline"
                    >
                      重設篩選
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const group = groupMap.get(item.groupId);
                  const catMeta = CATEGORY_LABELS[item.category] || {
                    label: item.category,
                    short: item.category,
                    color: 'text-neutral-400',
                  };
                  const currentStock = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
                  const isMerch = ![
                    'store_rent_overhead',
                    'staff_payroll',
                    'packaging_supplies',
                    'event_marketing',
                    'logistics_customs',
                  ].includes(item.category);

                  const margin = item.targetRetailPriceTWD > 0 
                    ? Math.round(((item.targetRetailPriceTWD - item.unitLandedCostTWD) / item.targetRetailPriceTWD) * 100) 
                    : 0;

                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr 
                      key={item.id}
                      className={`group hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? 'bg-pink-950/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(item.id)}
                          className="text-neutral-500 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-pink-500" />
                          ) : (
                            <Square className="h-4 w-4 text-neutral-600" />
                          )}
                        </button>
                      </td>

                      {/* Title & Notes (Inline editable if mode enabled) */}
                      <td className="py-3 px-3 max-w-xs sm:max-w-sm">
                        {isInlineEditMode ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.title}
                              onChange={e => handleCellChange(item, 'title', e.target.value)}
                              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-white focus:border-pink-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                              <span>供應商:</span>
                              <input
                                type="text"
                                value={item.supplier}
                                onChange={e => handleCellChange(item, 'supplier', e.target.value)}
                                className="rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[10px] text-neutral-300 w-32 focus:border-pink-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-white group-hover:text-pink-300 transition-colors leading-snug">
                              {item.title}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                              <span>{item.date}</span>
                              <span aria-hidden="true">·</span>
                              <span>供應商: {item.supplier || '韓方代購批發'}</span>
                              {item.defectCount > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-400 font-medium">
                                    瑕疵 {item.defectCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Barcode Cell (Editable inline, clickable to scanner) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isInlineEditMode && isMerch ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="880..."
                              value={item.barcode || ''}
                              onChange={e => handleCellChange(item, 'barcode', e.target.value)}
                              className="w-28 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs font-mono text-neutral-100 focus:border-pink-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleCellChange(item, 'barcode', generateRandomBarcode())}
                              title="隨機生成 EAN-13 條碼"
                              className="rounded bg-neutral-800 hover:bg-neutral-700 px-1.5 py-1 text-xs text-neutral-300"
                            >
                              🎲
                            </button>
                          </div>
                        ) : quickEditingBarcodeId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={tempBarcodeValue}
                              onChange={e => setTempBarcodeValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleCellChange(item, 'barcode', tempBarcodeValue);
                                  setQuickEditingBarcodeId(null);
                                } else if (e.key === 'Escape') {
                                  setQuickEditingBarcodeId(null);
                                }
                              }}
                              className="w-28 rounded border border-pink-500 bg-neutral-950 px-2 py-0.5 text-xs font-mono text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleCellChange(item, 'barcode', tempBarcodeValue);
                                setQuickEditingBarcodeId(null);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 px-1 text-xs"
                              title="儲存條碼"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickEditingBarcodeId(null)}
                              className="text-neutral-500 hover:text-neutral-300 px-1 text-xs"
                              title="取消"
                            >
                              ✕
                            </button>
                          </div>
                        ) : item.barcode ? (
                          <div className="flex items-center gap-1.5 group/bc">
                            <button
                              type="button"
                              onClick={() => onOpenScanner && onOpenScanner(item.barcode)}
                              title="點擊以於條碼槍盤點機檢驗庫存"
                              className="hover:scale-[1.02] transition-transform text-left"
                            >
                              <BarcodeBadge barcode={item.barcode} showVisualBars={false} allowCopy={true} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickEditingBarcodeId(item.id);
                                setTempBarcodeValue(item.barcode || '');
                              }}
                              title="修改此條碼"
                              className="opacity-0 group-hover/bc:opacity-100 text-neutral-500 hover:text-white transition-opacity p-0.5"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : isMerch ? (
                          <button
                            type="button"
                            onClick={() => handleCellChange(item, 'barcode', generateRandomBarcode())}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-pink-400 font-medium py-0.5 px-1.5 rounded hover:bg-neutral-800/60 transition-colors"
                            title="點擊自動生成一組 880 韓國標準條碼"
                          >
                            <Barcode className="h-3.5 w-3.5 text-neutral-400" />
                            <span>+設定條碼</span>
                          </button>
                        ) : (
                          <span className="text-neutral-600 font-mono text-[10px]">無實體</span>
                        )}
                      </td>

                      {/* Group */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isInlineEditMode ? (
                          <select
                            value={item.groupId}
                            onChange={e => handleCellChange(item, 'groupId', e.target.value)}
                            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none"
                          >
                            {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {group?.id !== 'store_general' && (
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: group?.colorAccent || '#64748b' }}
                              />
                            )}
                            <span className="text-neutral-300 font-medium">
                              {group?.name || item.groupId}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Category Label */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-neutral-300 font-medium">
                          {catMeta.short}
                        </span>
                      </td>

                      {/* Wholesale KRW */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {isInlineEditMode && isMerch ? (
                          <input
                            type="number"
                            value={item.unitWholesaleKRW}
                            onChange={e => handleCellChange(item, 'unitWholesaleKRW', Number(e.target.value))}
                            className="w-20 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-right text-xs font-mono text-neutral-200 focus:border-pink-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-neutral-400">
                            {item.unitWholesaleKRW > 0 
                              ? `₩${item.unitWholesaleKRW.toLocaleString()}` 
                              : '-'}
                          </span>
                        )}
                      </td>

                      {/* Unit Landed Cost */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-200 whitespace-nowrap">
                        {isMerch ? (
                          <div>
                            <div className="font-medium">NT$ {item.unitLandedCostTWD.toLocaleString()}</div>
                          </div>
                        ) : (
                          '固定支出'
                        )}
                      </td>

                      {/* MSRP */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {isInlineEditMode && isMerch ? (
                          <input
                            type="number"
                            value={item.targetRetailPriceTWD}
                            onChange={e => handleCellChange(item, 'targetRetailPriceTWD', Number(e.target.value))}
                            className="w-20 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-right text-xs font-mono text-emerald-400 font-bold focus:border-pink-500 focus:outline-none"
                          />
                        ) : (
                          item.targetRetailPriceTWD > 0 ? (
                            <div>
                              <div className="text-white font-medium">NT$ {item.targetRetailPriceTWD.toLocaleString()}</div>
                              <div className="text-[10px] text-pink-400 font-semibold">
                                毛利 ~{margin}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )
                        )}
                      </td>

                      {/* Inventory / Sales status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isInlineEditMode && isMerch ? (
                          <div className="flex items-center justify-center gap-1 font-mono">
                            <input
                              type="number"
                              title="進貨量"
                              value={item.quantity}
                              onChange={e => handleCellChange(item, 'quantity', Number(e.target.value))}
                              className="w-12 rounded border border-neutral-700 bg-neutral-950 px-1 py-0.5 text-center text-xs text-neutral-300"
                            />
                            <span>/</span>
                            <input
                              type="number"
                              title="售出量"
                              value={item.soldQuantity}
                              onChange={e => handleCellChange(item, 'soldQuantity', Number(e.target.value))}
                              className="w-12 rounded border border-neutral-700 bg-neutral-950 px-1 py-0.5 text-center text-xs text-emerald-400 font-bold"
                            />
                            <span>/</span>
                            <input
                              type="number"
                              title="瑕疵數"
                              value={item.defectCount}
                              onChange={e => handleCellChange(item, 'defectCount', Number(e.target.value))}
                              className="w-10 rounded border border-neutral-700 bg-neutral-950 px-1 py-0.5 text-center text-xs text-amber-400"
                            />
                          </div>
                        ) : (
                          isMerch ? (
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-center gap-1 font-mono tabular-nums text-xs">
                                <span className="text-neutral-400" title="總進貨量">{item.quantity}</span>
                                <span className="text-neutral-600">/</span>
                                <span className="text-emerald-400 font-semibold" title="已售出">{item.soldQuantity}</span>
                                <span className="text-neutral-600">/</span>
                                <span className={`font-bold ${currentStock <= 3 ? 'text-amber-400' : 'text-white'}`} title="庫存現貨">
                                  {currentStock}
                                </span>
                              </div>
                              {/* Quick sell inline button */}
                              {currentStock > 0 && (
                                <button
                                  onClick={() => onQuickSell(item.id, 1)}
                                  title="點擊登記賣出 1 件"
                                  className="mt-1 flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-medium"
                                >
                                  <ShoppingBag className="h-3 w-3" />
                                  <span>+1 售出</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-500">1 式</span>
                          )
                        )}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-white whitespace-nowrap">
                        NT$ {item.totalCostTWD.toLocaleString()}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isInlineEditMode ? (
                          <select
                            value={item.paymentStatus}
                            onChange={e => handleCellChange(item, 'paymentStatus', e.target.value as PaymentStatus)}
                            className="rounded border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-xs text-neutral-200"
                          >
                            <option value="paid">已付款</option>
                            <option value="pending">待結算</option>
                            <option value="cod">貨到付</option>
                          </select>
                        ) : (
                          item.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>已付款</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                              <Clock className="h-3.5 w-3.5" />
                              <span>待結清</span>
                            </span>
                          )
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditExpense(item)}
                            title="完整編輯彈窗"
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(item.id)}
                            title="刪除此筆記錄"
                            className="rounded p-1 text-neutral-500 hover:bg-red-950/60 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
