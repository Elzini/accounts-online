export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
  movementDebit: number;
  movementCredit: number;
  mappedType: AccountMappingType;
  isAutoMapped: boolean;
  isValid: boolean;
}

export type AccountMappingType = 
  | 'current_assets' | 'non_current_assets'
  | 'current_liabilities' | 'non_current_liabilities'
  | 'equity' | 'revenue' | 'expenses' | 'cogs'
  | 'unmapped';

export interface TrialBalanceValidation {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  missingAccounts: string[];
  warnings: string[];
  errors: string[];
}

export interface ImportedTrialBalance {
  rows: TrialBalanceRow[];
  validation: TrialBalanceValidation;
  fileName: string;
  importDate: string;
}

export interface ColumnMapping {
  codeCol: number;
  nameCol: number;
  debitCol: number;
  creditCol: number;
  movementDebitCol: number;
  movementCreditCol: number;
  headerRowIndex: number;
  dataStartRow: number;
}

export const MAPPING_TYPE_LABELS: Record<AccountMappingType, string> = {
  current_assets: 'أصول متداولة',
  non_current_assets: 'أصول غير متداولة',
  current_liabilities: 'مطلوبات متداولة',
  non_current_liabilities: 'مطلوبات غير متداولة',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expenses: 'مصروفات عمومية وإدارية',
  cogs: 'تكلفة الإيرادات',
  unmapped: 'غير مصنف',
};
