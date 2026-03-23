/**
 * Accounting Audit - Facade (backward compatibility)
 * All implementations moved to src/services/accountingAudit/ modules.
 */
export type { AuditCheckResult, AuditCategory } from './accountingAudit/types';
export { checkCoreTables } from './accountingAudit/checks/coreTables';
export { checkJournalEntryBalance } from './accountingAudit/checks/journalBalance';
export { checkFinancialReports } from './accountingAudit/checks/financialReports';
export { checkFiscalYearIntegrity } from './accountingAudit/checks/fiscalYearIntegrity';
export { checkEdgeCases } from './accountingAudit/checks/edgeCases';
export { checkSecurityPermissions } from './accountingAudit/checks/security';
export { AUDIT_CATEGORIES, runFullAudit } from './accountingAudit/index';
