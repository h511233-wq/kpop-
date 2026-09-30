import React, { useState, useMemo } from 'react';
import { MerchCategory, KPopGroup, ExpenseItem } from '../types/store';
import { calculateLandedCostPricing } from '../utils/calculations';
import { Calculator, ArrowRight, Save, Sparkles, HelpCircle } from 'lucide-react';

interface CostCalculatorProps {
  groups: KPopGroup[];
  onAddCalculatedItem: (item: Partial<ExpenseItem>) => void;
}

export const CostCalculator: React.FC<CostCalculatorProps> = ({
  groups,
  onAddCalculatedItem,
}) => {
  const idolGroups = groups.filter(g => g.id !== 'store_general');

  // Form states
  const [selectedGroup, setSelectedGroup] = useState<string>(idolGroups[0]?.id || 'blackpink');
  const [merchTitle, setMerchTitle] = useState('BLACKPINK 應援手燈 Ver.2 新進貨');
  const [category, setCategory] = useState<MerchCategory>('lightstick');
  const [priceKRW, setPriceKRW] = useState<number>(42000);
  const [quantity, setQuantity] = useState<number>(30);
  const [weightKg, setWeightKg] = useState<number>(0.45);
  const [freightRatePerKg, setFreightRatePerKg] = useState<number>(180);
  const [customsPercent, setCustomsPercent] = useState<number>(5);
  const [packagingTWD, setPackagingTWD] = useState<number>(10);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(2.5);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(30);
  const [supplier, setSupplier] = useState('YG SELECT Official');

  // Quick preset helper when changing category
  const handleCategoryChange = (newCat: MerchCategory) => {
    setCategory(newCat);
    if (newCat === 'lightstick') {
      setWeightKg(0.45);
      setPackagingTWD(10);
      setPriceKRW(42000);
      setMerchTitle('官方應援手燈 (含藍牙)');
    } else if (newCat === 'photocard') {
      setWeightKg(0.02);
      setPackagingTWD(15); // 硬卡套 + 氣泡袋
      setPriceKRW(8000);
      setMerchTitle('簽售特典自拍小卡組');
    } else if (newCat === 'album_physical') {
      setWeightKg(0.65);
      setPackagingTWD(12);
      setPriceKRW(19000);
      setMerchTitle('正規專輯 Photo Book 版');
    } else if (newCat === 'album_digital') {
      setWeightKg(0.08);
      setPackagingTWD(8);
      setPriceKRW(12000);
      setMerchTitle('Platform / Nemo 智能電子專');
    } else if (newCat === 'plush_doll') {
      setWeightKg(0.2);
      setPackagingTWD(10);
      setPriceKRW(24000);
      setMerchTitle('官方應援 10cm 毛絨玩偶吊飾');
    }
  };

  const results = useMemo(() => {
    return calculateLandedCostPricing({
      merchCategory: category,
      priceKRW,
      quantity,
      weightKgPerUnit: weightKg,
      airFreightRatePerKgTWD: freightRatePerKg,
      customsTariffPercent: customsPercent,
      packagingCostPerUnitTWD: packagingTWD,
      platformFeePercent,
      targetMarginPercent,
    });
  }, [
    category,
    priceKRW,
    quantity,
    weightKg,
    freightRatePerKg,
    customsPercent,
    packagingTWD,
    platformFeePercent,
    targetMarginPercent,
  ]);

  const handleSaveToLedger = () => {
    const exchangeRate = 0.024;
    const baseCostTWD = results.baseWholesaleTWD * quantity;
    const shippingCostTWD = results.airFreightTWD * quantity;
    const customsTaxTWD = results.customsTaxTWD * quantity;
    const packagingCostTWD = results.packagingTWD * quantity;

    onAddCalculatedItem({
      title: merchTitle,
      groupId: selectedGroup,
      category,
      date: new Date().toISOString().split('T')[0],
      quantity,
      unitWholesaleKRW: priceKRW,
      exchangeRate,
      baseCostTWD,
      shippingCostTWD,
      customsTaxTWD,
      packagingCostTWD,
      totalCostTWD: results.batchTotalCostTWD,
      unitLandedCostTWD: results.unitLandedCostTWD,
      targetRetailPriceTWD: results.suggestedRetailTWD,
      soldQuantity: 0,
      defectCount: 0,
      supplier,
      paymentStatus: 'paid',
      note: `試算公式轉入: 預估毛利 ${results.actualMarginPercent}%`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          K-POP 周邊到手成本 (Landed Cost) 與利潤定價試算器
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          輸入韓國官網批發價（KRW）、重量與海關稅費，自動攤提國際空運與耗材，算出單件實質到手成本與最佳門市售價！
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Calculator className="h-5 w-5 text-pink-500" />
            <h2 className="text-base font-bold text-white">採購參數與規格設定</h2>
          </div>

          {/* Preset Category Switcher */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              選擇周邊種類 (快速代入標準重量與包裝耗材)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('lightstick')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                  category === 'lightstick'
                    ? 'border-pink-500 bg-pink-950/40 text-pink-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                應援手燈
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('photocard')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                  category === 'photocard'
                    ? 'border-pink-500 bg-pink-950/40 text-pink-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                特典小卡
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('album_physical')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                  category === 'album_physical'
                    ? 'border-pink-500 bg-pink-950/40 text-pink-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                實體專輯
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('album_digital')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                  category === 'album_digital'
                    ? 'border-pink-500 bg-pink-950/40 text-pink-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                電子平台專
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('plush_doll')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                  category === 'plush_doll'
                    ? 'border-pink-500 bg-pink-950/40 text-pink-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                偶像娃娃
              </button>
            </div>
          </div>

          {/* Group and Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                所屬天團
              </label>
              <select
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              >
                {idolGroups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.fandomName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                商品名稱標題
              </label>
              <input
                type="text"
                value={merchTitle}
                onChange={e => setMerchTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cost details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                韓國批發進價 (KRW)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">₩</span>
                <input
                  type="number"
                  value={priceKRW}
                  onChange={e => setPriceKRW(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-7 pr-3 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                ≈ NT$ {Math.round(priceKRW * 0.024)} (匯率 0.024)
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                本批進貨件數
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                單件重量 (KG)
              </label>
              <input
                type="number"
                step="0.05"
                value={weightKg}
                onChange={e => setWeightKg(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Shipping, Customs, Packaging */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                國際空運單價 (NT$/KG)
              </label>
              <input
                type="number"
                value={freightRatePerKg}
                onChange={e => setFreightRatePerKg(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                海關進口稅率 (%)
              </label>
              <input
                type="number"
                value={customsPercent}
                onChange={e => setCustomsPercent(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                單件防撞/卡套耗材 (NT$)
              </label>
              <input
                type="number"
                value={packagingTWD}
                onChange={e => setPackagingTWD(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Margins & Platform fees */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800/80">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                目標毛利率 (%)
              </label>
              <input
                type="number"
                value={targetMarginPercent}
                onChange={e => setTargetMarginPercent(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-pink-400 font-bold focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                刷卡 / 平台金流手續費 (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={platformFeePercent}
                onChange={e => setPlatformFeePercent(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              進貨採購渠道 / 供應商
            </label>
            <input
              type="text"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              placeholder="例如: YG SELECT, KTOWN4U, MAKESTAR, WITHMUU..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Computed Results & Action (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-400" />
                <h3 className="text-base font-bold text-white">實質成本與利潤試算結果</h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                批次共 {quantity} 件
              </span>
            </div>

            {/* Landed Cost Breakdown */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>原幣換算台幣成本 (單件)</span>
                <span className="font-mono text-neutral-200">
                  NT$ {results.baseWholesaleTWD.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-400">
                <span>國際空運每件攤提</span>
                <span className="font-mono text-sky-400">
                  + NT$ {results.airFreightTWD.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-400">
                <span>進口關稅每件攤提</span>
                <span className="font-mono text-orange-400">
                  + NT$ {results.customsTaxTWD.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-400">
                <span>包材與卡套防護</span>
                <span className="font-mono text-teal-400">
                  + NT$ {results.packagingTWD.toLocaleString()}
                </span>
              </div>

              {/* Total Unit Landed Cost Highlight */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-sm font-bold text-white">
                <span>實質到手成本 (Landed Cost)</span>
                <span className="font-mono text-pink-400 text-base">
                  NT$ {results.unitLandedCostTWD.toLocaleString()}
                </span>
              </div>

              {/* Total Batch Investment */}
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>本批進貨總開銷支出</span>
                <span className="font-mono text-white font-semibold">
                  NT$ {results.batchTotalCostTWD.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Suggested Pricing Box */}
            <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  建議門市售價 (MSRP)
                </span>
                <span className="font-mono text-xs text-pink-400 font-bold">
                  毛利率 ~{results.actualMarginPercent}%
                </span>
              </div>

              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                NT$ {results.suggestedRetailTWD.toLocaleString()}
              </div>

              <div className="space-y-1.5 text-xs text-neutral-400 border-t border-neutral-900 pt-2">
                <div className="flex items-center justify-between">
                  <span>單件售出淨獲利</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    + NT$ {results.estimatedGrossProfitPerUnit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>損益平衡回本銷量</span>
                  <span className="font-mono text-amber-300">
                    只需售出 {results.breakEvenUnits} 件 (即保本)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action to Save to Ledger */}
          <button
            onClick={handleSaveToLedger}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-pink-600/30 hover:bg-pink-500 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>將此筆進貨成本直接寫入門市帳冊</span>
          </button>
        </div>
      </div>
    </div>
  );
};
