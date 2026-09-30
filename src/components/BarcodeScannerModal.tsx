import React, { useState, useEffect, useRef } from 'react';
import { ExpenseItem, KPopGroup } from '../types/store';
import { CATEGORY_LABELS } from '../data/initialData';
import { BarcodeBadge } from './BarcodeBadge';
import { generateRandomBarcode } from '../utils/barcode';
import { 
  Barcode, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  Plus, 
  Edit3, 
  Printer, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Check, 
  Sparkles,
  Layers,
  Camera,
  ArrowRight
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  groups: KPopGroup[];
  initialBarcode?: string;
  onQuickSell: (id: string, delta: number) => void;
  onUpdateExpense: (item: ExpenseItem) => void;
  onOpenAddModalWithBarcode?: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  expenses,
  groups,
  initialBarcode,
  onQuickSell,
  onUpdateExpense,
  onOpenAddModalWithBarcode,
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [matchedItem, setMatchedItem] = useState<ExpenseItem | null>(null);
  const [searchHistory, setSearchHistory] = useState<ExpenseItem[]>([]);
  const [isBindingOpen, setIsBindingOpen] = useState(false);
  const [selectedItemToBind, setSelectedItemToBind] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'warn' | 'info'; text: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Edit barcode state
  const [isEditingBarcode, setIsEditingBarcode] = useState(false);
  const [customBarcodeVal, setCustomBarcodeVal] = useState('');

  // Print label preview state
  const [showPrintLabel, setShowPrintLabel] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // Beep sound generator using Web Audio API
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime); // A5 or E4
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  // Auto focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialBarcode) {
        setScannedCode(initialBarcode);
        handleLookup(initialBarcode);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setScannedCode('');
      setMatchedItem(null);
      setFeedbackMsg(null);
      setIsBindingOpen(false);
      setIsEditingBarcode(false);
      setShowPrintLabel(false);
    }
  }, [isOpen, initialBarcode]);

  if (!isOpen) return null;

  const handleLookup = (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim();
    if (!cleanCode) return;

    // Search for match in expenses by barcode or fallback to exact title/ID
    const found = expenses.find(
      i => (i.barcode && i.barcode.trim() === cleanCode) || i.id === cleanCode
    );

    if (found) {
      setMatchedItem(found);
      setCustomBarcodeVal(found.barcode || cleanCode);
      setIsBindingOpen(false);
      setIsEditingBarcode(false);
      playBeep(true);
      setFeedbackMsg({
        type: 'success',
        text: `掃描成功！已鎖定：${found.title}`,
      });
      // Add to search history without duplicates at the top
      setSearchHistory(prev => [found, ...prev.filter(x => x.id !== found.id)].slice(0, 5));
    } else {
      setMatchedItem(null);
      playBeep(false);
      setFeedbackMsg({
        type: 'warn',
        text: `條碼「${cleanCode}」尚未建檔！可直接指定綁定現有商品，或以此條碼新增商品。`,
      });
      setIsBindingOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup(scannedCode);
    }
  };

  const handleQuickSellAction = () => {
    if (!matchedItem) return;
    const inStock = Math.max(0, matchedItem.quantity - matchedItem.soldQuantity - matchedItem.defectCount);
    if (inStock <= 0) {
      setFeedbackMsg({ type: 'warn', text: '此商品在庫庫存為 0，無法繼續售出！' });
      return;
    }
    onQuickSell(matchedItem.id, 1);
    playBeep(true);
    // Update local matched item state
    const updated = { ...matchedItem, soldQuantity: matchedItem.soldQuantity + 1 };
    setMatchedItem(updated);
    setFeedbackMsg({ type: 'success', text: `已成功售出 1 件！現貨剩餘 ${inStock - 1} 件。` });
  };

  const handleStockVerifyAction = () => {
    if (!matchedItem) return;
    playBeep(true);
    setFeedbackMsg({
      type: 'success',
      text: `✓ 條碼與實物庫存核對無誤！(現存 ${Math.max(0, matchedItem.quantity - matchedItem.soldQuantity - matchedItem.defectCount)} 件)`,
    });
  };

  const handleSaveBarcode = () => {
    if (!matchedItem || !customBarcodeVal.trim()) return;
    const updated: ExpenseItem = {
      ...matchedItem,
      barcode: customBarcodeVal.trim(),
    };
    onUpdateExpense(updated);
    setMatchedItem(updated);
    setIsEditingBarcode(false);
    playBeep(true);
    setFeedbackMsg({
      type: 'success',
      text: `條碼已更新儲存為：${customBarcodeVal.trim()}`,
    });
  };

  const handleBindToExisting = () => {
    if (!scannedCode.trim() || !selectedItemToBind) return;
    const target = expenses.find(i => i.id === selectedItemToBind);
    if (!target) return;

    const updated: ExpenseItem = {
      ...target,
      barcode: scannedCode.trim(),
    };
    onUpdateExpense(updated);
    setMatchedItem(updated);
    setCustomBarcodeVal(scannedCode.trim());
    setIsBindingOpen(false);
    playBeep(true);
    setFeedbackMsg({
      type: 'success',
      text: `已將條碼「${scannedCode.trim()}」成功綁定至商品「${target.title}」！`,
    });
  };

  const currentGroup = matchedItem ? groupMap.get(matchedItem.groupId) : null;
  const inStock = matchedItem 
    ? Math.max(0, matchedItem.quantity - matchedItem.soldQuantity - matchedItem.defectCount) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600/20 text-pink-400">
              <Barcode className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>條碼掃描與門市庫存盤點終端</span>
                <span className="rounded bg-pink-950 border border-pink-800 px-1.5 py-0.2 text-[10px] text-pink-300 font-mono font-normal">
                  USB/藍牙掃描槍專用
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                支援手持條碼機自動感應、相機掃描或手動輸入 EAN-13 / 官網條碼快速查庫存
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? '靜音掃描提示音' : '開啟掃描提示音'}
              className="rounded-lg p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Barcode Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300">
              條碼槍讀取區 (請將條碼機對準包裝條碼扣板機，或直接手動鍵入條碼)：
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={scannedCode}
                  onChange={e => setScannedCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="掃描條碼 (例如: 8809999441012、8804775258909)..."
                  className="w-full rounded-xl border border-pink-500/50 bg-neutral-950 py-3 pl-11 pr-4 text-sm font-mono tracking-wider text-white shadow-inner focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookup(scannedCode)}
                disabled={!scannedCode.trim()}
                className="rounded-xl bg-pink-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-pink-600/30 hover:bg-pink-500 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                查詢
              </button>
            </div>

            {/* Quick Demo Barcode Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px] text-neutral-400">
              <span className="text-neutral-500 shrink-0">示範快速測試：</span>
              {expenses.filter(e => e.barcode).slice(0, 4).map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setScannedCode(e.barcode || '');
                    handleLookup(e.barcode || '');
                  }}
                  className="rounded border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 hover:text-white px-2 py-0.5 font-mono text-neutral-300 transition-colors whitespace-nowrap"
                >
                  {e.barcode} ({e.title.slice(0, 8)}...)
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Status Toast Banner */}
          {feedbackMsg && (
            <div
              className={`rounded-xl border p-3.5 text-xs flex items-center gap-2.5 ${
                feedbackMsg.type === 'success'
                  ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                  : feedbackMsg.type === 'warn'
                  ? 'border-amber-800 bg-amber-950/40 text-amber-300'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300'
              }`}
            >
              {feedbackMsg.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
              {feedbackMsg.type === 'warn' && <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />}
              <span className="font-medium">{feedbackMsg.text}</span>
            </div>
          )}

          {/* Scanned & Matched Product View */}
          {matchedItem && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 space-y-4 shadow-lg animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {currentGroup && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: currentGroup.colorAccent }}
                      />
                    )}
                    <span className="text-xs font-semibold text-neutral-400">
                      {currentGroup?.name || matchedItem.groupId}
                    </span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-xs text-pink-400 font-medium">
                      {CATEGORY_LABELS[matchedItem.category]?.short || matchedItem.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {matchedItem.title}
                  </h3>
                  <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2">
                    <span>進貨日: {matchedItem.date}</span>
                    <span>·</span>
                    <span>渠道: {matchedItem.supplier}</span>
                  </div>
                </div>

                {/* Visual Barcode Display */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <BarcodeBadge
                    barcode={matchedItem.barcode}
                    showVisualBars={true}
                    size="sm"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingBarcode(!isEditingBarcode)}
                      className="text-[11px] text-pink-400 hover:text-pink-300 underline"
                    >
                      {isEditingBarcode ? '收起修改' : '修改條碼編號'}
                    </button>
                    <span className="text-neutral-600">·</span>
                    <button
                      type="button"
                      onClick={() => setShowPrintLabel(!showPrintLabel)}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      <span>列印貼紙</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Barcode inline box */}
              {isEditingBarcode && (
                <div className="p-3 rounded-xl border border-pink-500/30 bg-pink-950/20 space-y-2">
                  <div className="text-xs font-semibold text-pink-300">
                    自行修改此商品的條碼 (支援手動輸入或隨機生成 EAN-13)：
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBarcodeVal}
                      onChange={e => setCustomBarcodeVal(e.target.value)}
                      placeholder="輸入新條碼..."
                      className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomBarcodeVal(generateRandomBarcode())}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 text-xs text-neutral-300 whitespace-nowrap"
                    >
                      🎲 自動生成
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBarcode}
                      className="rounded-lg bg-pink-600 hover:bg-pink-500 px-3.5 py-1.5 text-xs font-bold text-white whitespace-nowrap"
                    >
                      儲存新條碼
                    </button>
                  </div>
                </div>
              )}

              {/* Print Label Mock Preview */}
              {showPrintLabel && (
                <div className="p-4 rounded-xl border border-neutral-700 bg-neutral-900 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-semibold text-white">🖨️ 門市條碼價格標籤貼紙預覽</span>
                    <button
                      onClick={() => window.print()}
                      className="rounded bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 text-[11px] text-pink-400 font-semibold"
                    >
                      立即發送列印機
                    </button>
                  </div>

                  <div className="mx-auto w-64 bg-white text-black p-3 rounded shadow-md flex flex-col items-center border border-neutral-300">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-700">HallyuGroove K-POP Store</div>
                    <div className="text-xs font-bold text-center mt-1 truncate max-w-[220px]">{matchedItem.title}</div>
                    <div className="my-1.5">
                      <BarcodeBadge barcode={matchedItem.barcode} showVisualBars={true} size="md" />
                    </div>
                    <div className="flex items-baseline justify-between w-full px-2 border-t border-neutral-200 pt-1">
                      <span className="text-[10px] text-neutral-500 font-mono">KRW ₩{matchedItem.unitWholesaleKRW.toLocaleString()}</span>
                      <span className="text-sm font-black font-mono text-black">NT$ {matchedItem.targetRetailPriceTWD.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Inventory Data Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-[11px] text-neutral-400">門市庫存現貨</div>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${inStock <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {inStock} <span className="text-xs font-normal text-neutral-400">件</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    總進貨 {matchedItem.quantity} 件
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-[11px] text-neutral-400">已售出件數</div>
                  <div className="text-2xl font-black font-mono text-white mt-0.5">
                    {matchedItem.soldQuantity} <span className="text-xs font-normal text-neutral-400">件</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    瑕疵運損 {matchedItem.defectCount} 件
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-[11px] text-neutral-400">門市零售定價</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    NT$ {matchedItem.targetRetailPriceTWD.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-pink-400 mt-0.5">
                    單件獲利 +NT$ {matchedItem.targetRetailPriceTWD - matchedItem.unitLandedCostTWD}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                  <div className="text-[11px] text-neutral-400">實質到手成本</div>
                  <div className="text-xl font-bold font-mono text-neutral-300 mt-0.5">
                    NT$ {matchedItem.unitLandedCostTWD.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                    批價 ₩{matchedItem.unitWholesaleKRW.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quick Operation Actions */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleStockVerifyAction}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/50 bg-emerald-950/40 hover:bg-emerald-900/50 py-2.5 px-3 text-xs font-semibold text-emerald-300 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>盤點核對無誤</span>
                </button>

                {inStock > 0 && (
                  <button
                    type="button"
                    onClick={handleQuickSellAction}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 py-2.5 px-3 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>掃碼售出 1 件 (-1 庫存)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* If No Match Found: Bind or Create */}
          {isBindingOpen && scannedCode.trim() && (
            <div className="rounded-2xl border border-amber-800/60 bg-amber-950/15 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>將條碼「{scannedCode}」指定綁定至店內現有商品</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                您可以從下方下拉選單中挑選要與此條碼關聯的周邊商品，後續掃描此條碼即可秒查庫存：
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedItemToBind}
                  onChange={e => setSelectedItemToBind(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                >
                  <option value="">-- 挑選要綁定此條碼的商品 --</option>
                  {expenses.map(e => (
                    <option key={e.id} value={e.id}>
                      [{groupMap.get(e.groupId)?.name || e.groupId}] {e.title} (現有條碼: {e.barcode || '無'})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleBindToExisting}
                  disabled={!selectedItemToBind}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 px-4 py-2 text-xs font-bold text-white whitespace-nowrap transition-colors"
                >
                  確認綁定此條碼
                </button>
              </div>

              {onOpenAddModalWithBarcode && (
                <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">若是全新進貨品項：</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddModalWithBarcode(scannedCode);
                    }}
                    className="text-pink-400 hover:text-pink-300 font-semibold underline flex items-center gap-1"
                  >
                    <span>+ 以此條碼登記新商品進貨</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick History List */}
          {searchHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400">
                最近掃描查驗紀錄：
              </div>
              <div className="divide-y divide-neutral-800/60 rounded-xl border border-neutral-800 bg-neutral-950/40 overflow-hidden">
                {searchHistory.map(item => {
                  const stock = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setMatchedItem(item);
                        setCustomBarcodeVal(item.barcode || '');
                        setIsBindingOpen(false);
                      }}
                      className="p-2.5 flex items-center justify-between hover:bg-neutral-900/60 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-neutral-500 text-[11px]">{item.barcode || '無條碼'}</span>
                        <span className="text-white font-medium truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-emerald-400 font-semibold">庫存: {stock}</span>
                        <span className="text-neutral-400 font-mono">NT$ {item.targetRetailPriceTWD}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
