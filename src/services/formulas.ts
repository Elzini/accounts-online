// Formula Builder Service - خدمة بناء المعادلات
import { supabase } from '@/integrations/supabase/client';

// Types
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

// Fetch all formula variables
export async function fetchFormulaVariables(companyId?: string | null): Promise<FormulaVariable[]> {
  let query = supabase
    .from('formula_variables')
    .select('*')
    .order('variable_category', { ascending: true });

  // Prefer server-side isolation, but also filter here to avoid cross-company leakage
  if (companyId) {
    // system variables OR company variables
    query = query.or(`is_system.eq.true,company_id.eq.${companyId}`);
  } else {
    // only system variables when no company is selected
    query = query.eq('is_system', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Fetch formula definitions by category
export async function fetchFormulaDefinitions(companyId: string, category?: string): Promise<FormulaDefinition[]> {
  let query = supabase
    .from('formula_definitions')
    .select('*')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true });

  if (category) {
    query = query.eq('formula_category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Cast the JSONB formula_expression to FormulaNode[]
  return (data || []).map(item => ({
    ...item,
    formula_expression: (item.formula_expression as unknown) as FormulaNode[],
  }));
}

export async function seedDefaultFormulas(
  companyId: string,
  category: string
): Promise<{ inserted: number }>{
  const defaults = DEFAULT_FORMULAS[category] || [];
  if (defaults.length === 0) return { inserted: 0 };

  const { data: existing, error: existingError } = await supabase
    .from('formula_definitions')
    .select('formula_key, display_order')
    .eq('company_id', companyId)
    .eq('formula_category', category);

  if (existingError) throw existingError;

  const existingKeys = new Set((existing || []).map((r: any) => r.formula_key));
  const maxOrder = (existing || []).reduce((max: number, r: any) => Math.max(max, Number(r.display_order) || 0), -1);
  const startOrder = maxOrder >= 0 ? maxOrder + 1 : (existing?.length || 0);

  const missing = defaults.filter(d => !existingKeys.has(d.key));
  if (missing.length === 0) return { inserted: 0 };

  const rows = missing.map((d, idx) => ({
    company_id: companyId,
    formula_category: category,
    formula_key: d.key,
    formula_name: d.name,
    formula_expression: JSON.parse(JSON.stringify(d.expression)),
    description: null,
    is_active: true,
    display_order: startOrder + idx,
  }));

  const { error: insertError } = await supabase
    .from('formula_definitions')
    .insert(rows);

  if (insertError) throw insertError;
  return { inserted: rows.length };
}

// Save a formula definition
export async function saveFormulaDefinition(formula: Partial<FormulaDefinition> & { company_id: string }): Promise<FormulaDefinition> {
  // Convert FormulaNode[] to JSON compatible format
  const expressionAsJson = JSON.parse(JSON.stringify(formula.formula_expression || []));
  
  if (formula.id) {
    // Update existing
    const { data, error } = await supabase
      .from('formula_definitions')
      .update({
        formula_name: formula.formula_name,
        formula_expression: expressionAsJson,
        description: formula.description,
        is_active: formula.is_active,
        display_order: formula.display_order,
      })
      .eq('id', formula.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      formula_expression: (data.formula_expression as unknown) as FormulaNode[],
    };
  } else {
    // Insert new
    const insertData = {
      company_id: formula.company_id,
      formula_category: formula.formula_category!,
      formula_key: formula.formula_key!,
      formula_name: formula.formula_name!,
      formula_expression: expressionAsJson,
      description: formula.description,
      is_active: formula.is_active ?? true,
      display_order: formula.display_order ?? 0,
    };
    
    const { data, error } = await supabase
      .from('formula_definitions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      formula_expression: (data.formula_expression as unknown) as FormulaNode[],
    };
  }
}

// Delete a formula definition
export async function deleteFormulaDefinition(id: string): Promise<void> {
  const { error } = await supabase
    .from('formula_definitions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Create a custom variable
export async function createCustomVariable(variable: Partial<FormulaVariable> & { company_id: string }): Promise<FormulaVariable> {
  const { data, error } = await supabase
    .from('formula_variables')
    .insert({
      company_id: variable.company_id,
      variable_key: variable.variable_key,
      variable_name: variable.variable_name,
      variable_category: variable.variable_category,
      data_source: variable.data_source || 'custom',
      query_definition: variable.query_definition,
      is_system: false,
      icon: variable.icon,
      color: variable.color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a custom variable
export async function deleteCustomVariable(id: string): Promise<void> {
  const { error } = await supabase
    .from('formula_variables')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Evaluate a formula expression with given variable values
export function evaluateFormula(expression: FormulaNode[], variableValues: Record<string, number>): number {
  if (!expression || expression.length === 0) return 0;

  // Build the expression string
  let exprString = '';
  for (const node of expression) {
    switch (node.type) {
      case 'variable':
        const value = variableValues[node.value] ?? 0;
        exprString += value.toString();
        break;
      case 'operator':
        exprString += ` ${node.value} `;
        break;
      case 'number':
        exprString += node.value;
        break;
      case 'parenthesis':
        exprString += node.value;
        break;
      case 'function':
        // Handle functions specially
        exprString += node.value;
        break;
      default:
        exprString += node.value;
    }
  }

  // Safely evaluate the expression
  try {
    // Replace percentage operator with division by 100
    exprString = exprString.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');
    
    // Use Function constructor for safe evaluation (no access to global scope)
    const result = new Function('return ' + exprString)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return 0;
  } catch (error) {
    console.error('Error evaluating formula:', error, exprString);
    return 0;
  }
}

// Convert formula nodes to display string
export function formulaToString(expression: FormulaNode[]): string {
  if (!expression || expression.length === 0) return '';

  return expression.map(node => {
    if (node.type === 'variable') {
      return `[${node.label || node.value}]`;
    }
    if (node.type === 'operator') {
      const op = OPERATORS.find(o => o.value === node.value);
      return ` ${op?.label || node.value} `;
    }
    return node.value;
  }).join('');
}

// Generate a unique ID for formula nodes
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default formulas for different categories
export const DEFAULT_FORMULAS: Record<string, { key: string; name: string; expression: FormulaNode[] }[]> = {
  profit: [
    {
      key: 'gross_profit',
      name: 'إجمالي الربح',
      expression: [
        { id: '1', type: 'variable', value: 'gross_profit_from_sales', label: 'إجمالي الربح من المبيعات', color: 'green' },
      ],
    },
    {
      key: 'net_profit',
      name: 'صافي الربح',
      expression: [
        { id: '1', type: 'variable', value: 'gross_profit_from_sales', label: 'إجمالي الربح من المبيعات', color: 'green' },
        { id: '2', type: 'operator', value: '-' },
        { id: '3', type: 'variable', value: 'car_expenses', label: 'مصاريف السيارات', color: 'red' },
        { id: '4', type: 'operator', value: '-' },
        { id: '5', type: 'variable', value: 'payroll_total', label: 'إجمالي الرواتب', color: 'red' },
        { id: '6', type: 'operator', value: '-' },
        { id: '7', type: 'variable', value: 'rent_expenses', label: 'مصاريف الإيجار', color: 'red' },
        { id: '8', type: 'operator', value: '-' },
        { id: '9', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية', color: 'red' },
      ],
    },
  ],
  income_statement: [
    {
      key: 'revenue',
      name: 'الإيرادات',
      expression: [
        { id: '1', type: 'variable', value: 'total_sales', label: 'إجمالي المبيعات', color: 'green' },
      ],
    },
    {
      key: 'cost_of_revenue',
      name: 'تكلفة الإيرادات',
      expression: [
        { id: '1', type: 'variable', value: 'car_inventory', label: 'تكلفة المخزون المباع', color: 'red' },
      ],
    },
    {
      key: 'operating_profit',
      name: 'ربح العمليات',
      expression: [
        { id: '1', type: 'variable', value: 'gross_profit_from_sales', label: 'إجمالي الربح', color: 'green' },
        { id: '2', type: 'operator', value: '-' },
        { id: '3', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية وإدارية', color: 'red' },
      ],
    },
  ],

  // قائمة المركز المالي (Balance Sheet)
  balance_sheet: [
    {
      key: 'total_assets',
      name: 'إجمالي الأصول',
      expression: [
        { id: '1', type: 'variable', value: 'cash_and_banks', label: 'النقد والبنوك', color: 'blue' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'car_inventory', label: 'مخزون السيارات', color: 'blue' },
        { id: '4', type: 'operator', value: '+' },
        { id: '5', type: 'variable', value: 'accounts_receivable', label: 'الذمم المدينة', color: 'blue' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'prepaid_expenses_total', label: 'المصروفات المقدمة', color: 'blue' },
        { id: '8', type: 'operator', value: '+' },
        { id: '9', type: 'variable', value: 'fixed_assets_net', label: 'صافي الأصول الثابتة', color: 'blue' },
      ],
    },
    {
      key: 'total_liabilities',
      name: 'إجمالي الالتزامات',
      expression: [
        { id: '1', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'vat_payable', label: 'ضريبة القيمة المضافة المستحقة', color: 'red' },
        { id: '4', type: 'operator', value: '+' },
        { id: '5', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'finance_lease_liability', label: 'التزامات الإيجار التمويلي', color: 'red' },
      ],
    },
    {
      key: 'total_equity',
      name: 'إجمالي حقوق الملكية',
      expression: [
        { id: '1', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'statutory_reserve', label: 'الاحتياطي النظامي', color: 'indigo' },
        { id: '4', type: 'operator', value: '+' },
        { id: '5', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
      ],
    },
    {
      key: 'liabilities_and_equity',
      name: 'إجمالي الالتزامات وحقوق الملكية',
      expression: [
        { id: '1', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'vat_payable', label: 'ضريبة القيمة المضافة المستحقة', color: 'red' },
        { id: '4', type: 'operator', value: '+' },
        { id: '5', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'finance_lease_liability', label: 'التزامات الإيجار التمويلي', color: 'red' },
        { id: '8', type: 'operator', value: '+' },
        { id: '9', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
        { id: '10', type: 'operator', value: '+' },
        { id: '11', type: 'variable', value: 'statutory_reserve', label: 'الاحتياطي النظامي', color: 'indigo' },
        { id: '12', type: 'operator', value: '+' },
        { id: '13', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
        { id: '14', type: 'operator', value: '+' },
        { id: '15', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
      ],
    },
    {
      key: 'balance_sheet_difference',
      name: 'فرق الميزانية (الأصول - الالتزامات وحقوق الملكية)',
      expression: [
        { id: '1', type: 'variable', value: 'cash_and_banks', label: 'النقد والبنوك', color: 'blue' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'car_inventory', label: 'مخزون السيارات', color: 'blue' },
        { id: '4', type: 'operator', value: '+' },
        { id: '5', type: 'variable', value: 'accounts_receivable', label: 'الذمم المدينة', color: 'blue' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'prepaid_expenses_total', label: 'المصروفات المقدمة', color: 'blue' },
        { id: '8', type: 'operator', value: '+' },
        { id: '9', type: 'variable', value: 'fixed_assets_net', label: 'صافي الأصول الثابتة', color: 'blue' },
        { id: '10', type: 'operator', value: '-' },
        { id: '11', type: 'parenthesis', value: '(' },
        { id: '12', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
        { id: '13', type: 'operator', value: '+' },
        { id: '14', type: 'variable', value: 'vat_payable', label: 'ضريبة القيمة المضافة المستحقة', color: 'red' },
        { id: '15', type: 'operator', value: '+' },
        { id: '16', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
        { id: '17', type: 'operator', value: '+' },
        { id: '18', type: 'variable', value: 'finance_lease_liability', label: 'التزامات الإيجار التمويلي', color: 'red' },
        { id: '19', type: 'operator', value: '+' },
        { id: '20', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
        { id: '21', type: 'operator', value: '+' },
        { id: '22', type: 'variable', value: 'statutory_reserve', label: 'الاحتياطي النظامي', color: 'indigo' },
        { id: '23', type: 'operator', value: '+' },
        { id: '24', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
        { id: '25', type: 'operator', value: '+' },
        { id: '26', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
        { id: '27', type: 'parenthesis', value: ')' },
      ],
    },
  ],

  // قائمة التدفقات النقدية (Cash Flow) - قوالب مبسطة قابلة للتعديل
  cash_flow: [
    {
      key: 'cash_ending_balance',
      name: 'رصيد النقد نهاية الفترة',
      expression: [
        { id: '1', type: 'variable', value: 'cash_and_banks', label: 'النقد والبنوك', color: 'blue' },
      ],
    },
    {
      key: 'operating_cash_flow_indirect',
      name: 'التدفقات من التشغيل (طريقة غير مباشرة - قالب)',
      expression: [
        { id: '1', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
        { id: '4', type: 'operator', value: '-' },
        { id: '5', type: 'variable', value: 'accounts_receivable', label: 'الذمم المدينة', color: 'blue' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
        { id: '8', type: 'operator', value: '-' },
        { id: '9', type: 'variable', value: 'prepaid_expenses_total', label: 'المصروفات المقدمة', color: 'blue' },
      ],
    },
    {
      key: 'financing_cash_flow_simplified',
      name: 'تدفقات التمويل (قالب مبسط)',
      expression: [
        { id: '1', type: 'number', value: '0' },
        { id: '2', type: 'operator', value: '-' },
        { id: '3', type: 'variable', value: 'financing_costs', label: 'تكاليف التمويل', color: 'red' },
      ],
    },
  ],

  // ميزان المراجعة (Trial Balance) - مؤشرات/مجاميع مبسطة قابلة للتعديل
  trial_balance: [
    {
      key: 'total_revenue_tb',
      name: 'إجمالي الإيرادات (قالب)',
      expression: [
        { id: '1', type: 'variable', value: 'total_sales', label: 'إجمالي المبيعات', color: 'green' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'commissions_earned', label: 'العمولات المكتسبة', color: 'green' },
      ],
    },
    {
      key: 'total_expenses_tb',
      name: 'إجمالي المصروفات (قالب)',
      expression: [
        { id: '1', type: 'variable', value: 'car_expenses', label: 'مصاريف السيارات', color: 'red' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'payroll_total', label: 'إجمالي الرواتب والبدلات', color: 'red' },
        { id: '4', type: 'operator', value: '+' },
        { id: '5', type: 'variable', value: 'rent_expenses', label: 'مصاريف الإيجار', color: 'red' },
        { id: '6', type: 'operator', value: '+' },
        { id: '7', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية وإدارية', color: 'red' },
        { id: '8', type: 'operator', value: '+' },
        { id: '9', type: 'variable', value: 'vat_expenses', label: 'ضريبة القيمة المضافة', color: 'red' },
        { id: '10', type: 'operator', value: '+' },
        { id: '11', type: 'variable', value: 'financing_costs', label: 'تكاليف التمويل', color: 'red' },
      ],
    },
    {
      key: 'net_profit_tb_check',
      name: 'صافي الربح (تحقق - قالب)',
      expression: [
        { id: '1', type: 'parenthesis', value: '(' },
        { id: '2', type: 'variable', value: 'total_sales', label: 'إجمالي المبيعات', color: 'green' },
        { id: '3', type: 'operator', value: '+' },
        { id: '4', type: 'variable', value: 'commissions_earned', label: 'العمولات المكتسبة', color: 'green' },
        { id: '5', type: 'parenthesis', value: ')' },
        { id: '6', type: 'operator', value: '-' },
        { id: '7', type: 'parenthesis', value: '(' },
        { id: '8', type: 'variable', value: 'car_expenses', label: 'مصاريف السيارات', color: 'red' },
        { id: '9', type: 'operator', value: '+' },
        { id: '10', type: 'variable', value: 'payroll_total', label: 'إجمالي الرواتب والبدلات', color: 'red' },
        { id: '11', type: 'operator', value: '+' },
        { id: '12', type: 'variable', value: 'rent_expenses', label: 'مصاريف الإيجار', color: 'red' },
        { id: '13', type: 'operator', value: '+' },
        { id: '14', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية وإدارية', color: 'red' },
        { id: '15', type: 'operator', value: '+' },
        { id: '16', type: 'variable', value: 'vat_expenses', label: 'ضريبة القيمة المضافة', color: 'red' },
        { id: '17', type: 'operator', value: '+' },
        { id: '18', type: 'variable', value: 'financing_costs', label: 'تكاليف التمويل', color: 'red' },
        { id: '19', type: 'parenthesis', value: ')' },
      ],
    },
  ],

  zakat: [
    {
      key: 'zakat_base',
      name: 'الوعاء الزكوي',
      expression: [
        { id: '1', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
        { id: '2', type: 'operator', value: '+' },
        { id: '3', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
        { id: '4', type: 'operator', value: '-' },
        { id: '5', type: 'variable', value: 'fixed_assets_net', label: 'صافي الأصول الثابتة', color: 'blue' },
      ],
    },
    {
      key: 'zakat_due',
      name: 'الزكاة المستحقة',
      expression: [
        { id: '1', type: 'variable', value: 'zakat_base', label: 'الوعاء الزكوي', color: 'amber' },
        { id: '2', type: 'operator', value: '*' },
        { id: '3', type: 'number', value: '0.025' },
      ],
    },
  ],
};
