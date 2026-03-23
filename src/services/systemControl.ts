/**
 * System Control - Thin Facade (backward compatibility)
 * All logic has been decomposed into src/services/systemControl/
 */
export type {
  CustomReport, ReportColumn, ReportFilter, ReportGrouping, ReportSorting, ReportStyling,
  MenuItem, ThemeSettings, MenuConfiguration,
  AccountMapping,
  FinancialStatementSection, FinancialStatementConfig,
  JournalEntryRule, RuleCondition,
  DashboardConfig, StatCardConfig, AnalyticsSettings, AnalyticsComponentConfig, WidgetConfig, LayoutSettings,
} from './systemControl/index';

export {
  SOURCE_TABLES, TABLE_FIELDS, MAPPING_TYPES, STATEMENT_TYPES, TRIGGER_TYPES,
  fetchCustomReports, createCustomReport, updateCustomReport, deleteCustomReport,
  fetchMenuConfiguration, saveMenuConfiguration, fetchAccountMappings, saveAccountMapping,
  fetchFinancialStatementConfig, saveFinancialStatementConfig,
  fetchJournalEntryRules, createJournalEntryRule, updateJournalEntryRule, deleteJournalEntryRule,
  fetchDashboardConfig, saveDashboardConfig,
} from './systemControl/index';
