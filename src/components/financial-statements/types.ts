// أنواع القوائم المالية الشاملة - مطابق لتصدير مداد

// ===== قائمة المركز المالي =====
export interface BalanceSheetData {
  // الموجودات المتداولة
  currentAssets: { name: string; amount: number; previousAmount?: number; note?: string }[];
  totalCurrentAssets: number;
  previousTotalCurrentAssets?: number;
  
  // الموجودات الغير متداولة
  nonCurrentAssets: { name: string; amount: number; previousAmount?: number; note?: string }[];
  totalNonCurrentAssets: number;
  previousTotalNonCurrentAssets?: number;
  
  totalAssets: number;
  previousTotalAssets?: number;
  
  // المطلوبات المتداولة
  currentLiabilities: { name: string; amount: number; previousAmount?: number; note?: string }[];
  totalCurrentLiabilities: number;
  previousTotalCurrentLiabilities?: number;
  
  // المطلوبات الغير متداولة
  nonCurrentLiabilities: { name: string; amount: number; previousAmount?: number; note?: string }[];
  totalNonCurrentLiabilities: number;
  previousTotalNonCurrentLiabilities?: number;
  
  totalLiabilities: number;
  previousTotalLiabilities?: number;
  
  // حقوق الملكية
  equity: { name: string; amount: number; previousAmount?: number; note?: string }[];
  totalEquity: number;
  previousTotalEquity?: number;
  
  totalLiabilitiesAndEquity: number;
  previousTotalLiabilitiesAndEquity?: number;
}

// ===== قائمة الدخل الشامل =====
export interface IncomeStatementData {
  revenue: number;
  previousRevenue?: number;
  revenueNote?: string;
  
  costOfRevenue: number;
  previousCostOfRevenue?: number;
  costOfRevenueNote?: string;
  
  grossProfit: number;
  previousGrossProfit?: number;
  
  generalAndAdminExpenses: number;
  previousGeneralAndAdminExpenses?: number;
  generalAndAdminExpensesNote?: string;
  
  operatingProfit: number;
  previousOperatingProfit?: number;
  
  financingCost: number;
  previousFinancingCost?: number;
  
  gainsLossesFromDisposals: number;
  previousGainsLossesFromDisposals?: number;
  
  profitBeforeZakat: number;
  previousProfitBeforeZakat?: number;
  
  zakat: number;
  previousZakat?: number;
  
  netProfit: number;
  previousNetProfit?: number;
  
  // الدخل الشامل الآخر
  otherComprehensiveIncome: number;
  previousOtherComprehensiveIncome?: number;
  
  totalComprehensiveIncome: number;
  previousTotalComprehensiveIncome?: number;
}

// ===== قائمة التغيرات في حقوق الملكية =====
export interface EquityChangesData {
  periods: {
    label: string;
    rows: {
      description: string;
      capital: number;
      statutoryReserve: number;
      retainedEarnings: number;
      total: number;
    }[];
  }[];
}

// ===== قائمة التدفق النقدي =====
export interface CashFlowData {
  // الأنشطة التشغيلية
  operatingActivities: {
    profitBeforeZakat: number;
    adjustmentsToReconcile: { name: string; amount: number }[];
    changesInWorkingCapital: { name: string; amount: number }[];
    zakatPaid: number;
    employeeBenefitsPaid: number;
    netOperatingCashFlow: number;
  };
  
  // الأنشطة الاستثمارية
  investingActivities: { name: string; amount: number }[];
  netInvestingCashFlow: number;
  
  // الأنشطة التمويلية
  financingActivities: { name: string; amount: number }[];
  netFinancingCashFlow: number;
  
  // صافي التغير
  netChangeInCash: number;
  openingCashBalance: number;
  closingCashBalance: number;
  
  previousYear?: {
    netOperatingCashFlow?: number;
    netInvestingCashFlow?: number;
    netFinancingCashFlow?: number;
    netChangeInCash?: number;
    closingCashBalance?: number;
  };
}

// ===== الإيضاحات على القوائم المالية =====

// إيضاح 5: النقد وأرصدة لدى البنوك
export interface CashAndBankNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 6: موجودات متداولة أخرى
export interface OtherCurrentAssetsNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 7: العقارات والآلات والمعدات
export interface FixedAssetsNote {
  categories: string[];
  costOpening: number[];
  costAdditions: number[];
  costDisposals: number[];
  costClosing: number[];
  depreciationOpening: number[];
  depreciationAdditions: number[];
  depreciationDisposals: number[];
  depreciationClosing: number[];
  netBookValueClosing: number[];
  netBookValuePreviousClosing: number[];
  totals: {
    costOpening: number;
    costAdditions: number;
    costDisposals: number;
    costClosing: number;
    depreciationOpening: number;
    depreciationAdditions: number;
    depreciationDisposals: number;
    depreciationClosing: number;
    netBookValueClosing: number;
    netBookValuePreviousClosing: number;
  };
}

