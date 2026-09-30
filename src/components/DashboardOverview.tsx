import React from 'react';
import { 
  FinancialSummary, 
  GroupFinancial, 
  CategoryFinancial 
} from '../utils/calculations';
import { CATEGORY_LABELS } from '../data/initialData';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Plane, 
  AlertTriangle, 
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  Store,
  Barcode
} from 'lucide-react';
import heroStoreImg from '../assets/images/hero_kpop_store_1790124599030.jpg';
import lightstickImg from '../assets/images/merch_lightsticks_1790124609356.jpg';
import photocardImg from '../assets/images/merch_photocards_1790124620021.jpg';

interface DashboardOverviewProps {
  summary: FinancialSummary;
  groupStats: GroupFinancial[];
  categoryStats: CategoryFinancial[];
  onSelectGroup: (groupId: string) => void;
  onSelectCategory: (category: string) => void;
  onOpenAddModal: () => void;
  onOpenCalculator: () => void;
  onOpenBarcodes?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  summary,
  groupStats,
  categoryStats,
  onSelectGroup,
  onSelectCategory,
  onOpenAddModal,
  onOpenCalculator,
  onOpenBarcodes,
}) => {
  // Filter out store_general for group ranking
  const idolGroups = groupStats.filter(g => g.groupId !== 'store_general');
  const topGroup = idolGroups[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Store Atmosphere */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="absolute inset-0">
          <img
            src={heroStoreImg}
            alt="K-Pop Record Store Interior"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center brightness-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pink-400">
              <Sparkles className="h-4 w-4" />
              <span>首爾連線直購 · 實時開銷與利潤監控</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              K-POP 專輯門市進貨開銷與庫存管理系統
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              專為韓流唱片行打造，即時核算 <strong className="text-white">BLACKPINK</strong>、<strong className="text-white">BABYMONSTER</strong>、<strong className="text-white">ATEEZ</strong> 等頂級團體的應援手燈、隨機小卡、實體專輯、電子平台專與角色娃娃的韓幣批發進價、國際空運攤提、關稅及門市毛利率。
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="rounded-lg bg-pink-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-pink-600/25 hover:bg-pink-500 transition-all flex items-center gap-2"
            >
              <span>+ 登記新批次進貨</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            {onOpenBarcodes && (
              <button
                onClick={onOpenBarcodes}
                className="rounded-lg border border-pink-500/40 bg-pink-950/70 backdrop-blur px-4 py-2.5 text-xs sm:text-sm font-semibold text-pink-300 hover:bg-pink-900/80 hover:text-white transition-all flex items-center gap-2"
              >
                <Barcode className="h-4 w-4 text-pink-400" />
                <span>各商品條碼建立與標籤</span>
              </button>
            )}
            <button
              onClick={onOpenCalculator}
              className="rounded-lg border border-neutral-700 bg-neutral-900/90 backdrop-blur px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-all flex items-center gap-2"
            >
              <Package className="h-4 w-4 text-pink-400" />
              <span>周邊到手成本與售價算式</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Store Outflow */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>累計總支出開銷</span>
            <DollarSign className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
            NT$ {summary.totalExpensesTWD.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            <span>貨品採購佔比</span>
            <span className="font-mono tabular-nums text-neutral-200 font-medium">
              {summary.totalExpensesTWD > 0 
                ? Math.round((summary.merchCostTWD / summary.totalExpensesTWD) * 100) 
                : 0}%
            </span>
            <span aria-hidden="true">·</span>
            <span>待結算 NT$ {summary.pendingPaymentTWD.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: Realized Revenue & Gross Margin */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>門市已實現營收</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-400">
            NT$ {summary.realizedRevenueTWD.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            <span>累計實現毛利</span>
            <span className="font-mono tabular-nums text-emerald-300 font-semibold">
              NT$ {summary.realizedGrossProfitTWD.toLocaleString()}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-pink-400 font-bold">
              {summary.grossMarginPercent}% 毛利率
            </span>
          </div>
        </div>

        {/* Metric 3: Air Freight & Customs */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>國際空運與海關稅金</span>
            <Plane className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-sky-400">
            NT$ {summary.logisticsCustomsTWD.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            <span>平均每件進口物流成本</span>
            <span className="font-mono tabular-nums text-neutral-200">
              ~NT$ {summary.totalSoldUnits + summary.totalStockUnits > 0
                ? Math.round(summary.logisticsCustomsTWD / (summary.totalSoldUnits + summary.totalStockUnits))
                : 0}
            </span>
          </div>
        </div>

        {/* Metric 4: Inventory Capital & Damage Loss */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>在庫存貨資金 (到手成本)</span>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-400">
            NT$ {summary.inventoryCapitalTWD.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            <span>在庫總量</span>
            <span className="font-mono tabular-nums text-neutral-200 font-medium">
              {summary.totalStockUnits} 件
            </span>
            <span aria-hidden="true">·</span>
            <span>瑕疵運損 {summary.defectCountTotal} 件</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Category Distribution & Visual Highlights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Category Spending Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">各周邊與開銷類別支出分佈</h2>
              <p className="text-xs text-neutral-400 mt-1">手燈、小卡、實體專、電子專與門市固定費用支出比重</p>
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              共計 {categoryStats.length} 個品類
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats.map(cat => {
              const meta = CATEGORY_LABELS[cat.category] || {
                label: cat.category,
                short: cat.category,
                color: 'text-neutral-400 bg-neutral-800 border-neutral-700',
              };

              return (
                <div
                  key={cat.category}
                  onClick={() => onSelectCategory(cat.category)}
                  className="group cursor-pointer rounded-lg border border-neutral-800/80 bg-neutral-950/40 p-3.5 hover:border-neutral-700 hover:bg-neutral-800/30 transition-all"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200 group-hover:text-pink-400 transition-colors">
                        {meta.label}
                      </span>
                      {cat.unitsProcured > 0 && (
                        <span className="text-xs text-neutral-500 font-mono">
                          (採購 {cat.unitsProcured} 件 · 已售 {cat.unitsSold} 件)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-neutral-400">
                        {cat.percentageOfTotal}%
                      </span>
                      <span className="font-mono tabular-nums font-bold text-white text-right w-24">
                        NT$ {cat.totalCostTWD.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, cat.percentageOfTotal))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Category Visual Focus (Lightsticks & Photocards) */}
        <div className="space-y-6">
          {/* Card 1: Official Lightsticks Focus */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg">
              <img
                src={lightstickImg}
                alt="Official Lightstick Showcase"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>官方應援手燈 (BP · 寶怪 · ATEEZ)</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-white">手燈進貨品管與運損防護</h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              手燈重量大 (每支約 450g) 且外盒極易在空運中壓損。建議空運前要求韓國倉庫打泡泡柱加固，並在門市售出前測試藍牙與燈效。
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
              <span>手燈平均毛利率</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">28.5% ~ 35.0%</span>
            </div>
          </div>

          {/* Card 2: Photocards & POB Trading Cards */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg">
              <img
                src={photocardImg}
                alt="Photocards Showcase"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>特典小卡 / 簽售卡 / 抽卡專區</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-white">小卡高毛利與硬卡套防刮</h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              小卡體積極輕（幾乎無空運重負），且 Jennie, Ahyeon, 弘中 等熱門成員簽售卡具高溢價空間，出貨標配無酸卡膜與硬卡套可避免售後糾紛。
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
              <span>小卡平均毛利率</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">45.0% ~ 55.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* K-Pop Group Capital Allocation Grid */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">偶像團體進貨佔比與銷售成果</h2>
            <p className="text-xs text-neutral-400 mt-1">BLACKPINK、BABYMONSTER、ATEEZ 等天團的資金沉澱與獲利能力</p>
          </div>
          <div className="text-xs text-neutral-400">
            <span>最高進貨投資團體：</span>
            <strong className="text-white ml-1 font-semibold">{topGroup?.groupName}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {idolGroups.map(group => {
            return (
              <div
                key={group.groupId}
                onClick={() => onSelectGroup(group.groupId)}
                className="group relative cursor-pointer rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 hover:border-neutral-700 hover:bg-neutral-900/70 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: group.colorAccent }}
                        />
                        <h3 className="text-base font-bold text-white group-hover:text-pink-400 transition-colors">
                          {group.groupName}
                        </h3>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {group.agency} · {group.fandomName}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-neutral-400 border border-neutral-800 rounded px-2 py-0.5">
                      {group.itemsCount} 款周邊
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>累計採購開銷</span>
                      <span className="font-mono tabular-nums text-white font-semibold">
                        NT$ {group.totalCostTWD.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400">
                      <span>門市已售營業額</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                        NT$ {group.revenueTWD.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400">
                      <span>毛利率</span>
                      <span className="font-mono tabular-nums font-bold text-pink-400">
                        {group.profitMarginPercent}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 pt-2 border-t border-neutral-800/80">
                      <span>已售 / 現有庫存</span>
                      <span className="font-mono tabular-nums text-neutral-300">
                        {group.soldUnits} 售出 / {group.stockUnits} 現貨
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-end text-xs font-medium text-pink-400 group-hover:translate-x-0.5 transition-transform">
                  <span>查看 {group.groupName} 進貨清單 ⭢</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
