import { supabase } from '@/integrations/supabase/client';

// Types for system control
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

// Available source tables for custom reports
export const SOURCE_TABLES = [
  { value: 'sales', label: 'المبيعات' },
  { value: 'cars', label: 'السيارات' },
  { value: 'customers', label: 'العملاء' },
  { value: 'suppliers', label: 'الموردين' },
  { value: 'expenses', label: 'المصروفات' },
  { value: 'journal_entries', label: 'قيود اليومية' },
  { value: 'vouchers', label: 'السندات' },
  { value: 'employees', label: 'الموظفين' },
  { value: 'payroll_records', label: 'مسير الرواتب' },
  { value: 'quotations', label: 'عروض الأسعار' },
  { value: 'installment_sales', label: 'مبيعات الأقساط' },
];

// Available fields per table
export const TABLE_FIELDS: Record<string, { field: string; label: string; type: string }[]> = {
  sales: [
    { field: 'sale_number', label: 'رقم البيع', type: 'number' },
    { field: 'sale_date', label: 'تاريخ البيع', type: 'date' },
    { field: 'sale_price', label: 'سعر البيع', type: 'currency' },
    { field: 'profit', label: 'الربح', type: 'currency' },
    { field: 'commission', label: 'العمولة', type: 'currency' },
    { field: 'seller_name', label: 'اسم البائع', type: 'text' },
  ],
  cars: [
    { field: 'inventory_number', label: 'رقم المخزون', type: 'number' },
    { field: 'name', label: 'اسم السيارة', type: 'text' },
    { field: 'chassis_number', label: 'رقم الشاصي', type: 'text' },
    { field: 'model', label: 'الموديل', type: 'text' },
    { field: 'color', label: 'اللون', type: 'text' },
    { field: 'purchase_price', label: 'سعر الشراء', type: 'currency' },
    { field: 'purchase_date', label: 'تاريخ الشراء', type: 'date' },
    { field: 'status', label: 'الحالة', type: 'text' },
  ],
  expenses: [
    { field: 'description', label: 'الوصف', type: 'text' },
    { field: 'amount', label: 'المبلغ', type: 'currency' },
    { field: 'expense_date', label: 'التاريخ', type: 'date' },
    { field: 'payment_method', label: 'طريقة الدفع', type: 'text' },
  ],
  journal_entries: [
    { field: 'entry_number', label: 'رقم القيد', type: 'number' },
    { field: 'entry_date', label: 'التاريخ', type: 'date' },
    { field: 'description', label: 'الوصف', type: 'text' },
    { field: 'total_debit', label: 'إجمالي المدين', type: 'currency' },
    { field: 'total_credit', label: 'إجمالي الدائن', type: 'currency' },
    { field: 'reference_type', label: 'نوع المرجع', type: 'text' },
  ],
  customers: [
    { field: 'name', label: 'الاسم', type: 'text' },
    { field: 'phone', label: 'الهاتف', type: 'text' },
    { field: 'id_number', label: 'رقم الهوية', type: 'text' },
    { field: 'address', label: 'العنوان', type: 'text' },
  ],
  suppliers: [
    { field: 'name', label: 'الاسم', type: 'text' },
    { field: 'phone', label: 'الهاتف', type: 'text' },
    { field: 'id_number', label: 'رقم الهوية', type: 'text' },
    { field: 'address', label: 'العنوان', type: 'text' },
  ],
  vouchers: [
    { field: 'voucher_number', label: 'رقم السند', type: 'number' },
    { field: 'voucher_type', label: 'نوع السند', type: 'text' },
    { field: 'amount', label: 'المبلغ', type: 'currency' },
    { field: 'voucher_date', label: 'التاريخ', type: 'date' },
    { field: 'description', label: 'الوصف', type: 'text' },
  ],
  employees: [
    { field: 'employee_number', label: 'رقم الموظف', type: 'number' },
    { field: 'name', label: 'الاسم', type: 'text' },
    { field: 'job_title', label: 'المسمى الوظيفي', type: 'text' },
    { field: 'base_salary', label: 'الراتب الأساسي', type: 'currency' },
    { field: 'phone', label: 'الهاتف', type: 'text' },
  ],
  payroll_records: [
    { field: 'month', label: 'الشهر', type: 'number' },
    { field: 'year', label: 'السنة', type: 'number' },
    { field: 'total_net_salaries', label: 'إجمالي صافي الرواتب', type: 'currency' },
    { field: 'status', label: 'الحالة', type: 'text' },
  ],
  quotations: [
    { field: 'quotation_number', label: 'رقم العرض', type: 'number' },
    { field: 'customer_name', label: 'اسم العميل', type: 'text' },
    { field: 'final_amount', label: 'المبلغ النهائي', type: 'currency' },
    { field: 'status', label: 'الحالة', type: 'text' },
  ],
  installment_sales: [
    { field: 'total_amount', label: 'المبلغ الإجمالي', type: 'currency' },
    { field: 'down_payment', label: 'الدفعة المقدمة', type: 'currency' },
    { field: 'remaining_amount', label: 'المبلغ المتبقي', type: 'currency' },
    { field: 'number_of_installments', label: 'عدد الأقساط', type: 'number' },
    { field: 'status', label: 'الحالة', type: 'text' },
  ],
};

