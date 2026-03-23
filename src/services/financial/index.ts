/**
 * Financial Services - Barrel Export
 * Modular decomposition of the former 756-line systemFinancialData.ts
 */
export { classifyAccounts, getLeafAccounts, getBalance } from './accountClassifier';
export { buildBalanceSheet } from './balanceSheetBuilder';
export { computeIncomeComponents, buildIncomeStatement } from './incomeStatementBuilder';
export { calculateZakat } from './zakatCalculator';
export { buildNotes } from './notesBuilder';
