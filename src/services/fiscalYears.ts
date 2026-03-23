/**
 * Fiscal Years Service - Facade (backward compatibility)
 * All implementations moved to src/services/fiscalYear/ modules.
 */
export type { FiscalYear, FiscalYearInsert } from './fiscalYear';
export {
  fetchFiscalYears, getCurrentFiscalYear, createFiscalYear,
  updateFiscalYear, setCurrentFiscalYear, setUserFiscalYear,
  getUserFiscalYear, deleteFiscalYear,
  closeFiscalYear, refreshClosingEntry,
  openNewFiscalYear, refreshOpeningBalances,
  carryForwardInventory, refreshCustomerBalances,
  refreshSupplierBalances, refreshAllCarryForwardBalances,
} from './fiscalYear';
