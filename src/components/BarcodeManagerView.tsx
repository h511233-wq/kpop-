import React, { useState, useMemo, useRef } from 'react';
import { ExpenseItem, KPopGroup, MerchCategory } from '../types/store';
import { CATEGORY_LABELS } from '../data/initialData';
import { BarcodeBadge } from './BarcodeBadge';
import { 
  generateRandomBarcode, 
  generateItemBarcodeWithPrefix,
  isEAN13, 
  formatBarcode 
} from '../utils/barcode';
import { 
  Barcode, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Printer, 
  Download, 
  Check, 
  Copy, 
  Edit2, 
  X, 
  Layers, 
  Sparkles, 
  Scan,
  Tag,
  Disc3,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface BarcodeManagerViewProps {
  expenses: ExpenseItem[];
  groups: KPopGroup[];
  onUpdateExpense: (item: ExpenseItem) => void;
  onOpenScanner: (barcodeOrId?: string) => void;
  onOpenAddModal: () => void;
}

export const BarcodeManagerView: React.FC<BarcodeManagerViewProps> = ({
  expenses,
  groups,
  onUpdateExpense,
  onOpenScanner,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeStatusFilter, setBarcodeStatusFilter] = useState<'all' | 'has_barcode' | 'missing_barcode' | 'duplicate'>('all');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline editing state
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [editingBarcodeVal, setEditingBarcodeVal] = useState<string>('');

  // Custom Prefix Batch Generator Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchPrefix, setBatchPrefix] = useState('8809');
  const [batchTargetOption, setBatchTargetOption] = useState<'missing_only' | 'selected_only' | 'all_merch'>('missing_only');

  // Print Label Sheet View
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [printLabelCountMode, setPrintLabelCountMode] = useState<'stock_quantity' | 'single_sample'>('single_sample');
  const [printShowPrice, setPrintShowPrice] = useState(true);
  const [printShowStoreName, setPrintShowStoreName] = useState(true);
  const [printShowGroup, setPrintShowGroup] = useState(true);
  const [printLabelSize, setPrintLabelSize] = useState<'standard' | 'compact'>('standard');

  // Notification toast
  const [localToast, setLocalToast] = useState<string | null>(null);

  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);

  const showToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 3200);
  };

  // Only consider physical merchandise for barcodes (exclude fixed rent and payroll)
  const merchandiseItems = useMemo(() => {
    return expenses.filter(i => 
      i.category !== 'store_rent_overhead' && 
      i.category !== 'staff_payroll'
    );
  }, [expenses]);

  // Duplicate barcodes map
  const duplicateBarcodeMap = useMemo(() => {
    const codeCounts = new Map<string, number>();
    merchandiseItems.forEach(item => {
      if (item.barcode && item.barcode.trim()) {
        const clean = item.barcode.trim();
        codeCounts.set(clean, (codeCounts.get(clean) || 0) + 1);
      }
    });

    const duplicates = new Set<string>();
    codeCounts.forEach((count, code) => {
      if (count > 1) {
        duplicates.add(code);
      }
    });
    return duplicates;
  }, [merchandiseItems]);

  // Statistics
  const stats = useMemo(() => {
    const total = merchandiseItems.length;
    const withBarcode = merchandiseItems.filter(i => i.barcode && i.barcode.trim().length > 0).length;
    const missing = total - withBarcode;
    const duplicateCount = merchandiseItems.filter(i => i.barcode && duplicateBarcodeMap.has(i.barcode.trim())).length;
    const percentage = total > 0 ? Math.round((withBarcode / total) * 100) : 0;
    return { total, withBarcode, missing, duplicateCount, percentage };
  }, [merchandiseItems, duplicateBarcodeMap]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return merchandiseItems.filter(item => {
      // Group filter
      if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) return false;
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      
      // Barcode status filter
      const hasBc = Boolean(item.barcode && item.barcode.trim());
      const isDup = Boolean(item.barcode && duplicateBarcodeMap.has(item.barcode.trim()));

      if (barcodeStatusFilter === 'has_barcode' && !hasBc) return false;
      if (barcodeStatusFilter === 'missing_barcode' && hasBc) return false;
      if (barcodeStatusFilter === 'duplicate' && !isDup) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const group = groupMap.get(item.groupId);
        const matchTitle = item.title.toLowerCase().includes(term);
        const matchBarcode = (item.barcode || '').toLowerCase().includes(term);
        const matchGroup = (group?.name || '').toLowerCase().includes(term) || (group?.koreanName || '').toLowerCase().includes(term);
        const matchSupplier = (item.supplier || '').toLowerCase().includes(term);
        if (!matchTitle && !matchBarcode && !matchGroup && !matchSupplier) return false;
      }

      return true;
    });
  }, [merchandiseItems, selectedGroupId, selectedCategory, barcodeStatusFilter, searchTerm, groupMap, duplicateBarcodeMap]);

  // Toggle selection
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 1-Click Batch Establish for all missing items
  const handleGenerateAllMissing = () => {
    const missingItems = merchandiseItems.filter(i => !i.barcode || !i.barcode.trim());
    if (missingItems.length === 0) {
      showToast('目前所有實體周邊商品均已建立條碼，無需補充！');
      return;
    }

    missingItems.forEach(item => {
      const newBarcode = generateRandomBarcode('8809');
      onUpdateExpense({ ...item, barcode: newBarcode });
    });

    showToast(`已成功為 ${missingItems.length} 項商品自動建立韓國標準 EAN-13 (880) 條碼！`);
  };

  // Batch generate with custom options
  const handleExecuteBatchPrefixGeneration = () => {
    let targets: ExpenseItem[] = [];

    if (batchTargetOption === 'missing_only') {
      targets = merchandiseItems.filter(i => !i.barcode || !i.barcode.trim());
    } else if (batchTargetOption === 'selected_only') {
      targets = merchandiseItems.filter(i => selectedIds.has(i.id));
    } else {
      targets = merchandiseItems;
    }

    if (targets.length === 0) {
      showToast('未選取任何適用之商品！');
      setIsBatchModalOpen(false);
      return;
    }

    targets.forEach((item, index) => {
      const newBarcode = generateItemBarcodeWithPrefix(batchPrefix, Date.now() % 100000 + index);
      onUpdateExpense({ ...item, barcode: newBarcode });
    });

    showToast(`已成功批量為 ${targets.length} 項商品建立以「${batchPrefix}」為前綴的條碼！`);
    setIsBatchModalOpen(false);
    setSelectedIds(new Set());
  };

  // Inline edit barcode save
  const handleSaveInlineBarcode = (item: ExpenseItem) => {
    const clean = editingBarcodeVal.trim();
    onUpdateExpense({ ...item, barcode: clean });
    setEditingBarcodeId(null);
    setEditingBarcodeVal('');
    showToast(`已儲存「${item.title}」之條碼：${clean}`);
  };

  // Quick single generate
  const handleQuickGenerateSingle = (item: ExpenseItem) => {
    const newCode = generateRandomBarcode('8809');
    onUpdateExpense({ ...item, barcode: newCode });
    showToast(`已為「${item.title}」生成 EAN-13 條碼：${newCode}`);
  };

  // Export Barcodes CSV
  const handleExportBarcodeCSV = () => {
    const headers = [
      '商品條碼 (Barcode)',
      '所屬團體 (Group)',
      '商品名稱 (Title)',
      '周邊類別 (Category)',
      '門市售價 TWD (MSRP)',
      '到手成本 TWD',
      '現貨庫存 (Stock)',
      '總進貨量',
      '已售出量',
      '國際標準檢驗 (EAN-13)',
    ];

    const rows = filteredItems.map(item => {
      const group = groupMap.get(item.groupId);
      const cat = CATEGORY_LABELS[item.category]?.short || item.category;
      const stock = item.quantity - item.soldQuantity - item.defectCount;
      const isStandardEAN = isEAN13(item.barcode || '');

      return [
        `\t${item.barcode || '未設條碼'}`, // tab to prevent Excel truncation
        group?.name || item.groupId,
        `"${item.title.replace(/"/g, '""')}"`,
        cat,
        item.targetRetailPriceTWD,
        item.unitLandedCostTWD,
        stock,
        item.quantity,
        item.soldQuantity,
        isStandardEAN ? '是 (EAN-13 880)' : '否 (自訂格式)',
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hallyu_store_barcodes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已匯出門市條碼清單 CSV！');
  };

  // Printable Items for the Label Sheet
  const printableItems = useMemo(() => {
    const baseList = selectedIds.size > 0 
      ? filteredItems.filter(i => selectedIds.has(i.id))
      : filteredItems;

    // Filter to items that actually have barcodes
    const validBarcodeItems = baseList.filter(i => Boolean(i.barcode && i.barcode.trim()));

    if (printLabelCountMode === 'single_sample') {
      return validBarcodeItems.map(item => ({ item, count: 1 }));
    } else {
      return validBarcodeItems.map(item => {
        const stock = Math.max(1, item.quantity - item.soldQuantity - item.defectCount);
        return { item, count: stock };
      });
    }
  }, [filteredItems, selectedIds, printLabelCountMode]);

  const totalStickersToPrint = useMemo(() => {
    return printableItems.reduce((acc, curr) => acc + curr.count, 0);
  }, [printableItems]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
              <Barcode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                各商品條碼建立與標籤管理中心
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                支援國際標準韓國 EAN-13 (880) 條碼建立、即時修改、批次補齊、雷射槍盤點與標籤貼紙列印排版
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenScanner()}
            className="flex items-center gap-1.5 rounded-lg border border-pink-500/40 bg-pink-950/40 hover:bg-pink-900/60 px-3 py-2 text-xs font-semibold text-pink-300 hover:text-white transition-all shadow-sm"
          >
            <Scan className="h-4 w-4 text-pink-400" />
            <span>條碼槍掃描驗證</span>
          </button>

          <button
            onClick={() => setIsPrintSheetOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white transition-all shadow-sm"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            <span>條碼標籤貼紙排版列印</span>
          </button>

          <button
            onClick={handleExportBarcodeCSV}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm"
          >
            <Download className="h-4 w-4 text-neutral-400" />
            <span>匯出條碼表</span>
          </button>

          <button
            onClick={handleGenerateAllMissing}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-pink-600/25 whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4" />
            <span>一鍵補齊未設條碼</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>門市實體周邊總數</span>
            <Tag className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{stats.total}</span>
            <span className="text-xs text-neutral-400">品項</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            涵蓋手燈、小卡、專輯、平台專、玩偶
          </div>
        </div>

        {/* Established Barcodes */}
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>已建立條碼商品</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{stats.withBarcode}</span>
            <span className="text-xs text-emerald-300/80 font-mono">({stats.percentage}%)</span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Missing Barcodes */}
        <div className={`rounded-xl border p-4 ${
          stats.missing > 0 
            ? 'border-amber-900/40 bg-amber-950/20 text-amber-300' 
            : 'border-neutral-800 bg-neutral-900/60 text-neutral-400'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span>尚未建立條碼</span>
            <AlertTriangle className={`h-4 w-4 ${stats.missing > 0 ? 'text-amber-400' : 'text-neutral-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${stats.missing > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
              {stats.missing}
            </span>
            <span className="text-xs text-neutral-400">品項</span>
          </div>
          <div className="mt-2 text-[11px]">
            {stats.missing > 0 ? (
              <button 
                onClick={handleGenerateAllMissing}
                className="text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
              >
                <span>點擊立即一鍵補全</span>
              </button>
            ) : (
              <span className="text-emerald-400">全數條碼建檔完成</span>
            )}
          </div>
        </div>

        {/* Duplicate Barcode Check */}
        <div className={`rounded-xl border p-4 ${
          stats.duplicateCount > 0 
            ? 'border-red-900/40 bg-red-950/20 text-red-300' 
            : 'border-neutral-800 bg-neutral-900/60 text-neutral-400'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span>重複條碼防呆檢驗</span>
            <Layers className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${stats.duplicateCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {stats.duplicateCount}
            </span>
            <span className="text-xs text-neutral-400">筆重複</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {stats.duplicateCount > 0 ? (
              <button
                onClick={() => setBarcodeStatusFilter('duplicate')}
                className="text-red-400 underline"
              >
                篩選重複條碼進行修正
              </button>
            ) : (
              <span className="text-emerald-400">無任何重複，條碼唯一性正常</span>
            )}
          </div>
        </div>
      </div>

      {/* Batch Operations Bar (When items are checked) */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-pink-500/40 bg-pink-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">
              已勾選 {selectedIds.size} 筆商品
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-neutral-400 hover:text-white underline ml-1"
            >
              取消勾選
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                Array.from(selectedIds).forEach(id => {
                  const it = expenses.find(x => x.id === id);
                  if (it) {
                    onUpdateExpense({ ...it, barcode: generateRandomBarcode('8809') });
                  }
                });
                showToast(`已為勾選的 ${selectedIds.size} 項商品重新生成 EAN-13 條碼！`);
                setSelectedIds(new Set());
              }}
              className="rounded bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>批次生成 EAN-13 條碼</span>
            </button>

            <button
              onClick={() => {
                setIsBatchModalOpen(true);
                setBatchTargetOption('selected_only');
              }}
              className="rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
              <span>自訂前綴批次編碼...</span>
            </button>

            <button
              onClick={() => {
                setIsPrintSheetOpen(true);
              }}
              className="rounded bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>列印所選商品標籤 ({selectedIds.size} 種)</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`確定要清除所選取的 ${selectedIds.size} 筆商品的條碼嗎？`)) {
                  Array.from(selectedIds).forEach(id => {
                    const it = expenses.find(x => x.id === id);
                    if (it) {
                      onUpdateExpense({ ...it, barcode: '' });
                    }
                  });
                  showToast(`已清除 ${selectedIds.size} 筆商品條碼`);
                  setSelectedIds(new Set());
                }
              }}
              className="rounded bg-neutral-800 hover:bg-red-950 hover:text-red-300 text-neutral-400 px-2.5 py-1.5 font-medium transition-colors"
            >
              清除條碼
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜尋品項名稱、條碼號碼 (如 880...)、團體名稱、供應商..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-4 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none"
          >
            <option value="all">所有偶像團體 (全部)</option>
            {groups.filter(g => g.id !== 'store_general').map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.koreanName})</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none"
          >
            <option value="all">所有周邊品類</option>
            <option value="lightstick">官方應援手燈</option>
            <option value="photocard">特典小卡 / 簽售卡</option>
            <option value="album_physical">實體專輯</option>
            <option value="album_digital">電子專 / 平台專</option>
            <option value="plush_doll">偶像娃娃 / 毛絨吊飾</option>
            <option value="other_merch">官方周邊商品</option>
          </select>

          {/* Barcode status filter */}
          <select
            value={barcodeStatusFilter}
            onChange={e => setBarcodeStatusFilter(e.target.value as any)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-pink-500 focus:outline-none font-medium"
          >
            <option value="all">條碼狀態: 全部</option>
            <option value="has_barcode">✓ 已建立條碼 ({stats.withBarcode})</option>
            <option value="missing_barcode">⚠ 尚未建立條碼 ({stats.missing})</option>
            <option value="duplicate">❌ 條碼重複警示 ({stats.duplicateCount})</option>
          </select>
        </div>

        {/* Active Filter badges */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
          <div className="flex items-center gap-2">
            <span>篩選結果：共 <strong className="text-white font-mono">{filteredItems.length}</strong> 個商品</span>
            {selectedIds.size > 0 && (
              <span className="text-pink-400 font-medium">· 已選取 {selectedIds.size} 項</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBatchModalOpen(true);
                setBatchTargetOption('missing_only');
              }}
              className="text-xs text-neutral-300 hover:text-pink-400 flex items-center gap-1 transition-colors"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>自訂條碼規則</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Barcode Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-medium">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredItems.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-neutral-700 bg-neutral-900 text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">商品品項名稱</th>
                <th className="py-3 px-3">所屬團體</th>
                <th className="py-3 px-3">類別</th>
                <th className="py-3 px-3 min-w-[200px]">商品條碼 (條紋與號碼)</th>
                <th className="py-3 px-3 text-center">條碼規格檢驗</th>
                <th className="py-3 px-3 text-right">門市售價</th>
                <th className="py-3 px-3 text-center">現有庫存</th>
                <th className="py-3 px-3 text-right">操作與盤點</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <Barcode className="mx-auto h-8 w-8 text-neutral-600 mb-2 opacity-60" />
                    <p className="text-sm font-medium text-neutral-400">查無符合條件的商品條碼記錄</p>
                    <p className="text-xs text-neutral-500 mt-1">請嘗試變更搜尋關鍵字或重設篩選條件</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const group = groupMap.get(item.groupId);
                  const cat = CATEGORY_LABELS[item.category] || { short: item.category, color: 'text-neutral-400' };
                  const stock = item.quantity - item.soldQuantity - item.defectCount;
                  const isChecked = selectedIds.has(item.id);
                  const hasBarcode = Boolean(item.barcode && item.barcode.trim());
                  const isEan = isEAN13(item.barcode || '');
                  const isDuplicate = Boolean(item.barcode && duplicateBarcodeMap.has(item.barcode.trim()));
                  const isEditingThis = editingBarcodeId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-neutral-800/30 transition-colors ${
                        isChecked ? 'bg-pink-950/20' : ''
                      } ${isDuplicate ? 'bg-red-950/10' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(item.id)}
                          className="rounded border-neutral-700 bg-neutral-900 text-pink-600 focus:ring-pink-500 cursor-pointer"
                        />
                      </td>

                      {/* Product Title */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white leading-snug">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-neutral-500 flex items-center gap-1.5">
                          <span>供應商: {item.supplier || '韓方代購'}</span>
                          <span>·</span>
                          <span>進貨日: {item.date}</span>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: group?.colorAccent || '#ec4899' }}
                          />
                          <span className="text-neutral-200 font-medium">{group?.name || item.groupId}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="rounded px-2 py-0.5 text-[11px] font-medium border border-neutral-800 bg-neutral-950 text-neutral-300">
                          {cat.short}
                        </span>
                      </td>

                      {/* Barcode & Edit Field */}
                      <td className="py-3 px-3">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                            <input
                              type="text"
                              autoFocus
                              value={editingBarcodeVal}
                              onChange={e => setEditingBarcodeVal(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveInlineBarcode(item);
                                if (e.key === 'Escape') setEditingBarcodeId(null);
                              }}
                              placeholder="輸入 13 碼條碼 (880...)"
                              className="w-40 rounded border border-pink-500 bg-neutral-950 px-2 py-1 text-xs font-mono text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingBarcodeVal(generateRandomBarcode('8809'))}
                              title="隨機生成 880 韓國標準條碼"
                              className="rounded bg-neutral-800 hover:bg-neutral-700 px-1.5 py-1 text-xs text-neutral-300"
                            >
                              🎲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineBarcode(item)}
                              title="確認儲存"
                              className="rounded bg-emerald-600 hover:bg-emerald-500 text-white p-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBarcodeId(null)}
                              title="取消"
                              className="rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 p-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : hasBarcode ? (
                          <div className="flex items-center gap-2 group/bc">
                            <div className="cursor-pointer" onClick={() => onOpenScanner(item.barcode)}>
                              <BarcodeBadge
                                barcode={item.barcode}
                                showVisualBars={true}
                                size="sm"
                                allowCopy={true}
                              />
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover/bc:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingBarcodeId(item.id);
                                  setEditingBarcodeVal(item.barcode || '');
                                }}
                                title="手動修改此條碼"
                                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleQuickGenerateSingle(item)}
                                title="重新隨機生成"
                                className="p-1 rounded text-neutral-400 hover:text-pink-400 hover:bg-neutral-800"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 italic">尚未建立條碼</span>
                            <button
                              type="button"
                              onClick={() => handleQuickGenerateSingle(item)}
                              className="rounded bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 hover:text-white px-2 py-0.5 text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              <span>建立條碼</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Barcode Validation Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-950/60 border border-red-800 px-2 py-0.5 text-[10px] text-red-400 font-semibold" title="與其他商品條碼重複，請重新編號">
                            <AlertTriangle className="h-3 w-3" />
                            <span>條碼重複</span>
                          </span>
                        ) : isEan ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>EAN-13 (韓國)</span>
                          </span>
                        ) : hasBarcode ? (
                          <span className="inline-flex items-center gap-1 rounded bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-300">
                            <span>自訂條碼</span>
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className="font-bold text-white">NT$ {item.targetRetailPriceTWD.toLocaleString()}</span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          stock <= 0 ? 'bg-red-950/40 text-red-400 border border-red-900/60' :
                          stock <= 3 ? 'bg-amber-950/40 text-amber-300 border border-amber-900/60' :
                          'bg-neutral-800 text-neutral-200'
                        }`}>
                          {stock} 件
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasBarcode && (
                            <button
                              onClick={() => onOpenScanner(item.barcode)}
                              title="使用條碼槍盤點此商品"
                              className="rounded p-1 text-pink-400 hover:bg-pink-950/50 hover:text-pink-300 transition-colors"
                            >
                              <Scan className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingBarcodeId(item.id);
                              setEditingBarcodeVal(item.barcode || '');
                            }}
                            title="修改條碼"
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {hasBarcode && (
                            <button
                              onClick={() => {
                                setSelectedIds(new Set([item.id]));
                                setIsPrintSheetOpen(true);
                              }}
                              title="單品條碼貼紙列印排版"
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-amber-300 transition-colors"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Custom Batch Prefix Establishment Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <SlidersHorizontal className="h-5 w-5 text-pink-500" />
                <span>自訂條碼規則批次建立</span>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              可依門市規定自訂條碼國別或廠商前綴碼，系統將自動依序編碼並計算第 13 位 EAN 檢查碼。
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  條碼前綴碼 (Prefix)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={e => setBatchPrefix(e.target.value)}
                    placeholder="8809 (韓國進口) 或 471 (台灣門市)"
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBatchPrefix('8809')}
                    className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-2 rounded"
                  >
                    韓國 8809
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchPrefix('4710')}
                    className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-2 rounded"
                  >
                    台灣 4710
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  套用對象
                </label>
                <div className="space-y-1.5 text-xs text-neutral-300">
                  <label className="flex items-center gap-2 p-2 rounded border border-neutral-800 hover:bg-neutral-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="batchOption"
                      checked={batchTargetOption === 'missing_only'}
                      onChange={() => setBatchTargetOption('missing_only')}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span>僅為尚未建立條碼的商品補全 ({stats.missing} 項)</span>
                  </label>

                  {selectedIds.size > 0 && (
                    <label className="flex items-center gap-2 p-2 rounded border border-neutral-800 hover:bg-neutral-800/40 cursor-pointer">
                      <input
                        type="radio"
                        name="batchOption"
                        checked={batchTargetOption === 'selected_only'}
                        onChange={() => setBatchTargetOption('selected_only')}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <span>僅套用至已勾選的項目 ({selectedIds.size} 項)</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 p-2 rounded border border-neutral-800 hover:bg-neutral-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="batchOption"
                      checked={batchTargetOption === 'all_merch'}
                      onChange={() => setBatchTargetOption('all_merch')}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-amber-400">全部實體周邊強制重新編號 (共 {stats.total} 項)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchPrefixGeneration}
                className="rounded-lg bg-pink-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-pink-500 shadow-md shadow-pink-600/20"
              >
                開始批量建立條碼
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Barcode Label Sheet Modal / Full View */}
      {isPrintSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Header controls (Non-printable) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4 print:hidden">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Printer className="h-5 w-5 text-amber-400" />
                  <span>門市商品條碼標籤貼紙排版與列印預覽</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  總計將列印 <strong className="text-white font-mono">{totalStickersToPrint}</strong> 張標籤貼紙 (適用於專輯外封膜、手燈盒、小卡卡套與玩偶標籤)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-pink-500 shadow-md shadow-pink-600/30 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>立即送印標籤貼紙 (Print)</span>
                </button>
                <button
                  onClick={() => setIsPrintSheetOpen(false)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Options Config Bar (Non-printable) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 text-xs print:hidden">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 font-medium">每品項列印數量:</span>
                  <select
                    value={printLabelCountMode}
                    onChange={e => setPrintLabelCountMode(e.target.value as any)}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white text-xs"
                  >
                    <option value="single_sample">每款固定 1 張 (陳列展示標籤)</option>
                    <option value="stock_quantity">依現貨庫存數量列印 (庫存幾件印幾張)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 font-medium">標籤版型尺寸:</span>
                  <select
                    value={printLabelSize}
                    onChange={e => setPrintLabelSize(e.target.value as any)}
                    className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white text-xs"
                  >
                    <option value="standard">標準商品標價簽 (50mm × 30mm)</option>
                    <option value="compact">輕巧小卡/配件籤 (40mm × 22mm)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printShowPrice}
                    onChange={e => setPrintShowPrice(e.target.checked)}
                    className="rounded text-pink-600"
                  />
                  <span>印出建議售價</span>
                </label>

                <label className="flex items-center gap-1 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printShowGroup}
                    onChange={e => setPrintShowGroup(e.target.checked)}
                    className="rounded text-pink-600"
                  />
                  <span>印出所屬團體</span>
                </label>

                <label className="flex items-center gap-1 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printShowStoreName}
                    onChange={e => setPrintShowStoreName(e.target.checked)}
                    className="rounded text-pink-600"
                  />
                  <span>印出店名浮水印</span>
                </label>
              </div>
            </div>

            {/* Sticker Grid Container (Formatted for print) */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-900/40 rounded-xl border border-neutral-800 print:bg-white print:border-none print:p-0">
              <div className={`grid gap-3 sm:gap-4 print:gap-2 ${
                printLabelSize === 'standard' 
                  ? 'grid-cols-2 md:grid-cols-3 print:grid-cols-3' 
                  : 'grid-cols-2 md:grid-cols-4 print:grid-cols-4'
              }`}>
                {printableItems.flatMap(({ item, count }, itemIndex) => {
                  const group = groupMap.get(item.groupId);
                  const elements = [];
                  for (let i = 0; i < count; i++) {
                    elements.push(
                      <div
                        key={`${item.id}-${i}`}
                        className="bg-white text-black p-3 rounded-lg border border-neutral-300 shadow-sm flex flex-col justify-between items-center text-center select-none print:shadow-none print:border-neutral-400 print:break-inside-avoid print:page-break-inside-avoid"
                        style={{ minHeight: printLabelSize === 'standard' ? '125px' : '100px' }}
                      >
                        {/* Top Store & Group Header */}
                        <div className="w-full flex items-center justify-between text-[10px] text-neutral-600 border-b border-neutral-200 pb-1 mb-1">
                          {printShowStoreName && (
                            <span className="font-semibold tracking-tighter text-pink-700">
                              HallyuGroove
                            </span>
                          )}
                          {printShowGroup && (
                            <span className="font-bold text-neutral-800 truncate max-w-[120px]">
                              {group?.name || item.groupId}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div className="w-full font-bold text-xs leading-tight text-neutral-900 line-clamp-2 my-auto px-1">
                          {item.title}
                        </div>

                        {/* Barcode & Numbers */}
                        <div className="my-1 w-full flex flex-col items-center">
                          <BarcodeBadge
                            barcode={item.barcode}
                            showVisualBars={true}
                            size={printLabelSize === 'standard' ? 'md' : 'sm'}
                            allowCopy={false}
                          />
                        </div>

                        {/* Price & Category Footer */}
                        <div className="w-full flex items-center justify-between text-[11px] pt-1 border-t border-neutral-200 mt-1">
                          <span className="text-[10px] text-neutral-500">
                            {CATEGORY_LABELS[item.category]?.short || ''}
                          </span>
                          {printShowPrice && (
                            <span className="font-bold font-mono text-black text-xs">
                              NT$ {item.targetRetailPriceTWD.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return elements;
                })}
              </div>
            </div>

            {/* Bottom modal actions */}
            <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-3 print:hidden">
              <span>如需輸出至專用標籤機 (如 Brother / Dymo / TSC)，請選擇「每品項固定 1 張」或「依庫存量列印」。</span>
              <button
                onClick={() => setIsPrintSheetOpen(false)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-1.5 text-neutral-200 hover:bg-neutral-700 font-medium"
              >
                關閉排版檢視
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {localToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
          <span>{localToast}</span>
        </div>
      )}
    </div>
  );
};