// Account mapping types
export const MAPPING_TYPES = [
  { type: 'sales', label: 'المبيعات', keys: [
    { key: 'cash_account', label: 'حساب النقد' },
    { key: 'revenue_account', label: 'حساب الإيرادات' },
    { key: 'cogs_account', label: 'حساب تكلفة المبيعات' },
    { key: 'inventory_account', label: 'حساب المخزون' },
    { key: 'vat_payable_account', label: 'حساب ضريبة القيمة المضافة المستحقة' },
  ]},
  { type: 'purchases', label: 'المشتريات', keys: [
    { key: 'cash_account', label: 'حساب النقد' },
    { key: 'inventory_account', label: 'حساب المخزون' },
    { key: 'suppliers_account', label: 'حساب الموردين' },
    { key: 'vat_recoverable_account', label: 'حساب ضريبة القيمة المضافة القابلة للاسترداد' },
  ]},
  { type: 'expenses', label: 'المصروفات', keys: [
    { key: 'cash_account', label: 'حساب النقد' },
    { key: 'expense_account', label: 'حساب المصروفات' },
  ]},
  { type: 'payroll', label: 'الرواتب', keys: [
    { key: 'salaries_expense_account', label: 'حساب مصروف الرواتب' },
    { key: 'salaries_payable_account', label: 'حساب الرواتب المستحقة' },
    { key: 'cash_account', label: 'حساب النقد' },
  ]},
  { type: 'vat', label: 'ضريبة القيمة المضافة', keys: [
    { key: 'vat_payable_account', label: 'حساب ض.ق.م المستحقة' },
    { key: 'vat_recoverable_account', label: 'حساب ض.ق.م القابلة للاسترداد' },
    { key: 'vat_settlement_account', label: 'حساب تسوية ض.ق.م' },
  ]},
  { type: 'prepaid_expenses', label: 'المصروفات المقدمة', keys: [
    { key: 'prepaid_asset_account', label: 'حساب أصل المصروفات المقدمة' },
    { key: 'expense_account', label: 'حساب المصروف' },
  ]},
];

// Financial statement types
export const STATEMENT_TYPES = [
  { type: 'balance_sheet', label: 'الميزانية العمومية' },
  { type: 'income_statement', label: 'قائمة الدخل' },
  { type: 'cash_flow', label: 'قائمة التدفقات النقدية' },
  { type: 'trial_balance', label: 'ميزان المراجعة' },
  { type: 'vat_return', label: 'إقرار ضريبة القيمة المضافة' },
  { type: 'zakat', label: 'إقرار الزكاة' },
];

// Journal entry trigger types
export const TRIGGER_TYPES = [
  { type: 'sale', label: 'عند البيع' },
  { type: 'purchase', label: 'عند الشراء' },
  { type: 'expense', label: 'عند تسجيل مصروف' },
  { type: 'voucher', label: 'عند إنشاء سند' },
  { type: 'payroll', label: 'عند صرف الرواتب' },
  { type: 'prepaid_expense', label: 'عند إطفاء مصروف مقدم' },
];