// إيضاح 8: مصاريف مستحقة الدفع
export interface AccruedExpensesNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 9: أرصدة مستحقة إلى جهات ذات علاقة
export interface RelatedPartyBalancesNote {
  parties: {
    name: string;
    relationshipType: string;
    relationshipNature: string;
    openingBalance: number;
    debitMovement: number;
    creditMovement: number;
    closingBalance: number;
    previousClosingBalance?: number;
  }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 10: مطلوبات متداولة أخرى
export interface OtherCurrentLiabilitiesNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 11: عقود الإيجار التمويلي
export interface FinanceLeasesNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 12: مخصصات منافع موظفين
export interface EmployeeBenefitsNote {
  openingBalance: number;
  additions: number;
  payments: number;
  closingBalance: number;
  previousOpeningBalance?: number;
  previousAdditions?: number;
  previousPayments?: number;
  previousClosingBalance?: number;
}

// إيضاح 13: رأس المال
export interface CapitalNote {
  description: string;
  partners: {
    name: string;
    sharesCount: number;
    shareValue: number;
    totalValue: number;
  }[];
  totalShares: number;
  totalValue: number;
}

// إيضاح 14: تكلفة الإيرادات
export interface CostOfRevenueNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 15: مصاريف عمومية وإدارية
export interface GeneralAndAdminExpensesNote {
  items: { name: string; amount: number; previousAmount?: number }[];
  total: number;
  previousTotal?: number;
}

// إيضاح 16: الأحداث بعد نهاية الفترة المالية
export interface EventsAfterReportingPeriodNote {
  description: string;
}

// إيضاح الزكاة
export interface ZakatNote {
  // احتساب المخصص
  profitBeforeZakat: number;
  adjustmentsOnNetIncome: number;
  adjustedNetProfit: number;
  zakatOnAdjustedProfit: number;
  
  // الوعاء الزكوي
  capital: number;
  partnersCurrentAccount: number;
  statutoryReserve: number;
  employeeBenefitsLiabilities: number;
  zakatBaseSubtotal: number;
  
  // ينزل (الحسميات)
  fixedAssetsNet: number;
  intangibleAssetsNet: number;
  other: number;
  totalDeductions: number;
  
  zakatBase: number;
  zakatOnBase: number;
  totalZakatProvision: number;
  
  // حركة المخصص
  openingBalance: number;
  provisionForYear: number;
  paidDuringYear: number;
  closingBalance: number;
  
  previousYear?: {
    profitBeforeZakat?: number;
    zakatOnAdjustedProfit?: number;
    zakatBase?: number;
    totalZakatProvision?: number;
    closingBalance?: number;
  };
  
  // الموقف الزكوي
  zakatStatus: string;
}

// ===== البيانات الشاملة =====
export interface ComprehensiveFinancialData {
  // معلومات الشركة
  companyName: string;
  companyType: string;
  reportDate: string;
  previousReportDate?: string;
  currency: string;
  
  // القوائم الرئيسية
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  equityChanges: EquityChangesData;
  cashFlow: CashFlowData;
  
  // الإيضاحات
  notes: {
    cashAndBank?: CashAndBankNote;
    otherCurrentAssets?: OtherCurrentAssetsNote;
    fixedAssets?: FixedAssetsNote;
    accruedExpenses?: AccruedExpensesNote;
    relatedPartyBalances?: RelatedPartyBalancesNote;
    otherCurrentLiabilities?: OtherCurrentLiabilitiesNote;
    financeLeases?: FinanceLeasesNote;
    employeeBenefits?: EmployeeBenefitsNote;
    capital?: CapitalNote;
    costOfRevenue?: CostOfRevenueNote;
    generalAndAdminExpenses?: GeneralAndAdminExpensesNote;
    eventsAfterReportingPeriod?: EventsAfterReportingPeriodNote;
    zakat?: ZakatNote;
  };
}

// ===== بيانات فارغة افتراضية =====
export const emptyFinancialData: ComprehensiveFinancialData = {
  companyName: '',
  companyType: 'شركة ذات مسئولية محدودة',
  reportDate: '',
  currency: 'ريال سعودي',
  
  balanceSheet: {
    currentAssets: [],
    totalCurrentAssets: 0,
    nonCurrentAssets: [],
    totalNonCurrentAssets: 0,
    totalAssets: 0,
    currentLiabilities: [],
    totalCurrentLiabilities: 0,
    nonCurrentLiabilities: [],
    totalNonCurrentLiabilities: 0,
    totalLiabilities: 0,
    equity: [],
    totalEquity: 0,
    totalLiabilitiesAndEquity: 0,
  },
  
  incomeStatement: {
    revenue: 0,
    costOfRevenue: 0,
    grossProfit: 0,
    generalAndAdminExpenses: 0,
    operatingProfit: 0,
    financingCost: 0,
    gainsLossesFromDisposals: 0,
    profitBeforeZakat: 0,
    zakat: 0,
    netProfit: 0,
    otherComprehensiveIncome: 0,
    totalComprehensiveIncome: 0,
  },
  
  equityChanges: {
    periods: [],
  },
  
  cashFlow: {
    operatingActivities: {
      profitBeforeZakat: 0,
      adjustmentsToReconcile: [],
      changesInWorkingCapital: [],
      zakatPaid: 0,
      employeeBenefitsPaid: 0,
      netOperatingCashFlow: 0,
    },
    investingActivities: [],
    netInvestingCashFlow: 0,
    financingActivities: [],
    netFinancingCashFlow: 0,
    netChangeInCash: 0,
    openingCashBalance: 0,
    closingCashBalance: 0,
  },
  
  notes: {},
};
