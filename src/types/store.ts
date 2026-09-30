export type MerchCategory =
  | 'album_physical'      // 實體專輯 (Photobook, Digipack, Limited)
  | 'album_digital'       // 電子專/平台專 (Nemo, SMini, Weverse, Poca)
  | 'lightstick'          // 官方應援手燈
  | 'photocard'           // 特典小卡 / 簽售卡 / 抽卡 / 拍立得
  | 'plush_doll'          // 偶像娃娃 / 毛絨玩偶吊飾 (10cm / 20cm / 角色娃娃)
  | 'other_merch'         // 官方周邊 (手幅, 卡冊, 應援服, 壓克力立牌)
  | 'logistics_customs'   // 國際空運與海關稅金
  | 'store_rent_overhead' // 門市店租與水電
  | 'packaging_supplies'  // 防撞氣泡袋、硬卡套、飛機盒耗材
  | 'staff_payroll'       // 人事薪資與工讀生
  | 'event_marketing';    // 回歸活動/應援展架佈置

export type PaymentStatus = 'paid' | 'pending' | 'cod';

export interface KPopGroup {
  id: string;
  name: string;
  koreanName: string;
  agency: string;
  fandomName: string;
  colorAccent: string; // Tailwind color class or hex
  bgGradient: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  groupId: string; // references KPopGroup.id or 'store_general'
  category: MerchCategory;
  date: string; // YYYY-MM-DD
  quantity: number;
  
  // Cost details in TWD
  unitWholesaleKRW: number; // Original KRW unit price
  exchangeRate: number;     // e.g., 0.024
  baseCostTWD: number;      // unitWholesaleKRW * exchangeRate * quantity (or direct TWD)
  shippingCostTWD: number;  // International air shipping
  customsTaxTWD: number;    // Customs tariff & trade tax
  packagingCostTWD: number; // Card top loaders, boxes, sleeves
  totalCostTWD: number;     // Sum of all procurement/operational expenses for this batch
  unitLandedCostTWD: number;// totalCostTWD / quantity

  // Sales & Inventory Tracking
  barcode?: string;         // EAN-13 / Code128 條碼 (例如 8809999441012)
  targetRetailPriceTWD: number; // MSRP / Retail price in TWD
  soldQuantity: number;
  defectCount: number;      // 瑕疵/運損/廠損
  supplier: string;         // e.g. "YG SELECT", "KTOWN4U", "MAKESTAR", "WITHMUU", "KQ SHOP"
  paymentStatus: PaymentStatus;
  note?: string;
}

export interface LandedCostInput {
  merchCategory: MerchCategory;
  priceKRW: number;
  quantity: number;
  weightKgPerUnit: number;
  airFreightRatePerKgTWD: number;
  customsTariffPercent: number;
  packagingCostPerUnitTWD: number;
  platformFeePercent: number;
  targetMarginPercent: number;
}

export interface StoreBackupData {
  version: string;
  exportDate: string;
  expenses: ExpenseItem[];
  groups: KPopGroup[];
}

export interface HistorySnapshot {
  id: string;
  timestamp: string;
  description: string;
  itemCount: number;
  expenses: ExpenseItem[];
}

