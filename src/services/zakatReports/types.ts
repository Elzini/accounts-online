// Types for Zakat Financial Reports

export interface CashFlowStatement {
  operatingActivities: {
    netIncome: number;
    adjustments: Array<{ description: string; amount: number }>;
    changesInWorkingCapital: Array<{ description: string; amount: number }>;
    total: number;
  };
  investingActivities: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  financingActivities: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  netChangeInCash: number;
  cashAtBeginning: number;
  cashAtEnd: number;
  period: { startDate: string; endDate: string };
}

export interface ChangesInEquityStatement {
  openingBalance: { capital: number; retainedEarnings: number; reserves: number; total: number };
  changes: { netIncome: number; dividends: number; capitalIncrease: number; otherChanges: number };
  closingBalance: { capital: number; retainedEarnings: number; reserves: number; total: number };
  details: Array<{ description: string; capital: number; retainedEarnings: number; reserves: number; total: number }>;
  period: { startDate: string; endDate: string };
}

export interface ZakatBaseStatement {
  zakatableSources: {
    paidUpCapital: number; reserves: number; retainedEarnings: number;
    netIncomeForYear: number; provisions: number; longTermLoans: number; total: number;
  };
  deductions: {
    netFixedAssets: number; investments: number; preOperatingExpenses: number;
    accumulatedLosses: number; total: number;
  };
  adjustedZakatBase: number;
  zakatRate: number;
  zakatDue: number;
  fiscalYear: string;
  companyInfo: { name: string; taxNumber: string; commercialRegister: string };
}

export interface DetailedIncomeStatement {
  revenue: { items: Array<{ code: string; name: string; amount: number }>; salesRevenue: number; otherRevenue: number; total: number };
  costOfSales: { items: Array<{ code: string; name: string; amount: number }>; openingInventory: number; purchases: number; closingInventory: number; total: number };
  grossProfit: number;
  operatingExpenses: { items: Array<{ code: string; name: string; amount: number }>; total: number };
  operatingIncome: number;
  otherExpenses: { items: Array<{ code: string; name: string; amount: number }>; total: number };
  otherIncome: { items: Array<{ code: string; name: string; amount: number }>; total: number };
  netIncomeBeforeZakat: number;
  zakatNote: string;
  period: { startDate: string; endDate: string };
  stats: { totalSalesCount: number; grossProfitMargin: number; netProfitMargin: number };
}
