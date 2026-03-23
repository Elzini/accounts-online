/**
 * Financial Statements - Type Definitions
 */

export interface BalanceSheetData {
  currentAssets: { name: string; amount: number; note?: string }[];
  fixedAssets: { name: string; amount: number; note?: string }[];
  totalAssets: number;
  currentLiabilities: { name: string; amount: number; note?: string }[];
  longTermLiabilities: { name: string; amount: number; note?: string }[];
  totalLiabilities: number;
  equity: { name: string; amount: number; note?: string }[];
  totalEquity: number;
}

export interface IncomeStatementData {
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: { name: string; amount: number }[];
  totalOperatingExpenses: number;
  operatingProfit: number;
  otherIncome: number;
  otherExpenses: number;
  profitBeforeZakat: number;
  zakat: number;
  netProfit: number;
}

export interface EquityChangesData {
  items: {
    description: string;
    capital: number;
    reserves: number;
    retainedEarnings: number;
    total: number;
  }[];
  openingBalance: { capital: number; reserves: number; retainedEarnings: number; total: number };
  closingBalance: { capital: number; reserves: number; retainedEarnings: number; total: number };
}

export interface CashFlowData {
  operating: { name: string; amount: number }[];
  totalOperating: number;
  investing: { name: string; amount: number }[];
  totalInvesting: number;
  financing: { name: string; amount: number }[];
  totalFinancing: number;
  netChange: number;
  openingCash: number;
  closingCash: number;
}

export interface ZakatCalculationData {
  profitBeforeZakat: number;
  adjustmentsOnNetIncome: number;
  adjustedNetProfit: number;
  zakatOnAdjustedProfit: number;
  capital: number;
  partnersCurrentAccount: number;
  statutoryReserve: number;
  employeeBenefitsLiabilities: number;
  zakatBaseTotal: number;
  fixedAssets: number;
  intangibleAssets: number;
  otherDeductions: number;
  totalDeductions: number;
  zakatBase: number;
  zakatOnBase: number;
  totalZakat: number;
  openingBalance: number;
  provisionAdded: number;
  paidDuringYear: number;
  closingBalance: number;
}

export interface FinancialData {
  companyName: string;
  period: { from: string; to: string };
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  equityChanges: EquityChangesData;
  cashFlow: CashFlowData;
  zakatCalculation: ZakatCalculationData;
}

export const emptyFinancialData: FinancialData = {
  companyName: '',
  period: { from: '', to: '' },
  balanceSheet: {
    currentAssets: [],
    fixedAssets: [],
    totalAssets: 0,
    currentLiabilities: [],
    longTermLiabilities: [],
    totalLiabilities: 0,
    equity: [],
    totalEquity: 0,
  },
  incomeStatement: {
    revenue: 0, costOfRevenue: 0, grossProfit: 0,
    operatingExpenses: [], totalOperatingExpenses: 0, operatingProfit: 0,
    otherIncome: 0, otherExpenses: 0, profitBeforeZakat: 0, zakat: 0, netProfit: 0,
  },
  equityChanges: {
    items: [],
    openingBalance: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
    closingBalance: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
  },
  cashFlow: {
    operating: [], totalOperating: 0,
    investing: [], totalInvesting: 0,
    financing: [], totalFinancing: 0,
    netChange: 0, openingCash: 0, closingCash: 0,
  },
  zakatCalculation: {
    profitBeforeZakat: 0, adjustmentsOnNetIncome: 0, adjustedNetProfit: 0, zakatOnAdjustedProfit: 0,
    capital: 0, partnersCurrentAccount: 0, statutoryReserve: 0, employeeBenefitsLiabilities: 0,
    zakatBaseTotal: 0, fixedAssets: 0, intangibleAssets: 0, otherDeductions: 0,
    totalDeductions: 0, zakatBase: 0, zakatOnBase: 0, totalZakat: 0,
    openingBalance: 0, provisionAdded: 0, paidDuringYear: 0, closingBalance: 0,
  },
};
