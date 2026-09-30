import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ExpenseItem, KPopGroup, StoreBackupData, HistorySnapshot, PaymentStatus } from './types/store';
import { KPOP_GROUPS, INITIAL_EXPENSES } from './data/initialData';
import { 
  calculateStoreSummary, 
  calculateGroupBreakdowns, 
  calculateCategoryBreakdown,
  exportExpensesToCSV
} from './utils/calculations';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { ExpenseLedger } from './components/ExpenseLedger';
import { GroupBreakdownView } from './components/GroupBreakdownView';
import { CostCalculator } from './components/CostCalculator';
import { StoreOverheadView } from './components/StoreOverheadView';
import { DataStorageManager } from './components/DataStorageManager';
import { AddExpenseModal } from './components/AddExpenseModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { GroupModal } from './components/GroupModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodeManagerView } from './components/BarcodeManagerView';
import { Check } from 'lucide-react';

const STORAGE_EXPENSES_KEY = 'hallyu_store_expenses_v2';
const STORAGE_GROUPS_KEY = 'hallyu_store_groups_v2';
const STORAGE_SNAPSHOTS_KEY = 'hallyu_store_snapshots_v2';

export default function App() {
  // Load groups from LocalStorage or default initial KPOP_GROUPS
  const [groups, setGroups] = useState<KPopGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GROUPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse groups from localStorage', e);
    }
    return KPOP_GROUPS;
  });

  // Load expenses from LocalStorage or default initial dataset
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EXPENSES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse expenses from localStorage', e);
    }
    return INITIAL_EXPENSES;
  });

  // History Snapshots for Rollback
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse snapshots from localStorage', e);
    }
    return [];
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('zh-TW', { hour12: false });
  });

  const [currentTab, setCurrentTab] = useState<'overview' | 'ledger' | 'barcodes' | 'groups' | 'calculator' | 'overhead' | 'storage'>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeGroupViewId, setActiveGroupViewId] = useState<string>('blackpink');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultGroup, setAddModalDefaultGroup] = useState<string | undefined>(undefined);
  const [addModalInitialBarcode, setAddModalInitialBarcode] = useState<string | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  // Barcode Scanner Modal state
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerInitialBarcode, setScannerInitialBarcode] = useState<string | undefined>(undefined);

  // Group modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KPopGroup | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const handleOpenScanner = useCallback((barcodeOrId?: string) => {
    setScannerInitialBarcode(barcodeOrId);
    setIsScannerModalOpen(true);
  }, []);

  // Keyboard shortcut listener: F2 or Ctrl+B / Cmd+B to toggle barcode scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'F2') {
        e.preventDefault();
        setIsScannerModalOpen(prev => !prev);
      } else if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsScannerModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to create a snapshot
  const saveSnapshot = useCallback((description: string, customExpenses?: ExpenseItem[]) => {
    const listToSave = customExpenses || expenses;
    const newSnapshot: HistorySnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
      description,
      itemCount: listToSave.length,
      expenses: listToSave,
    };
    setSnapshots(prev => [newSnapshot, ...prev.slice(0, 9)]); // Keep latest 10
  }, [expenses]);

  // Sync expenses to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
      setLastSavedTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    } catch (e) {
      console.error('Failed to persist expenses to localStorage', e);
    }
  }, [expenses]);

  // Sync groups to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
    } catch (e) {
      console.error('Failed to persist groups to localStorage', e);
    }
  }, [groups]);

  // Sync snapshots to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed to persist snapshots to localStorage', e);
    }
  }, [snapshots]);

  // Financial aggregates
  const summary = useMemo(() => calculateStoreSummary(expenses), [expenses]);
  const groupStats = useMemo(() => calculateGroupBreakdowns(expenses, groups), [expenses, groups]);
  const categoryStats = useMemo(() => calculateCategoryBreakdown(expenses), [expenses]);

  // Handlers for Expenses
  const handleAddExpense = (newItem: ExpenseItem) => {
    saveSnapshot(`新增開銷：${newItem.title}`);
    setExpenses(prev => [newItem, ...prev]);
    showToast(`已成功記錄並儲存開銷：「${newItem.title}」`);
  };

  const handleUpdateExpense = (updated: ExpenseItem) => {
    setExpenses(prev => prev.map(item => item.id === updated.id ? updated : item));
    showToast(`已更新並儲存「${updated.title}」`);
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find(i => i.id === id);
    if (!target) return;
    if (window.confirm(`確定要刪除「${target.title}」這筆記錄嗎？`)) {
      saveSnapshot(`刪除開銷：${target.title}`);
      setExpenses(prev => prev.filter(i => i.id !== id));
      showToast(`已刪除「${target.title}」`);
    }
  };

  const handleQuickSell = (id: string, delta: number = 1) => {
    setExpenses(prev => prev.map(item => {
      if (item.id === id) {
        const available = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
        if (available >= delta) {
          const newSold = item.soldQuantity + delta;
          return { ...item, soldQuantity: newSold };
        }
      }
      return item;
    }));
    const target = expenses.find(i => i.id === id);
    if (target) {
      showToast(`門市售出 1 件「${target.title}」，庫存已即時更新存檔！`);
    }
  };

  // Batch Handlers
  const handleBatchUpdateStatus = (ids: string[], status: PaymentStatus) => {
    const statusLabel = status === 'paid' ? '已付款' : '待結算';
    saveSnapshot(`批次標記 ${ids.length} 筆為${statusLabel}`);
    setExpenses(prev => prev.map(item => {
      if (ids.includes(item.id)) {
        return { ...item, paymentStatus: status };
      }
      return item;
    }));
    showToast(`已成功批次更新 ${ids.length} 筆項目為「${statusLabel}」！`);
  };

  const handleBatchDelete = (ids: string[]) => {
    saveSnapshot(`批次刪除 ${ids.length} 筆項目`);
    setExpenses(prev => prev.filter(item => !ids.includes(item.id)));
    showToast(`已批次刪除 ${ids.length} 筆記錄！`);
  };

  const handleBatchMarkup = (ids: string[], multiplier: number) => {
    saveSnapshot(`批次調整 ${ids.length} 筆售價`);
    setExpenses(prev => prev.map(item => {
      if (ids.includes(item.id) && item.targetRetailPriceTWD > 0) {
        const newPrice = Math.round(item.targetRetailPriceTWD * multiplier);
        return { ...item, targetRetailPriceTWD: newPrice };
      }
      return item;
    }));
    showToast(`已完成 ${ids.length} 筆商品售價批次調整！`);
  };

  // Handlers for K-Pop Groups
  const handleSaveGroup = (groupData: KPopGroup) => {
    const exists = groups.some(g => g.id === groupData.id);
    if (exists) {
      setGroups(prev => prev.map(g => g.id === groupData.id ? groupData : g));
      showToast(`已更新偶像團體「${groupData.name}」資料！`);
    } else {
      setGroups(prev => [...prev, groupData]);
      showToast(`已成功新增偶像團體「${groupData.name}」！`);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const target = groups.find(g => g.id === groupId);
    if (!target) return;
    const count = expenses.filter(e => e.groupId === groupId).length;
    if (window.confirm(`確定要刪除「${target.name}」嗎？${count > 0 ? `注意：該團體下有 ${count} 筆周邊商品將變更為一般門市商品。` : ''}`)) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (count > 0) {
        setExpenses(prev => prev.map(e => e.groupId === groupId ? { ...e, groupId: 'store_general' } : e));
      }
      showToast(`已刪除偶像團體「${target.name}」`);
    }
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (window.confirm('確定要將所有開銷與偶像團體重設為預設的示範數據嗎？')) {
      saveSnapshot('重置為初始示範數據前備份');
      setExpenses(INITIAL_EXPENSES);
      setGroups(KPOP_GROUPS);
      setSelectedGroupId(null);
      setSelectedCategory(null);
      showToast('已重設為官方完整示範數據並自動存檔！');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const csvContent = exportExpensesToCSV(expenses, groups);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `kpop_store_expenses_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('報表 CSV 已成功匯出並下載！');
    } catch (e) {
      console.error(e);
      showToast('匯出失敗，請重試');
    }
  };

  // Export Full JSON Backup
  const handleExportBackup = () => {
    try {
      const backupData: StoreBackupData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        expenses,
        groups,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `hallyu_kpop_store_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('完整 JSON 備份檔已成功儲存並下載！');
    } catch (e) {
      console.error(e);
      showToast('備份匯出失敗');
    }
  };

  // Import Full JSON Backup
  const handleImportBackup = (backup: StoreBackupData) => {
    saveSnapshot('匯入新備份前自動備份');
    if (backup.expenses && Array.isArray(backup.expenses)) {
      setExpenses(backup.expenses);
    }
    if (backup.groups && Array.isArray(backup.groups)) {
      setGroups(backup.groups);
    }
    showToast(`成功還原備份檔！已載入 ${backup.expenses.length} 筆進貨與 ${backup.groups?.length || 0} 個偶像團體。`);
    setCurrentTab('ledger');
  };

  // Restore Snapshot
  const handleRestoreSnapshot = (snapshotId: string) => {
    const snap = snapshots.find(s => s.id === snapshotId);
    if (!snap) return;
    saveSnapshot(`還原至歷史快照「${snap.description}」前保存`);
    setExpenses(snap.expenses);
    showToast(`已成功還原至快照版本：「${snap.description}」！`);
  };

  const handleAddCalculatedItem = (partialItem: Partial<ExpenseItem>) => {
    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: partialItem.title || '周邊採購',
      groupId: partialItem.groupId || 'blackpink',
      category: partialItem.category || 'album_physical',
      date: partialItem.date || new Date().toISOString().split('T')[0],
      quantity: partialItem.quantity || 1,
      unitWholesaleKRW: partialItem.unitWholesaleKRW || 0,
      exchangeRate: partialItem.exchangeRate || 0.024,
      baseCostTWD: partialItem.baseCostTWD || 0,
      shippingCostTWD: partialItem.shippingCostTWD || 0,
      customsTaxTWD: partialItem.customsTaxTWD || 0,
      packagingCostTWD: partialItem.packagingCostTWD || 0,
      totalCostTWD: partialItem.totalCostTWD || 0,
      unitLandedCostTWD: partialItem.unitLandedCostTWD || 0,
      targetRetailPriceTWD: partialItem.targetRetailPriceTWD || 0,
      soldQuantity: 0,
      defectCount: 0,
      supplier: partialItem.supplier || '韓方代購',
      paymentStatus: 'paid',
      note: partialItem.note || '',
    };
    saveSnapshot(`由算式新增：${newItem.title}`);
    setExpenses(prev => [newItem, ...prev]);
    showToast(`試算項目「${newItem.title}」已成功新增至進貨帳冊！`);
    setCurrentTab('ledger');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar adhering to 3-zone contract */}
      <Navbar
        currentTab={currentTab}
        onTabChange={tab => setCurrentTab(tab as any)}
        onOpenAddModal={() => {
          setAddModalDefaultGroup('blackpink');
          setIsAddModalOpen(true);
        }}
        onOpenScanner={handleOpenScanner}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'overview' && (
          <DashboardOverview
            summary={summary}
            groupStats={groupStats}
            categoryStats={categoryStats}
            onSelectGroup={groupId => {
              setSelectedGroupId(groupId);
              setCurrentTab('ledger');
            }}
            onSelectCategory={cat => {
              setSelectedCategory(cat);
              setCurrentTab('ledger');
            }}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenCalculator={() => setCurrentTab('calculator')}
            onOpenBarcodes={() => setCurrentTab('barcodes')}
          />
        )}

        {currentTab === 'ledger' && (
          <ExpenseLedger
            expenses={expenses}
            groups={groups}
            selectedGroupId={selectedGroupId}
            selectedCategory={selectedCategory}
            onClearFilters={() => {
              setSelectedGroupId(null);
              setSelectedCategory(null);
            }}
            onSelectGroup={setSelectedGroupId}
            onSelectCategory={setSelectedCategory}
            onEditExpense={setEditingItem}
            onDeleteExpense={handleDeleteExpense}
            onQuickSell={handleQuickSell}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanner={handleOpenScanner}
            onUpdateExpense={handleUpdateExpense}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onBatchDelete={handleBatchDelete}
            onBatchMarkup={handleBatchMarkup}
          />
        )}

        {currentTab === 'barcodes' && (
          <BarcodeManagerView
            expenses={expenses}
            groups={groups}
            onUpdateExpense={handleUpdateExpense}
            onOpenScanner={handleOpenScanner}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {currentTab === 'groups' && (
          <GroupBreakdownView
            groups={groups}
            expenses={expenses}
            selectedGroupId={activeGroupViewId}
            onSelectGroup={setActiveGroupViewId}
            onQuickSell={handleQuickSell}
            onEditExpense={setEditingItem}
            onOpenAddForGroup={groupId => {
              setAddModalDefaultGroup(groupId);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {currentTab === 'calculator' && (
          <CostCalculator
            groups={groups}
            onAddCalculatedItem={handleAddCalculatedItem}
          />
        )}

        {currentTab === 'overhead' && (
          <StoreOverheadView
            expenses={expenses}
            onOpenAddModal={() => {
              setAddModalDefaultGroup('store_general');
              setIsAddModalOpen(true);
            }}
            onEditExpense={setEditingItem}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentTab === 'storage' && (
          <DataStorageManager
            expenses={expenses}
            groups={groups}
            snapshots={snapshots}
            lastSavedTime={lastSavedTime}
            onSaveManualSnapshot={(desc) => {
              saveSnapshot(desc);
              showToast(`已儲存版本快照：「${desc}」`);
            }}
            onRestoreSnapshot={handleRestoreSnapshot}
            onImportBackup={handleImportBackup}
            onExportBackup={handleExportBackup}
            onResetAllData={handleResetData}
            onOpenAddGroup={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
            onEditGroup={(grp) => {
              setEditingGroup(grp);
              setIsGroupModalOpen(true);
            }}
            onDeleteGroup={handleDeleteGroup}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>HallyuGroove 韓流唱片庫 · 實體門市進銷存與開銷管家</span>
            <span className="ml-2 font-mono text-[11px] text-emerald-400 font-semibold">● 資料持久化儲存與修改運行中</span>
          </div>
          <div className="flex items-center gap-3">
            <span>BLACKPINK</span>
            <span aria-hidden="true">·</span>
            <span>BABYMONSTER</span>
            <span aria-hidden="true">·</span>
            <span>ATEEZ</span>
            <span aria-hidden="true">·</span>
            <span>官方手燈 / 特典小卡 / 專輯 / 平台專 / 玩偶娃娃</span>
          </div>
        </div>
      </footer>

      {/* Add Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalInitialBarcode(undefined);
        }}
        onAdd={handleAddExpense}
        groups={groups}
        defaultGroupId={addModalDefaultGroup}
        initialBarcode={addModalInitialBarcode}
      />

      {/* Edit Modal */}
      <EditExpenseModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onUpdate={handleUpdateExpense}
        item={editingItem}
        groups={groups}
      />

      {/* Barcode Scanner & Stock Verification Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => {
          setIsScannerModalOpen(false);
          setScannerInitialBarcode(undefined);
        }}
        expenses={expenses}
        groups={groups}
        initialBarcode={scannerInitialBarcode}
        onQuickSell={handleQuickSell}
        onUpdateExpense={handleUpdateExpense}
        onOpenAddModalWithBarcode={(scannedCode) => {
          setIsScannerModalOpen(false);
          setScannerInitialBarcode(undefined);
          setAddModalInitialBarcode(scannedCode);
          setIsAddModalOpen(true);
        }}
      />

      {/* Group Add/Edit Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={handleSaveGroup}
        groupToEdit={editingGroup}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
