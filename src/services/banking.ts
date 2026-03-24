/**
 * Banking Service - Re-export barrel for backward compatibility
 * Implementation split into src/services/banking/ modules
 */
export type { BankAccount, BankStatement, BankTransaction, BankReconciliation, BankAccountInsert } from './banking/types';
export { normalizeArabicDigits, toSafeNumber, toISODate } from './banking/utils';
export { fetchBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } from './banking/bankAccounts';
export { fetchBankStatements, importBankStatement, updateBankStatement, deleteBankStatement } from './banking/bankStatements';
export { fetchBankTransactions, matchTransaction, unmatchTransaction, parseBankStatementCSV } from './banking/bankTransactions';
export { fetchBankReconciliations, createBankReconciliation, updateBankReconciliation } from './banking/bankReconciliations';
