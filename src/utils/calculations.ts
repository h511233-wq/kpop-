import { ExpenseItem, KPopGroup, MerchCategory, LandedCostInput } from '../types/store';

export interface FinancialSummary {
  totalExpensesTWD: number;
  merchCostTWD: number;
  overheadCostTWD: number;
  logisticsCustomsTWD: number;
  realizedRevenueTWD: number;
  realizedGrossProfitTWD: number;
  grossMarginPercent: number;
  inventoryCapitalTWD: number;
  inventoryPotentialRevenueTWD: number;
  defectCountTotal: number;
  defectLossTWD: number;
  totalSoldUnits: number;
  totalStockUnits: number;
  pendingPaymentTWD: number;
}

export interface GroupFinancial {
  groupId: string;
  groupName: string;
  fandomName: string;
  agency: string;
  colorAccent: string;
  totalCostTWD: number;
  revenueTWD: number;
  grossProfitTWD: number;
  profitMarginPercent: number;
  itemsCount: number;
  stockUnits: number;
  soldUnits: number;
  categoryDistribution: Record<string, number>;
}

export interface CategoryFinancial {
  category: MerchCategory;
  totalCostTWD: number;
  percentageOfTotal: number;
  unitsProcured: number;
  unitsSold: number;
}

export function calculateStoreSummary(expenses: ExpenseItem[]): FinancialSummary {
  let totalExpensesTWD = 0;
  let merchCostTWD = 0;
  let overheadCostTWD = 0;
  let logisticsCustomsTWD = 0;
  let realizedRevenueTWD = 0;
  let realizedCostOfGoodsSold = 0;
  let inventoryCapitalTWD = 0;
  let inventoryPotentialRevenueTWD = 0;
  let defectCountTotal = 0;
  let defectLossTWD = 0;
  let totalSoldUnits = 0;
  let totalStockUnits = 0;
  let pendingPaymentTWD = 0;

  for (const item of expenses) {
    totalExpensesTWD += item.totalCostTWD;

    if (item.paymentStatus === 'pending') {
      pendingPaymentTWD += item.totalCostTWD;
    }

    // Overhead vs Goods
    const isMerch = [
      'album_physical',
      'album_digital',
      'lightstick',
      'photocard',
      'plush_doll',
      'other_merch',
    ].includes(item.category);

    if (isMerch) {
      merchCostTWD += item.totalCostTWD;
      const currentStock = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
      totalStockUnits += currentStock;
      totalSoldUnits += item.soldQuantity;
      defectCountTotal += item.defectCount;

      defectLossTWD += item.defectCount * item.unitLandedCostTWD;
      inventoryCapitalTWD += currentStock * item.unitLandedCostTWD;
      inventoryPotentialRevenueTWD += currentStock * item.targetRetailPriceTWD;

      // Revenue and cost of goods sold
      const revenue = item.soldQuantity * item.targetRetailPriceTWD;
      const cogs = item.soldQuantity * item.unitLandedCostTWD;
      realizedRevenueTWD += revenue;
      realizedCostOfGoodsSold += cogs;
    } else {
      overheadCostTWD += item.totalCostTWD;
    }

    // International shipping & customs taxes extracted
    logisticsCustomsTWD += (item.shippingCostTWD || 0) + (item.customsTaxTWD || 0);
    if (item.category === 'logistics_customs') {
      logisticsCustomsTWD += item.totalCostTWD;
    }
  }

  const realizedGrossProfitTWD = realizedRevenueTWD - realizedCostOfGoodsSold;
  const grossMarginPercent = realizedRevenueTWD > 0 
    ? Math.round((realizedGrossProfitTWD / realizedRevenueTWD) * 1000) / 10 
    : 0;

  return {
    totalExpensesTWD,
    merchCostTWD,
    overheadCostTWD,
    logisticsCustomsTWD,
    realizedRevenueTWD,
    realizedGrossProfitTWD,
    grossMarginPercent,
    inventoryCapitalTWD,
    inventoryPotentialRevenueTWD,
    defectCountTotal,
    defectLossTWD,
    totalSoldUnits,
    totalStockUnits,
    pendingPaymentTWD,
  };
}

