import { AccountMappingType, TrialBalanceRow } from '../trialBalanceImport';

export type { TrialBalanceRow, AccountMappingType };

export interface ScenarioResult {
  id: string;
  category: ScenarioCategory;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  affectedAccounts: string[];
  autoFixAvailable: boolean;
  autoFixLabel?: string;
  autoFix?: () => TrialBalanceRow[];
}

export type ScenarioCategory =
  | 'balance_validation' | 'mapping_coverage' | 'missing_accounts'
  | 'duplicate_detection' | 'amount_anomaly' | 'classification_conflict'
  | 'zakat_compliance' | 'ifrs_compliance' | 'cross_statement_integrity' | 'hierarchy_validation';

export interface ScenarioSummary {
  totalScenariosTested: number;
  passed: number;
  warnings: number;
  errors: number;
  critical: number;
  results: ScenarioResult[];
  overallScore: number;
  timestamp: string;
}

export const REQUIRED_ACCOUNT_CATEGORIES: Record<string, { type: AccountMappingType; nameAr: string }[]> = {
  balance_sheet: [
    { type: 'current_assets', nameAr: 'أصول متداولة' },
    { type: 'equity', nameAr: 'حقوق ملكية' },
  ],
  income_statement: [{ type: 'revenue', nameAr: 'إيرادات' }],
  zakat: [{ type: 'equity', nameAr: 'حقوق ملكية (للوعاء الزكوي)' }],
};

export const KNOWN_PATTERNS: { pattern: RegExp; expectedType: AccountMappingType; label: string }[] = [
  { pattern: /نقد|صندوق|كاش/i, expectedType: 'current_assets', label: 'نقد/صندوق' },
  { pattern: /بنك|مصرف/i, expectedType: 'current_assets', label: 'بنوك' },
  { pattern: /عملاء|مدينون|ذمم مدينة/i, expectedType: 'current_assets', label: 'ذمم مدينة' },
  { pattern: /مخزون|بضاعة/i, expectedType: 'current_assets', label: 'مخزون' },
  { pattern: /أصول ثابتة|معدات|آلات|سيارات|أثاث|مباني/i, expectedType: 'non_current_assets', label: 'أصول ثابتة' },
  { pattern: /إهلاك|استهلاك/i, expectedType: 'non_current_assets', label: 'إهلاك' },
  { pattern: /موردين|دائنون|ذمم دائنة/i, expectedType: 'current_liabilities', label: 'ذمم دائنة' },
  { pattern: /ضريبة|ضريبي|زكاة مستحقة/i, expectedType: 'current_liabilities', label: 'ضرائب مستحقة' },
  { pattern: /قروض طويلة/i, expectedType: 'non_current_liabilities', label: 'قروض طويلة الأجل' },
  { pattern: /رأس المال|رأسمال/i, expectedType: 'equity', label: 'رأس المال' },
  { pattern: /احتياطي/i, expectedType: 'equity', label: 'احتياطي' },
  { pattern: /أرباح محتجزة|أرباح مبقاة/i, expectedType: 'equity', label: 'أرباح محتجزة' },
  { pattern: /إيراد|مبيعات|دخل/i, expectedType: 'revenue', label: 'إيرادات' },
  { pattern: /تكلفة المبيعات|تكلفة البضاعة|تكلفة الإيرادات/i, expectedType: 'cogs', label: 'تكلفة إيرادات' },
  { pattern: /مصروف|إيجار|رواتب|كهرباء|ماء|هاتف|صيانة/i, expectedType: 'expenses', label: 'مصروفات' },
];

export const SCENARIO_CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  balance_validation: 'التحقق من التوازن', mapping_coverage: 'تغطية التصنيف',
  missing_accounts: 'الحسابات المفقودة', duplicate_detection: 'كشف التكرار',
  amount_anomaly: 'شذوذ المبالغ', classification_conflict: 'تعارض التصنيف',
  zakat_compliance: 'توافق الزكاة', ifrs_compliance: 'توافق المعايير الدولية',
  cross_statement_integrity: 'سلامة القوائم المتقاطعة', hierarchy_validation: 'التسلسل الهرمي',
};

export const SEVERITY_LABELS: Record<string, string> = { info: 'معلومة', warning: 'تحذير', error: 'خطأ', critical: 'حرج' };
