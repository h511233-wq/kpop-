import React, { useState, useEffect } from 'react';
import { ExpenseItem, KPopGroup, MerchCategory, PaymentStatus } from '../types/store';
import { generateRandomBarcode } from '../utils/barcode';
import { BarcodeBadge } from './BarcodeBadge';
import { X, Check, Barcode, Sparkles } from 'lucide-react';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (item: ExpenseItem) => void;
  item: ExpenseItem | null;
  groups: KPopGroup[];
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  item,
  groups,
}) => {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title);
  const [barcode, setBarcode] = useState(item.barcode || '');
  const [groupId, setGroupId] = useState(item.groupId);
  const [category, setCategory] = useState<MerchCategory>(item.category);
  const [date, setDate] = useState(item.date);
  const [quantity, setQuantity] = useState(item.quantity);
  const [soldQuantity, setSoldQuantity] = useState(item.soldQuantity);
  const [defectCount, setDefectCount] = useState(item.defectCount);
  const [unitWholesaleKRW, setUnitWholesaleKRW] = useState(item.unitWholesaleKRW);
  const [shippingCostTWD, setShippingCostTWD] = useState(item.shippingCostTWD);
  const [customsTaxTWD, setCustomsTaxTWD] = useState(item.customsTaxTWD);
  const [packagingCostTWD, setPackagingCostTWD] = useState(item.packagingCostTWD);
  const [targetRetailPriceTWD, setTargetRetailPriceTWD] = useState(item.targetRetailPriceTWD);
  const [supplier, setSupplier] = useState(item.supplier);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(item.paymentStatus);
  const [note, setNote] = useState(item.note || '');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setBarcode(item.barcode || '');
      setGroupId(item.groupId);
      setCategory(item.category);
      setDate(item.date);
      setQuantity(item.quantity);
      setSoldQuantity(item.soldQuantity);
      setDefectCount(item.defectCount);
      setUnitWholesaleKRW(item.unitWholesaleKRW);
      setShippingCostTWD(item.shippingCostTWD);
      setCustomsTaxTWD(item.customsTaxTWD);
      setPackagingCostTWD(item.packagingCostTWD);
      setTargetRetailPriceTWD(item.targetRetailPriceTWD);
      setSupplier(item.supplier);
      setPaymentStatus(item.paymentStatus);
      setNote(item.note || '');
    }
  }, [item]);

  const baseCostTWD = unitWholesaleKRW > 0 
    ? Math.round(unitWholesaleKRW * 0.024 * quantity) 
    : item.baseCostTWD;

  const totalCostTWD = baseCostTWD + shippingCostTWD + customsTaxTWD + packagingCostTWD;
  const unitLandedCostTWD = quantity > 0 ? Math.round(totalCostTWD / quantity) : totalCostTWD;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: ExpenseItem = {
      ...item,
      title: title.trim(),
      barcode: barcode.trim() || undefined,
      groupId,
      category,
      date,
      quantity,
      soldQuantity,
      defectCount,
      unitWholesaleKRW,
      baseCostTWD,
      shippingCostTWD,
      customsTaxTWD,
      packagingCostTWD,
      totalCostTWD,
      unitLandedCostTWD,
      targetRetailPriceTWD,
      supplier: supplier.trim(),
      paymentStatus,
      note: note.trim(),
    };

    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold text-white">編輯進貨開銷與庫存明細</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1">品項名稱 *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">所屬團體</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">品類</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as MerchCategory)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              >
                <option value="lightstick">官方應援手燈 (Lightstick)</option>
                <option value="photocard">特典小卡 / 簽售卡</option>
                <option value="album_physical">實體專輯</option>
                <option value="album_digital">電子專 / 平台專</option>
                <option value="plush_doll">偶像娃娃 / 毛絨玩偶</option>
                <option value="other_merch">官方周邊</option>
                <option value="logistics_customs">國際空運與海關稅金</option>
                <option value="store_rent_overhead">門市店租與水電</option>
                <option value="packaging_supplies">包材與硬卡套耗材</option>
                <option value="staff_payroll">門市薪資</option>
                <option value="event_marketing">回歸打卡應援佈置</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">支出日期</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Barcode editing section */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Barcode className="h-4 w-4 text-pink-400" />
                <span>商品條碼編號 (可手動修改、條碼槍刷入或自動生成)</span>
              </label>
              <button
                type="button"
                onClick={() => setBarcode(generateRandomBarcode())}
                className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300"
              >
                <Sparkles className="h-3 w-3" />
                <span>隨機生成 EAN-13 條碼</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="輸入商品條碼 (例如: 8809969440011)..."
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
                <span className="text-[11px] text-neutral-500">條碼圖樣：</span>
                <BarcodeBadge barcode={barcode} showVisualBars={true} size="sm" />
              </div>
            )}
          </div>

          {/* Quantities & Status */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-950/70 rounded-xl border border-neutral-800">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">進貨總量</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">已售出量</label>
              <input
                type="number"
                min="0"
                value={soldQuantity}
                onChange={e => setSoldQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">瑕疵/運損量</label>
              <input
                type="number"
                min="0"
                value={defectCount}
                onChange={e => setDefectCount(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-amber-400"
              />
            </div>
          </div>

          {/* Pricing & Supplier */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">原幣批價(KRW)</label>
              <input
                type="number"
                value={unitWholesaleKRW}
                onChange={e => setUnitWholesaleKRW(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">國際空運費(TWD)</label>
              <input
                type="number"
                value={shippingCostTWD}
                onChange={e => setShippingCostTWD(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">到手單件成本</label>
              <div className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-pink-400 font-bold">
                NT$ {unitLandedCostTWD}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">門市定價售價(NT$)</label>
              <input
                type="number"
                value={targetRetailPriceTWD}
                onChange={e => setTargetRetailPriceTWD(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-mono text-emerald-400 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">採購渠道 / 供應商</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">付款狀態</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
              >
                <option value="paid">已付款</option>
                <option value="pending">待付款</option>
                <option value="cod">貨到付款</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">備註說明</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-pink-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-600/30 hover:bg-pink-500"
            >
              儲存變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
