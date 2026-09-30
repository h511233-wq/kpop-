import React, { useState } from 'react';
import { ExpenseItem, KPopGroup, MerchCategory, PaymentStatus } from '../types/store';
import { generateRandomBarcode } from '../utils/barcode';
import { BarcodeBadge } from './BarcodeBadge';
import { X, Plus, Calculator, Package, Barcode, Sparkles } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: ExpenseItem) => void;
  groups: KPopGroup[];
  defaultGroupId?: string;
  initialBarcode?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  groups,
  defaultGroupId,
  initialBarcode,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode || generateRandomBarcode());
  const [groupId, setGroupId] = useState(defaultGroupId || 'blackpink');
  const [category, setCategory] = useState<MerchCategory>('album_physical');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(50);
  const [wholesaleKRW, setWholesaleKRW] = useState(19000);
  const [exchangeRate, setExchangeRate] = useState(0.024);
  const [shippingTWD, setShippingTWD] = useState(4500);
  const [customsTWD, setCustomsTWD] = useState(1200);
  const [packagingTWD, setPackagingTWD] = useState(500);
  const [targetRetailPrice, setTargetRetailPrice] = useState(790);
  const [supplier, setSupplier] = useState('KTOWN4U Wholesale');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [note, setNote] = useState('');

  const isOverhead = [
    'store_rent_overhead',
    'staff_payroll',
    'packaging_supplies',
    'event_marketing',
    'logistics_customs',
  ].includes(category);

  // Computed base cost
  const baseCostTWD = wholesaleKRW > 0 
    ? Math.round(wholesaleKRW * exchangeRate * quantity) 
    : 0;

  const totalCostTWD = baseCostTWD + shippingTWD + customsTWD + packagingTWD;
  const unitLandedCostTWD = quantity > 0 ? Math.round(totalCostTWD / quantity) : totalCostTWD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      barcode: barcode.trim() || undefined,
      groupId,
      category,
      date,
      quantity,
      unitWholesaleKRW: wholesaleKRW,
      exchangeRate,
      baseCostTWD,
      shippingCostTWD: shippingTWD,
      customsTaxTWD: customsTWD,
      packagingCostTWD: packagingTWD,
      totalCostTWD,
      unitLandedCostTWD,
      targetRetailPriceTWD: isOverhead ? 0 : targetRetailPrice,
      soldQuantity: 0,
      defectCount: 0,
      supplier: supplier.trim(),
      paymentStatus,
      note: note.trim(),
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-600/20 text-pink-400">
              <Plus className="h-4 w-4 stroke-[3]" />
            </div>
            <h2 className="text-lg font-bold text-white">登記新進貨開銷與支出</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                品項名稱 / 開銷說明 *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如: BLACKPINK 應援手燈 Ver.2 / BABYMONSTER 寫真專 / ATEEZ 娃娃"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                偶像團體 / 門市類別
              </label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                開銷品類
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as MerchCategory)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              >
                <option value="lightstick">官方應援手燈 (Lightstick)</option>
                <option value="photocard">特典小卡 / 簽售卡 (Photocards)</option>
                <option value="album_physical">實體專輯 (Photobook/Digipack)</option>
                <option value="album_digital">電子專 / 平台專 (Nemo/SMini)</option>
                <option value="plush_doll">偶像娃娃 / 毛絨吊飾 (10cm/20cm)</option>
                <option value="other_merch">官方周邊 (卡冊/立牌/應援物)</option>
                <option value="logistics_customs">國際空運與進口關稅</option>
                <option value="store_rent_overhead">門市店租與水電</option>
                <option value="packaging_supplies">包材與硬卡套耗材</option>
                <option value="staff_payroll">門市薪資與工讀生</option>
                <option value="event_marketing">回歸打卡應援佈置</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                進貨 / 支出日期
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Barcode Setting & Generation (for merchandise items) */}
          {!isOverhead && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Barcode className="h-4 w-4 text-pink-400" />
                  <span>商品專屬條碼 (支援手動輸入、條碼機直接刷入或自動生成)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setBarcode(generateRandomBarcode())}
                  className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>自動生成韓國 EAN-13 條碼</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="可直接使用條碼機扣板機刷入，或輸入自訂條碼 (如: 8809999441012)..."
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono tracking-wider text-white focus:border-pink-500 focus:outline-none"
                />
                {barcode && (
                  <button
                    type="button"
                    onClick={() => setBarcode('')}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                  >
                    清除
                  </button>
                )}
              </div>

              {barcode && (
                <div className="pt-1 flex items-center gap-3">
                  <span className="text-[11px] text-neutral-500">條碼貼紙預覽：</span>
                  <BarcodeBadge barcode={barcode} showVisualBars={true} size="sm" />
                </div>
              )}
            </div>
          )}

          {/* Financials & Costs */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
            <div className="text-xs font-semibold text-neutral-300">
              進貨數量與成本拆解
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">採購件數</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">韓幣單價 (KRW)</label>
                <input
                  type="number"
                  value={wholesaleKRW}
                  onChange={e => setWholesaleKRW(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">國際空運費 (TWD)</label>
                <input
                  type="number"
                  value={shippingTWD}
                  onChange={e => setShippingTWD(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">海關稅與包材 (TWD)</label>
                <input
                  type="number"
                  value={customsTWD + packagingTWD}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setCustomsTWD(Math.round(val * 0.7));
                    setPackagingTWD(Math.round(val * 0.3));
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live calculation banner */}
            <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2 text-xs">
              <span className="text-neutral-400">
                單件到手成本: <strong className="text-pink-400 font-mono">NT$ {unitLandedCostTWD}</strong>
              </span>
              <span className="text-neutral-400">
                本批總支出開銷: <strong className="text-white font-mono text-sm">NT$ {totalCostTWD.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Pricing & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                預估門市售價 (NT$)
              </label>
              <input
                type="number"
                disabled={isOverhead}
                value={isOverhead ? 0 : targetRetailPrice}
                onChange={e => setTargetRetailPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:border-pink-500 focus:outline-none disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                採購供應商 / 渠道
              </label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="例如: YG SELECT, KTOWN4U, WITHMUU..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                付款狀態
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              >
                <option value="paid">已付清</option>
                <option value="pending">待結算 / 欠款</option>
                <option value="cod">貨到付款 (COD)</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              備註說明 (選填)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="例如: 附贈預購特典卡、首批海報筒、韓國快遞單號..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-pink-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-600/30 hover:bg-pink-500 transition-colors"
            >
              確認記錄開銷
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
