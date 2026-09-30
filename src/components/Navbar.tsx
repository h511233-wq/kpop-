import React from 'react';
import { Plus, Download, RefreshCw, Disc3, Barcode } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  onExportCSV,
  onResetData,
  onOpenScanner,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/30">
            <Disc3 className="h-4.5 w-4.5 animate-[spin_8s_linear_infinite]" />
          </div>
          <button
            onClick={() => onTabChange('overview')}
            className="text-left text-lg font-bold tracking-tight text-white hover:text-pink-400 transition-colors"
          >
            HallyuGroove 韓流唱片庫
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => onTabChange('overview')}
            className={`transition-colors hover:text-white pb-0.5 ${
              currentTab === 'overview'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            營運大盤
          </button>
          <button
            onClick={() => onTabChange('ledger')}
            className={`transition-colors hover:text-white pb-0.5 ${
              currentTab === 'ledger'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            進貨開銷明細
          </button>
          <button
            onClick={() => onTabChange('barcodes')}
            className={`transition-colors hover:text-white pb-0.5 flex items-center gap-1.5 ${
              currentTab === 'barcodes'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400 hover:text-pink-300'
            }`}
          >
            <Barcode className="h-3.5 w-3.5 text-pink-400" />
            <span>各商品條碼建立</span>
          </button>
          <button
            onClick={() => onTabChange('groups')}
            className={`transition-colors hover:text-white pb-0.5 ${
              currentTab === 'groups'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            偶像團體專區
          </button>
          <button
            onClick={() => onTabChange('calculator')}
            className={`transition-colors hover:text-white pb-0.5 ${
              currentTab === 'calculator'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            成本定價算式
          </button>
          <button
            onClick={() => onTabChange('overhead')}
            className={`transition-colors hover:text-white pb-0.5 ${
              currentTab === 'overhead'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            固定與雜費
          </button>
          <button
            onClick={() => onTabChange('storage')}
            className={`transition-colors hover:text-white pb-0.5 ${
              currentTab === 'storage'
                ? 'text-white border-b-2 border-pink-500 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            資料儲存與修改
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              title="開啟商品條碼掃描與庫存確認系統 (支援實體掃描槍)"
              className="flex items-center gap-1.5 rounded-lg border border-pink-500/40 bg-pink-950/40 px-3 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-900/60 hover:text-white transition-all shadow-sm"
            >
              <Barcode className="h-4 w-4 text-pink-400" />
              <span>條碼掃描盤點</span>
            </button>
          )}

          <button
            onClick={onResetData}
            title="重設為示範進貨數據"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>重置數據</span>
          </button>

          <button
            onClick={onExportCSV}
            title="匯出為 Excel / CSV 報表"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-pink-400" />
            <span>匯出報表</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-500 transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>記一筆進貨開銷</span>
          </button>
        </div>
      </div>
    </header>
  );
};
