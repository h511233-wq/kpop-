import React, { useState } from 'react';
import { ExpenseItem, KPopGroup } from '../types/store';
import { CATEGORY_LABELS } from '../data/initialData';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Award, 
  ShoppingBag, 
  Sparkles,
  Layers
} from 'lucide-react';

interface GroupBreakdownViewProps {
  groups: KPopGroup[];
  expenses: ExpenseItem[];
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  onQuickSell: (id: string, delta: number) => void;
  onEditExpense: (item: ExpenseItem) => void;
  onOpenAddForGroup: (groupId: string) => void;
}

export const GroupBreakdownView: React.FC<GroupBreakdownViewProps> = ({
  groups,
  expenses,
  selectedGroupId,
  onSelectGroup,
  onQuickSell,
  onEditExpense,
  onOpenAddForGroup,
}) => {
  const idolGroups = groups.filter(g => g.id !== 'store_general');
  const activeGroupId = selectedGroupId !== 'store_general' ? selectedGroupId : idolGroups[0]?.id || 'blackpink';
  const currentGroup = groups.find(g => g.id === activeGroupId) || idolGroups[0];

  const groupItems = expenses.filter(i => i.groupId === currentGroup.id);

  // Group metrics
  const totalCost = groupItems.reduce((sum, item) => sum + item.totalCostTWD, 0);
  const totalRevenue = groupItems.reduce((sum, item) => sum + (item.soldQuantity * item.targetRetailPriceTWD), 0);
  const totalCOGS = groupItems.reduce((sum, item) => sum + (item.soldQuantity * item.unitLandedCostTWD), 0);
  const totalProfit = totalRevenue - totalCOGS;
  const marginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;
  
  const totalUnits = groupItems.reduce((sum, item) => sum + item.quantity, 0);
  const soldUnits = groupItems.reduce((sum, item) => sum + item.soldQuantity, 0);
  const defectUnits = groupItems.reduce((sum, item) => sum + item.defectCount, 0);
  const inStockUnits = Math.max(0, totalUnits - soldUnits - defectUnits);
  const inStockValue = groupItems.reduce((sum, item) => {
    const s = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
    return sum + (s * item.unitLandedCostTWD);
  }, 0);

  // Category breakdown for this group
  const categoryMap: Record<string, { cost: number; count: number; items: ExpenseItem[] }> = {};
  for (const item of groupItems) {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { cost: 0, count: 0, items: [] };
    }
    categoryMap[item.category].cost += item.totalCostTWD;
    categoryMap[item.category].count += item.quantity;
    categoryMap[item.category].items.push(item);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            偶像團體專屬開銷與回報分析
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            深度掌握各大天團（BLACKPINK、BABYMONSTER、ATEEZ等）各類周邊採購佔比與門市銷售利潤
          </p>
        </div>

        <button
          onClick={() => onOpenAddForGroup(currentGroup.id)}
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-600/25 hover:bg-pink-500 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <span>+ 為 {currentGroup.name} 登記進貨</span>
        </button>
      </div>

      {/* Group Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {idolGroups.map(group => {
          const isActive = group.id === currentGroup.id;
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-inner border border-neutral-700'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-900'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: group.colorAccent }}
              />
              <span>{group.name}</span>
              <span className="text-[11px] font-normal text-neutral-500">
                ({group.fandomName})
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Group Banner & Financial Summary */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: currentGroup.colorAccent }}
              />
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentGroup.name}
              </h2>
              <span className="text-sm font-medium text-neutral-400">
                {currentGroup.koreanName}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
              <span>所屬經紀公司: <strong className="text-neutral-200">{currentGroup.agency}</strong></span>
              <span aria-hidden="true">·</span>
              <span>官方粉絲名: <strong className="text-pink-400 font-semibold">{currentGroup.fandomName}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-right">
              <div className="text-[11px] text-neutral-400">團體實現毛利率</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {marginPercent}%
              </div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-right">
              <div className="text-[11px] text-neutral-400">現貨存貨成本</div>
              <div className="text-xl font-bold font-mono text-amber-400">
                NT$ {inStockValue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-6">
          <div>
            <div className="text-xs text-neutral-400">累計採購開銷 (TWD)</div>
            <div className="mt-1 text-xl font-bold font-mono text-white">
              NT$ {totalCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              共採購 {totalUnits} 件周邊
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-400">門市累積營業額</div>
            <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
              NT$ {totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              已售出 {soldUnits} 件
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-400">淨獲利 Gross Profit</div>
            <div className="mt-1 text-xl font-bold font-mono text-pink-400">
              NT$ {totalProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              毛利率 {marginPercent}%
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-400">現有庫存 / 瑕疵損耗</div>
            <div className="mt-1 text-xl font-bold font-mono text-amber-400">
              {inStockUnits} <span className="text-xs text-neutral-400 font-normal">件現貨</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              損耗/壓痕: {defectUnits} 件
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div>
        <h3 className="text-base font-bold text-white mb-3">
          {currentGroup.name} 周邊品項細項清單 (手燈 · 小卡 · 專輯 · 電子專 · 娃娃)
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {groupItems.map(item => {
            const catMeta = CATEGORY_LABELS[item.category] || {
              label: item.category,
              short: item.category,
            };
            const currentStock = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
            const margin = item.targetRetailPriceTWD > 0 
              ? Math.round(((item.targetRetailPriceTWD - item.unitLandedCostTWD) / item.targetRetailPriceTWD) * 100) 
              : 0;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-pink-400">
                      [{catMeta.short}]
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span>進貨日: {item.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>採購渠道: {item.supplier}</span>
                    <span aria-hidden="true">·</span>
                    <span>原幣批價: <strong className="font-mono text-neutral-300">₩{item.unitWholesaleKRW.toLocaleString()}</strong></span>
                    {item.note && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-500 italic">備註: {item.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t md:border-t-0 border-neutral-800/80 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">單件到手成本</div>
                    <div className="font-mono font-bold text-sm text-neutral-200">
                      NT$ {item.unitLandedCostTWD.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">門市售價 (毛利)</div>
                    <div className="font-mono font-bold text-sm text-white">
                      NT$ {item.targetRetailPriceTWD.toLocaleString()}
                      <span className="ml-1 text-xs text-emerald-400 font-semibold">({margin}%)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">庫存現貨</div>
                    <div className="font-mono font-bold text-sm text-amber-400">
                      {currentStock} <span className="text-xs text-neutral-400 font-normal">/ {item.quantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStock > 0 && (
                      <button
                        onClick={() => onQuickSell(item.id, 1)}
                        className="rounded-lg bg-pink-600/90 hover:bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>售出 1 件</span>
                      </button>
                    )}
                    <button
                      onClick={() => onEditExpense(item)}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      編輯
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
