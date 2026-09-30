import React from 'react';
import { ExpenseItem } from '../types/store';
import { CATEGORY_LABELS } from '../data/initialData';
import { 
  Building2, 
  Users, 
  Plane, 
  Box, 
  Sparkles, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3,
  Calendar
} from 'lucide-react';

interface StoreOverheadViewProps {
  expenses: ExpenseItem[];
  onOpenAddModal: () => void;
  onEditExpense: (item: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

export const StoreOverheadView: React.FC<StoreOverheadViewProps> = ({
  expenses,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
}) => {
  const overheadCategories = [
    'store_rent_overhead',
    'staff_payroll',
    'packaging_supplies',
    'event_marketing',
    'logistics_customs',
  ];

  const overheadItems = expenses.filter(i => 
    overheadCategories.includes(i.category) || i.groupId === 'store_general'
  );

  const totalOverhead = overheadItems.reduce((acc, curr) => acc + curr.totalCostTWD, 0);

  // Group by specific category
  const rentItems = overheadItems.filter(i => i.category === 'store_rent_overhead');
  const payrollItems = overheadItems.filter(i => i.category === 'staff_payroll');
  const packagingItems = overheadItems.filter(i => i.category === 'packaging_supplies');
  const marketingItems = overheadItems.filter(i => i.category === 'event_marketing');
  const logisticsItems = overheadItems.filter(i => i.category === 'logistics_customs');

  const rentTotal = rentItems.reduce((acc, c) => acc + c.totalCostTWD, 0);
  const payrollTotal = payrollItems.reduce((acc, c) => acc + c.totalCostTWD, 0);
  const packagingTotal = packagingItems.reduce((acc, c) => acc + c.totalCostTWD, 0);
  const marketingTotal = marketingItems.reduce((acc, c) => acc + c.totalCostTWD, 0);
  const logisticsTotal = logisticsItems.reduce((acc, c) => acc + c.totalCostTWD, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            門市固定開銷與營運雜支管理
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            精準控管唱片店房租、水電燈箱、拆卡包貨工讀生薪資、包裝耗材與回歸打卡應援佈置費用
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-600/25 hover:bg-pink-500 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>登記固定開銷 / 雜費</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs">門市店租與水電</span>
            <Building2 className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            NT$ {rentTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            佔固定支出 {totalOverhead > 0 ? Math.round((rentTotal / totalOverhead) * 100) : 0}%
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs">人事與工讀生薪資</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            NT$ {payrollTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            佔固定支出 {totalOverhead > 0 ? Math.round((payrollTotal / totalOverhead) * 100) : 0}%
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs">防撞包材與硬卡套</span>
            <Box className="h-4 w-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300">
            NT$ {packagingTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            小卡保護盒與信封袋
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs">回歸打卡專區佈置</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">
            NT$ {marketingTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            等身立牌與宣傳海報
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-xs">國際空運結算雜費</span>
            <Plane className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-xl font-bold font-mono text-orange-300">
            NT$ {logisticsTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            包機空運與海關雜支
          </div>
        </div>
      </div>

      {/* Operational Insight Banner */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>門市月度保本銷量估算</span>
            <span className="text-xs font-normal text-pink-400">(Break-even Analysis)</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            目前累計門市運營固定開銷為 <strong className="text-white font-mono">NT$ {totalOverhead.toLocaleString()}</strong>。以每張實體專輯平均毛利 NT$ 220 或每支手燈毛利 NT$ 450 計算，門市每月約需售出 <strong className="text-emerald-400 font-mono font-bold">~{Math.ceil(totalOverhead / 250)} 張/支</strong> 核心熱門周邊即可完全打平房租水電與人事成本！
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-neutral-400">總固定開銷</div>
          <div className="text-2xl font-black font-mono text-white">
            NT$ {totalOverhead.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Overhead Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">固定與營運開銷支出明細表</h3>
          <span className="text-xs font-mono text-neutral-400">共 {overheadItems.length} 筆</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 font-medium">
                <th className="py-3 px-4">支出項目名稱</th>
                <th className="py-3 px-3">開銷類別</th>
                <th className="py-3 px-3">付款對象 / 廠商</th>
                <th className="py-3 px-3">支出日期</th>
                <th className="py-3 px-3 text-right">支出金額 (TWD)</th>
                <th className="py-3 px-3 text-center">狀態</th>
                <th className="py-3 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {overheadItems.map(item => {
                const catMeta = CATEGORY_LABELS[item.category] || {
                  label: item.category,
                  short: item.category,
                };

                return (
                  <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.title}</div>
                      {item.note && (
                        <div className="text-neutral-500 text-xs mt-0.5">{item.note}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-neutral-300 font-medium">{catMeta.label}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-neutral-400">
                      {item.supplier}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-neutral-400 font-mono">
                      {item.date}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-white text-sm">
                      NT$ {item.totalCostTWD.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`text-xs ${item.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400 font-semibold'}`}>
                        {item.paymentStatus === 'paid' ? '已支付' : '待結付'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditExpense(item)}
                          className="rounded p-1 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(item.id)}
                          className="rounded p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
