/**
 * Accounting Audit - Facade (backward compatibility)
 * All implementations moved to src/services/accountingAudit/ modules.
 */
export type { AuditCheckResult, AuditCategory } from './accountingAudit';
export {
  checkCoreTables, checkJournalEntryBalance, checkFinancialReports,
  checkFiscalYearIntegrity, checkEdgeCases, checkSecurityPermissions,
  AUDIT_CATEGORIES, runFullAudit,
} from './accountingAudit';
