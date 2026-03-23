/**
 * System Control - Barrel Export (Facade)
 */
export type {
  CustomReport, ReportColumn, ReportFilter, ReportGrouping, ReportSorting, ReportStyling,
  MenuItem, ThemeSettings, MenuConfiguration,
  AccountMapping,
  FinancialStatementSection, FinancialStatementConfig,
  JournalEntryRule, RuleCondition,
  DashboardConfig, StatCardConfig, AnalyticsSettings, AnalyticsComponentConfig, WidgetConfig, LayoutSettings,
} from './types';

export { SOURCE_TABLES, TABLE_FIELDS, MAPPING_TYPES, STATEMENT_TYPES, TRIGGER_TYPES } from './constants';
export { fetchCustomReports, createCustomReport, updateCustomReport, deleteCustomReport } from './customReports';
export { fetchMenuConfiguration, saveMenuConfiguration, fetchAccountMappings, saveAccountMapping } from './menuConfig';
export { fetchFinancialStatementConfig, saveFinancialStatementConfig, fetchJournalEntryRules, createJournalEntryRule, updateJournalEntryRule, deleteJournalEntryRule } from './journalRules';
export { fetchDashboardConfig, saveDashboardConfig } from './dashboardConfig';
