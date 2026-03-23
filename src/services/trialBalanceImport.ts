/**
 * Trial Balance Import - Facade (backward compatibility)
 * All implementations moved to src/services/trialBalanceImport/ modules.
 */
export type { TrialBalanceRow, AccountMappingType, TrialBalanceValidation, ImportedTrialBalance } from './trialBalanceImport';
export { MAPPING_TYPE_LABELS, autoMapAccount, parseTrialBalanceFile, generateFinancialStatementsFromTB } from './trialBalanceImport';