export function calculateGroupBreakdowns(
  expenses: ExpenseItem[],
  groups: KPopGroup[]
): GroupFinancial[] {
  const map: Record<string, GroupFinancial> = {};

  for (const group of groups) {
    map[group.id] = {
      groupId: group.id,
      groupName: group.name,
      fandomName: group.fandomName,
      agency: group.agency,
      colorAccent: group.colorAccent,
      totalCostTWD: 0,
      revenueTWD: 0,
      grossProfitTWD: 0,
      profitMarginPercent: 0,
      itemsCount: 0,
      stockUnits: 0,
      soldUnits: 0,
      categoryDistribution: {},
    };
  }

  for (const item of expenses) {
    let group = map[item.groupId];
    if (!group) {
      group = {
        groupId: item.groupId,
        groupName: item.groupId,
        fandomName: '',
        agency: '',
        colorAccent: '#64748b',
        totalCostTWD: 0,
        revenueTWD: 0,
        grossProfitTWD: 0,
        profitMarginPercent: 0,
        itemsCount: 0,
        stockUnits: 0,
        soldUnits: 0,
        categoryDistribution: {},
      };
      map[item.groupId] = group;
    }

    group.totalCostTWD += item.totalCostTWD;
    group.itemsCount += 1;

    const isMerch = ![
      'store_rent_overhead',
      'staff_payroll',
      'packaging_supplies',
      'event_marketing',
      'logistics_customs',
    ].includes(item.category);

    if (isMerch) {
      const stock = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
      group.stockUnits += stock;
      group.soldUnits += item.soldQuantity;

      const rev = item.soldQuantity * item.targetRetailPriceTWD;
      const cogs = item.soldQuantity * item.unitLandedCostTWD;
      group.revenueTWD += rev;
      group.grossProfitTWD += (rev - cogs);
    }

    group.categoryDistribution[item.category] = 
      (group.categoryDistribution[item.category] || 0) + item.totalCostTWD;
  }

  return Object.values(map)
    .map(g => ({
      ...g,
      profitMarginPercent: g.revenueTWD > 0 
        ? Math.round((g.grossProfitTWD / g.revenueTWD) * 1000) / 10 
        : 0,
    }))
    .sort((a, b) => b.totalCostTWD - a.totalCostTWD);
}

export function calculateCategoryBreakdown(expenses: ExpenseItem[]): CategoryFinancial[] {
  const map: Partial<Record<MerchCategory, { totalCost: number; unitsProcured: number; unitsSold: number }>> = {};
  let overallExpenses = 0;

  for (const item of expenses) {
    overallExpenses += item.totalCostTWD;
    if (!map[item.category]) {
      map[item.category] = { totalCost: 0, unitsProcured: 0, unitsSold: 0 };
    }
    map[item.category]!.totalCost += item.totalCostTWD;
    map[item.category]!.unitsProcured += item.quantity;
    map[item.category]!.unitsSold += item.soldQuantity;
  }

  const result: CategoryFinancial[] = [];
  for (const [cat, data] of Object.entries(map)) {
    result.push({
      category: cat as MerchCategory,
      totalCostTWD: data.totalCost,
      percentageOfTotal: overallExpenses > 0 ? Math.round((data.totalCost / overallExpenses) * 1000) / 10 : 0,
      unitsProcured: data.unitsProcured,
      unitsSold: data.unitsSold,
    });
  }

  return result.sort((a, b) => b.totalCostTWD - a.totalCostTWD);
}

