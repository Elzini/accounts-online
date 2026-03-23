/**
 * Zakat Reports - Facade (backward compatibility)
 * All implementations moved to src/services/zakatReports/ modules.
 */
export type { CashFlowStatement, ChangesInEquityStatement, ZakatBaseStatement, DetailedIncomeStatement } from './zakatReports/types';
export { getCashFlowStatement } from './zakatReports/cashFlowStatement';
export { getChangesInEquityStatement } from './zakatReports/equityStatement';
export { getZakatBaseStatement } from './zakatReports/zakatBaseStatement';
export { getDetailedIncomeStatement } from './zakatReports/detailedIncomeStatement';