// Fetch custom reports
export async function fetchCustomReports(companyId: string): Promise<CustomReport[]> {
  const { data, error } = await supabase
    .from('custom_reports')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    report_type: row.report_type as 'table' | 'chart' | 'summary',
    columns: (row.columns || []) as unknown as ReportColumn[],
    filters: (row.filters || []) as unknown as ReportFilter[],
    grouping: (row.grouping || []) as unknown as ReportGrouping[],
    sorting: (row.sorting || []) as unknown as ReportSorting[],
    styling: (row.styling || {}) as unknown as ReportStyling,
  }));
}

// Create custom report
export async function createCustomReport(report: Omit<CustomReport, 'id' | 'created_at' | 'updated_at'>): Promise<CustomReport> {
  const { data, error } = await supabase
    .from('custom_reports' as any)
    .insert({
      company_id: report.company_id,
      name: report.name,
      description: report.description,
      report_type: report.report_type,
      source_table: report.source_table,
      columns: report.columns,
      filters: report.filters,
      grouping: report.grouping,
      sorting: report.sorting,
      styling: report.styling,
      is_active: report.is_active,
    } as any)
    .select()
    .single();

  if (error) throw error;
  const result = data as any;
  return {
    ...result,
    report_type: result.report_type as 'table' | 'chart' | 'summary',
    columns: (result.columns || []) as ReportColumn[],
    filters: (result.filters || []) as ReportFilter[],
    grouping: (result.grouping || []) as ReportGrouping[],
    sorting: (result.sorting || []) as ReportSorting[],
    styling: (result.styling || {}) as ReportStyling,
  };
}

// Update custom report
export async function updateCustomReport(id: string, updates: Partial<CustomReport>): Promise<void> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.report_type !== undefined) updateData.report_type = updates.report_type;
  if (updates.source_table !== undefined) updateData.source_table = updates.source_table;
  if (updates.columns !== undefined) updateData.columns = updates.columns as unknown as object[];
  if (updates.filters !== undefined) updateData.filters = updates.filters as unknown as object[];
  if (updates.grouping !== undefined) updateData.grouping = updates.grouping as unknown as object[];
  if (updates.sorting !== undefined) updateData.sorting = updates.sorting as unknown as object[];
  if (updates.styling !== undefined) updateData.styling = updates.styling as unknown as object;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  const { error } = await supabase
    .from('custom_reports')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

// Delete custom report
export async function deleteCustomReport(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Fetch menu configuration
export async function fetchMenuConfiguration(companyId: string): Promise<MenuConfiguration | null> {
  const { data, error } = await supabase
    .from('menu_configuration')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  return {
    ...data,
    menu_items: (data.menu_items || []) as unknown as MenuItem[],
    theme_settings: (data.theme_settings || {}) as unknown as ThemeSettings,
  };
}

// Save menu configuration
export async function saveMenuConfiguration(companyId: string, config: Partial<MenuConfiguration>): Promise<void> {
  const { error } = await supabase
    .from('menu_configuration' as any)
    .upsert({
      company_id: companyId,
      menu_items: config.menu_items || [],
      theme_settings: config.theme_settings || {},
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'company_id' });

  if (error) throw error;
}

// Fetch account mappings
export async function fetchAccountMappings(companyId: string): Promise<AccountMapping[]> {
  const { data, error } = await supabase
    .from('account_mappings')
    .select('*')
    .eq('company_id', companyId);

  if (error) throw error;
  return data || [];
}

// Save account mapping
export async function saveAccountMapping(mapping: Omit<AccountMapping, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('account_mappings')
    .upsert({
      company_id: mapping.company_id,
      mapping_type: mapping.mapping_type,
      mapping_key: mapping.mapping_key,
      account_id: mapping.account_id,
      is_active: mapping.is_active,
    }, { onConflict: 'company_id,mapping_type,mapping_key' });

  if (error) throw error;
}

// Fetch financial statement config
export async function fetchFinancialStatementConfig(companyId: string, statementType: string): Promise<FinancialStatementConfig | null> {
  const { data, error } = await supabase
    .from('financial_statement_config')
    .select('*')
    .eq('company_id', companyId)
    .eq('statement_type', statementType)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  return {
    ...data,
    sections: (data.sections || []) as unknown as FinancialStatementSection[],
    display_options: (data.display_options || {}) as unknown as FinancialStatementConfig['display_options'],
  };
}

// Save financial statement config
export async function saveFinancialStatementConfig(config: Omit<FinancialStatementConfig, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('financial_statement_config' as any)
    .upsert({
      company_id: config.company_id,
      statement_type: config.statement_type,
      sections: config.sections,
      display_options: config.display_options,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'company_id,statement_type' });

  if (error) throw error;
}

// Fetch journal entry rules
export async function fetchJournalEntryRules(companyId: string): Promise<JournalEntryRule[]> {
  const { data, error } = await supabase
    .from('journal_entry_rules')
    .select('*')
    .eq('company_id', companyId)
    .order('priority', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    conditions: (row.conditions || []) as unknown as RuleCondition[],
  }));
}

