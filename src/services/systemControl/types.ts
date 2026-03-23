/**
 * System Control - Shared Types
 */

export interface CustomReport {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  report_type: 'table' | 'chart' | 'summary';
  source_table: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  grouping: ReportGrouping[];
  sorting: ReportSorting[];
  styling: ReportStyling;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportColumn {
  field: string;
  label: string;
  visible: boolean;
  order: number;
  width?: string;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | string[];
}

export interface ReportGrouping {
  field: string;
  aggregate?: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

export interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportStyling {
  headerColor?: string;
  fontSize?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  visible: boolean;
  order: number;
  isCollapsible?: boolean;
}

export interface ThemeSettings {
  primaryColor?: string;
  sidebarColor?: string;
  fontFamily?: string;
  fontSize?: string;
}

export interface MenuConfiguration {
  id: string;
  company_id: string;
  menu_items: MenuItem[];
  theme_settings: ThemeSettings;
}

export interface AccountMapping {
  id: string;
  company_id: string;
  mapping_type: string;
  mapping_key: string;
  account_id: string | null;
  is_active: boolean;
}

export interface FinancialStatementSection {
  name: string;
  accountCodes: string[];
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  order: number;
}

export interface FinancialStatementConfig {
  id: string;
  company_id: string;
  statement_type: string;
  sections: FinancialStatementSection[];
  display_options: {
    showSubtotals?: boolean;
    showPercentages?: boolean;
    comparePeriods?: boolean;
  };
}

export interface JournalEntryRule {
  id: string;
  company_id: string;
  name: string;
  trigger_type: string;
  is_enabled: boolean;
  conditions: RuleCondition[];
  debit_account_id: string | null;
  credit_account_id: string | null;
  amount_field: string;
  description_template: string;
  priority: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  value: string | number;
}

export interface DashboardConfig {
  id: string;
  company_id: string;
  stat_cards: StatCardConfig[];
  analytics_settings: AnalyticsSettings;
  layout_settings: LayoutSettings;
  created_at: string;
  updated_at: string;
}

export interface StatCardConfig {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
  color?: string;
}

export interface AnalyticsSettings {
  components?: AnalyticsComponentConfig[];
}

export interface AnalyticsComponentConfig {
  componentId: string;
  visible: boolean;
  order: number;
  size: 'half' | 'full';
}

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface LayoutSettings {
  cardsPerRow?: number;
  cardSpacing?: number;
  showOverviewTab?: boolean;
  showAnalyticsTab?: boolean;
  defaultTab?: 'overview' | 'analytics';
  widgets?: WidgetConfig[];
  card_formulas?: any[];
}
