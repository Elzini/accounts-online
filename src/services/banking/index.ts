/**
 * Banking Service - Barrel Export
 * Split from monolithic banking.ts (542 lines) into focused modules
 */
export type { BankAccount, BankStatement, BankTransaction, BankReconciliation, BankAccountInsert } from './types';
export { normalizeArabicDigits, toSafeNumber, toISODate } from './utils';
export { fetchBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } from './bankAccounts';
export { fetchBankStatements, importBankStatement, updateBankStatement, deleteBankStatement } from './bankStatements';
export { fetchBankTransactions, matchTransaction, unmatchTransaction, parseBankStatementCSV } from './bankTransactions';
export { fetchBankReconciliations, createBankReconciliation, updateBankReconciliation } from './bankReconciliations';
