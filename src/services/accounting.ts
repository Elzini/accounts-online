// This file is kept for backward compatibility.
// All implementations have been split into src/services/accounting/ modules.
export type { TaxSettings, AccountType, ReferenceType, AccountCategory, JournalEntry, JournalEntryLine, VATSettlementReport } from './accounting/types';
export { fetchTaxSettings, upsertTaxSettings } from './accounting/taxSettings';
export { fetchAccounts, createDefaultAccounts, addAccount, updateAccount, deleteAccount } from './accounting/accounts';
export { fetchJournalEntries, fetchJournalEntryWithLines, createJournalEntry, deleteJournalEntry, updateJournalEntry } from './accounting/journalEntries';
export { getAccountBalances, getTrialBalance, getIncomeStatement, getGeneralLedger, getBalanceSheet, getVouchersReport, getJournalEntriesReport, getComprehensiveTrialBalance, getVATSettlementReport } from './accounting/reports';