export function calculateLandedCostPricing(input: LandedCostInput) {
  const exchangeRate = 0.024; // 1 KRW ≈ 0.024 TWD
  const baseWholesaleTWD = Math.round(input.priceKRW * exchangeRate);
  const airFreightTWD = Math.round(input.weightKgPerUnit * input.airFreightRatePerKgTWD);
  const customsTaxTWD = Math.round((baseWholesaleTWD + airFreightTWD) * (input.customsTariffPercent / 100));
  const packagingTWD = input.packagingCostPerUnitTWD;
  
  const unitLandedCostTWD = baseWholesaleTWD + airFreightTWD + customsTaxTWD + packagingTWD;
  const batchTotalCostTWD = unitLandedCostTWD * input.quantity;

  // Suggested MSRP with target margin and platform fee
  // RetailPrice * (1 - PlatformFee% - TargetMargin%) = LandedCost
  const feeFactor = (100 - input.targetMarginPercent - input.platformFeePercent) / 100;
  const rawSuggestedRetail = feeFactor > 0 ? unitLandedCostTWD / feeFactor : unitLandedCostTWD * 1.5;
  // Round to friendly price ending in 0, 50, 80, 90
  const suggestedRetailTWD = Math.ceil(rawSuggestedRetail / 10) * 10;

  const platformFeePerUnit = Math.round(suggestedRetailTWD * (input.platformFeePercent / 100));
  const estimatedGrossProfitPerUnit = suggestedRetailTWD - unitLandedCostTWD - platformFeePerUnit;
  const actualMarginPercent = suggestedRetailTWD > 0 
    ? Math.round((estimatedGrossProfitPerUnit / suggestedRetailTWD) * 1000) / 10 
    : 0;
  const breakEvenUnits = Math.ceil(batchTotalCostTWD / (suggestedRetailTWD - platformFeePerUnit));

  return {
    baseWholesaleTWD,
    airFreightTWD,
    customsTaxTWD,
    packagingTWD,
    unitLandedCostTWD,
    batchTotalCostTWD,
    suggestedRetailTWD,
    platformFeePerUnit,
    estimatedGrossProfitPerUnit,
    actualMarginPercent,
    breakEvenUnits,
  };
}

export function exportExpensesToCSV(expenses: ExpenseItem[], groups: KPopGroup[]): string {
  const groupMap = new Map(groups.map(g => [g.id, g.name]));
  
  const headers = [
    '品項名稱',
    '偶像團體/分類',
    '開銷品類',
    '支出日期',
    '採購數量',
    '韓國批發原價(KRW)',
    '基礎採購成本(TWD)',
    '國際空運費(TWD)',
    '進口關稅(TWD)',
    '包材費(TWD)',
    '總開銷支出(TWD)',
    '單件到手成本(TWD)',
    '預估門市售價(TWD)',
    '已售出數量',
    '在庫庫存數量',
    '瑕疵/折損數',
    '進貨管道/廠商',
    '付款狀態',
    '備註',
  ];

  const rows = expenses.map(item => {
    const groupName = groupMap.get(item.groupId) || item.groupId;
    const currentStock = Math.max(0, item.quantity - item.soldQuantity - item.defectCount);
    const statusText = item.paymentStatus === 'paid' ? '已付款' : item.paymentStatus === 'pending' ? '待付款' : '貨到付款';

    return [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${groupName}"`,
      `"${item.category}"`,
      item.date,
      item.quantity,
      item.unitWholesaleKRW,
      item.baseCostTWD,
      item.shippingCostTWD,
      item.customsTaxTWD,
      item.packagingCostTWD,
      item.totalCostTWD,
      item.unitLandedCostTWD,
      item.targetRetailPriceTWD,
      item.soldQuantity,
      currentStock,
      item.defectCount,
      `"${(item.supplier || '').replace(/"/g, '""')}"`,
      statusText,
      `"${(item.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  // UTF-8 BOM so Excel opens Traditional Chinese characters cleanly without garbling
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}