// Create journal entry rule
export async function createJournalEntryRule(rule: Omit<JournalEntryRule, 'id'>): Promise<JournalEntryRule> {
  const { data, error } = await supabase
    .from('journal_entry_rules' as any)
    .insert({
      company_id: rule.company_id,
      name: rule.name,
      trigger_type: rule.trigger_type,
      is_enabled: rule.is_enabled,
      conditions: rule.conditions,
      debit_account_id: rule.debit_account_id,
      credit_account_id: rule.credit_account_id,
      amount_field: rule.amount_field,
      description_template: rule.description_template,
      priority: rule.priority,
    } as any)
    .select()
    .single();

  if (error) throw error;
  const result = data as any;
  return {
    ...result,
    conditions: (result.conditions || []) as RuleCondition[],
  };
}

// Update journal entry rule
export async function updateJournalEntryRule(id: string, updates: Partial<JournalEntryRule>): Promise<void> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
  if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;
  if (updates.conditions !== undefined) updateData.conditions = updates.conditions as unknown as object[];
  if (updates.debit_account_id !== undefined) updateData.debit_account_id = updates.debit_account_id;
  if (updates.credit_account_id !== undefined) updateData.credit_account_id = updates.credit_account_id;
  if (updates.amount_field !== undefined) updateData.amount_field = updates.amount_field;
  if (updates.description_template !== undefined) updateData.description_template = updates.description_template;
  if (updates.priority !== undefined) updateData.priority = updates.priority;

  const { error } = await supabase
    .from('journal_entry_rules')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

// Delete journal entry rule
export async function deleteJournalEntryRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entry_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Dashboard Configuration Types
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

export interface LayoutSettings {
  cardsPerRow?: number;
  cardSpacing?: number;
  showOverviewTab?: boolean;
  showAnalyticsTab?: boolean;
  defaultTab?: 'overview' | 'analytics';
}

// Fetch dashboard configuration
export async function fetchDashboardConfig(companyId: string): Promise<DashboardConfig | null> {
  const { data, error } = await supabase
    .from('dashboard_config')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  return {
    ...data,
    stat_cards: (data.stat_cards || []) as unknown as StatCardConfig[],
    analytics_settings: (data.analytics_settings || {}) as unknown as AnalyticsSettings,
    layout_settings: (data.layout_settings || {}) as unknown as LayoutSettings,
  };
}

// Save dashboard configuration
export async function saveDashboardConfig(companyId: string, config: Partial<DashboardConfig>): Promise<void> {
  const { error } = await supabase
    .from('dashboard_config' as any)
    .upsert({
      company_id: companyId,
      stat_cards: config.stat_cards || [],
      analytics_settings: config.analytics_settings || {},
      layout_settings: config.layout_settings || {},
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'company_id' });

  if (error) throw error;
}
