export interface FormulaNode {
  id: string;
  type: 'variable' | 'operator' | 'number' | 'parenthesis' | 'function';
  value: string;
  label?: string;
  color?: string;
  icon?: string;
}

export interface FormulaDefinition {
  id: string;
  company_id: string;
  formula_category: string;
  formula_key: string;
  formula_name: string;
  formula_expression: FormulaNode[];
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FormulaVariable {
  id: string;
  company_id?: string;
  variable_key: string;
  variable_name: string;
  variable_category: string;
  data_source: string;
  query_definition?: any;
  is_system: boolean;
  icon?: string;
  color?: string;
}

export const FORMULA_CATEGORIES = [
  { key: 'profit', label: 'حساب الأرباح', icon: 'TrendingUp' },
  { key: 'income_statement', label: 'قائمة الدخل', icon: 'FileText' },
  { key: 'balance_sheet', label: 'قائمة المركز المالي', icon: 'Scale' },
  { key: 'cash_flow', label: 'قائمة التدفقات النقدية', icon: 'Wallet' },
  { key: 'zakat', label: 'حسابات الزكاة', icon: 'Calculator' },
  { key: 'trial_balance', label: 'ميزان المراجعة', icon: 'BarChart3' },
];

export const OPERATORS = [
  { value: '+', label: '+', type: 'add', description: 'جمع' },
  { value: '-', label: '-', type: 'subtract', description: 'طرح' },
  { value: '*', label: '×', type: 'multiply', description: 'ضرب' },
  { value: '/', label: '÷', type: 'divide', description: 'قسمة' },
  { value: '%', label: '%', type: 'percentage', description: 'نسبة مئوية' },
];

export const FUNCTIONS = [
  { value: 'SUM', label: 'مجموع', description: 'جمع مجموعة من القيم' },
  { value: 'AVG', label: 'متوسط', description: 'حساب المتوسط' },
  { value: 'MAX', label: 'أقصى', description: 'أكبر قيمة' },
  { value: 'MIN', label: 'أدنى', description: 'أصغر قيمة' },
  { value: 'ABS', label: 'قيمة مطلقة', description: 'القيمة المطلقة' },
  { value: 'ROUND', label: 'تقريب', description: 'تقريب الرقم' },
  { value: 'IF', label: 'شرط', description: 'قيمة شرطية' },
];
