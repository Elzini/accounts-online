// Re-export from modular structure for backward compatibility
export type { AccountingCheckResult, SystemHealthReport } from './accountingHealth';
export {
  checkJournalBalance,
  checkAccountLinks,
  checkTrialBalanceZero,
  checkEntrySequence,
  checkVATAccuracy,
  checkCustomerReconciliation,
  checkSupplierReconciliation,
  runFullAccountingHealthCheck,
} from './accountingHealth';
