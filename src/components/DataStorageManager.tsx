import React, { useState, useRef } from 'react';
import { ExpenseItem, KPopGroup, StoreBackupData, HistorySnapshot } from '../types/store';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Clock, 
  ShieldCheck, 
  FileJson,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface DataStorageManagerProps {
  expenses: ExpenseItem[];
  groups: KPopGroup[];
  snapshots: HistorySnapshot[];
  lastSavedTime: string;
  onSaveManualSnapshot: (description: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onImportBackup: (backup: StoreBackupData) => void;
  onExportBackup: () => void;
  onResetAllData: () => void;
  onOpenAddGroup: () => void;
  onEditGroup: (group: KPopGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const DataStorageManager: React.FC<DataStorageManagerProps> = ({
  expenses,
  groups,
  snapshots,
  lastSavedTime,
  onSaveManualSnapshot,
  onRestoreSnapshot,
  onImportBackup,
  onExportBackup,
  onResetAllData,
  onOpenAddGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // File import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.expenses || !Array.isArray(parsed.expenses)) {
          setImportError('檔案格式不正確，缺少開銷資料陣列 (expenses)。');
          return;
        }

        setImportError(null);
        if (window.confirm(`確認要匯入此備份檔嗎？將載入 ${parsed.expenses.length} 筆進貨開銷與 ${parsed.groups?.length || 0} 個偶像團體！`)) {
          onImportBackup(parsed);
        }
      } catch (err) {
        console.error(err);
        setImportError('JSON 檔案解析失敗，請確認檔案為合法的備份 JSON。');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotDesc.trim()) return;
    onSaveManualSnapshot(snapshotDesc.trim());
    setSnapshotDesc('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Database className="h-6 w-6 text-pink-500" />
          <span>資料儲存與修改管理中心</span>
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          全自動持久化儲存、偶像團體資料修改、JSON 備份匯入匯出與歷史版本復原
        </p>
      </div>

      {/* Storage Status & Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Storage Health */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>本機持久化儲存運行中</span>
            </span>
            <span className="font-mono text-[11px] text-neutral-500">v1.2 Local-First</span>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {expenses.length} <span className="text-xs text-neutral-400 font-normal">筆開銷記錄</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              收錄 <strong className="text-neutral-200">{groups.length}</strong> 個偶像團體與周邊專區
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-neutral-500" />
              <span>最後自動儲存：</span>
            </span>
            <span className="font-mono text-neutral-300">{lastSavedTime}</span>
          </div>
        </div>

        {/* Card 2: JSON Backup Export */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <FileJson className="h-4 w-4 text-pink-400" />
              <span>完整資料庫備份匯出</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              將所有進貨記錄、批價、空運關稅與偶像團體資料完整導出為標準 JSON 檔，可保存在隨身碟或異地電腦。
            </p>
          </div>

          <button
            onClick={onExportBackup}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white py-2 px-3 text-xs font-semibold transition-colors"
          >
            <Download className="h-4 w-4 text-pink-400" />
            <span>匯出完整 JSON 備份檔</span>
          </button>
        </div>

        {/* Card 3: JSON Backup Import */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <Upload className="h-4 w-4 text-sky-400" />
              <span>匯入已儲存的備份檔</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              支援從本機選取先前匯出的 JSON 檔進行資料還原或跨電腦同步載入。
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 py-2 px-3 text-xs font-semibold transition-colors"
            >
              <Upload className="h-4 w-4 text-sky-400" />
              <span>選取 JSON 檔案還原</span>
            </button>
          </div>
        </div>
      </div>

      {importError && (
        <div className="rounded-lg border border-red-800/80 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{importError}</span>
        </div>
      )}

      {/* K-Pop Group Management Section */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-pink-400" />
              <span>偶像團體資料管理 (可新增、修改與刪除)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              修改團體名稱、韓文代碼、所屬經紀公司、官方粉絲名稱與品牌代表色
            </p>
          </div>

          <button
            onClick={onOpenAddGroup}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-500 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>+ 新增偶像團體</span>
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {groups.map(group => {
            const count = expenses.filter(e => e.groupId === group.id).length;
            const isDefaultGeneral = group.id === 'store_general';

            return (
              <div
                key={group.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.colorAccent }}
                    />
                    <h3 className="text-sm font-bold text-white truncate">
                      {group.name}
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      ({group.koreanName})
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 truncate">
                    {group.agency} · {group.fandomName}
                  </div>

                  <div className="text-[11px] font-mono text-neutral-400">
                    已建檔 {count} 筆進貨項目
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditGroup(group)}
                    title="修改團體資料"
                    className="rounded p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  {!isDefaultGeneral && (
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      title="刪除此團體"
                      className="rounded p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Snapshots & Rollback History */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-emerald-400" />
              <span>修改歷史快照與防呆還原 (Undo / Rollback)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              每次進行大幅修改或批次操作時，系統自動或手動建立版本快照，誤刪改錯可隨時一鍵復原！
            </p>
          </div>
        </div>

        {/* Manual snapshot form */}
        <form onSubmit={handleCreateSnapshot} className="flex gap-2">
          <input
            type="text"
            value={snapshotDesc}
            onChange={e => setSnapshotDesc(e.target.value)}
            placeholder="輸入快照備註說明 (例: 批次調價前備份 / 9月首爾大批進貨後保存)..."
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!snapshotDesc.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-emerald-400" />
            <span>儲存手動快照</span>
          </button>
        </form>

        {/* Snapshots list */}
        <div className="divide-y divide-neutral-800/80 rounded-lg border border-neutral-800 bg-neutral-950/60 overflow-hidden">
          {snapshots.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-500">
              尚無儲存快照，進行進貨修改或點擊上方建立手動存檔！
            </div>
          ) : (
            snapshots.map(snap => (
              <div
                key={snap.id}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-neutral-900/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white">
                    {snap.description}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                    <span>{snap.timestamp}</span>
                    <span aria-hidden="true">·</span>
                    <span>共 {snap.itemCount} 筆項目</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`確定要將資料還原至此快照「${snap.description}」嗎？現有資料將被該歷史版本取代。`)) {
                      onRestoreSnapshot(snap.id);
                    }
                  }}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                >
                  還原此版本
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            <span>重置所有資料為官方初始示範狀態</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            若想清空所有自訂修改，重新載入包含 BLACKPINK、BABYMONSTER、ATEEZ 等天團的完整進貨示範帳冊，可點擊此按鈕。
          </p>
        </div>

        <button
          onClick={onResetAllData}
          className="rounded-lg border border-red-800 bg-red-950/40 hover:bg-red-900/50 text-red-300 px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          重置示範數據
        </button>
      </div>
    </div>
  );
};
