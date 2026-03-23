import { FormulaNode } from './types';

export const DEFAULT_FORMULAS: Record<string, { key: string; name: string; expression: FormulaNode[] }[]> = {
  profit: [
    { key: 'gross_profit', name: 'إجمالي الربح', expression: [{ id: '1', type: 'variable', value: 'gross_profit_from_sales', label: 'إجمالي الربح من المبيعات', color: 'green' }] },
    { key: 'net_profit', name: 'صافي الربح', expression: [
      { id: '1', type: 'variable', value: 'gross_profit_from_sales', label: 'إجمالي الربح من المبيعات', color: 'green' },
      { id: '2', type: 'operator', value: '-' }, { id: '3', type: 'variable', value: 'car_expenses', label: 'مصاريف السيارات', color: 'red' },
      { id: '4', type: 'operator', value: '-' }, { id: '5', type: 'variable', value: 'payroll_total', label: 'إجمالي الرواتب', color: 'red' },
      { id: '6', type: 'operator', value: '-' }, { id: '7', type: 'variable', value: 'rent_expenses', label: 'مصاريف الإيجار', color: 'red' },
      { id: '8', type: 'operator', value: '-' }, { id: '9', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية', color: 'red' },
    ] },
  ],
  income_statement: [
    { key: 'revenue', name: 'الإيرادات', expression: [{ id: '1', type: 'variable', value: 'total_sales', label: 'إجمالي المبيعات', color: 'green' }] },
    { key: 'cost_of_revenue', name: 'تكلفة الإيرادات', expression: [{ id: '1', type: 'variable', value: 'car_inventory', label: 'تكلفة المخزون المباع', color: 'red' }] },
    { key: 'operating_profit', name: 'ربح العمليات', expression: [
      { id: '1', type: 'variable', value: 'gross_profit_from_sales', label: 'إجمالي الربح', color: 'green' },
      { id: '2', type: 'operator', value: '-' }, { id: '3', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية وإدارية', color: 'red' },
    ] },
  ],
  balance_sheet: [
    { key: 'total_assets', name: 'إجمالي الأصول', expression: [
      { id: '1', type: 'variable', value: 'cash_and_banks', label: 'النقد والبنوك', color: 'blue' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'car_inventory', label: 'مخزون السيارات', color: 'blue' },
      { id: '4', type: 'operator', value: '+' }, { id: '5', type: 'variable', value: 'accounts_receivable', label: 'الذمم المدينة', color: 'blue' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'prepaid_expenses_total', label: 'المصروفات المقدمة', color: 'blue' },
      { id: '8', type: 'operator', value: '+' }, { id: '9', type: 'variable', value: 'fixed_assets_net', label: 'صافي الأصول الثابتة', color: 'blue' },
    ] },
    { key: 'total_liabilities', name: 'إجمالي الالتزامات', expression: [
      { id: '1', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'vat_payable', label: 'ضريبة القيمة المضافة المستحقة', color: 'red' },
      { id: '4', type: 'operator', value: '+' }, { id: '5', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'finance_lease_liability', label: 'التزامات الإيجار التمويلي', color: 'red' },
    ] },
    { key: 'total_equity', name: 'إجمالي حقوق الملكية', expression: [
      { id: '1', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'statutory_reserve', label: 'الاحتياطي النظامي', color: 'indigo' },
      { id: '4', type: 'operator', value: '+' }, { id: '5', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
    ] },
    { key: 'liabilities_and_equity', name: 'إجمالي الالتزامات وحقوق الملكية', expression: [
      { id: '1', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'vat_payable', label: 'ضريبة القيمة المضافة المستحقة', color: 'red' },
      { id: '4', type: 'operator', value: '+' }, { id: '5', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'finance_lease_liability', label: 'التزامات الإيجار التمويلي', color: 'red' },
      { id: '8', type: 'operator', value: '+' }, { id: '9', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
      { id: '10', type: 'operator', value: '+' }, { id: '11', type: 'variable', value: 'statutory_reserve', label: 'الاحتياطي النظامي', color: 'indigo' },
      { id: '12', type: 'operator', value: '+' }, { id: '13', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
      { id: '14', type: 'operator', value: '+' }, { id: '15', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
    ] },
    { key: 'balance_sheet_difference', name: 'فرق الميزانية (الأصول - الالتزامات وحقوق الملكية)', expression: [
      { id: '1', type: 'variable', value: 'cash_and_banks', label: 'النقد والبنوك', color: 'blue' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'car_inventory', label: 'مخزون السيارات', color: 'blue' },
      { id: '4', type: 'operator', value: '+' }, { id: '5', type: 'variable', value: 'accounts_receivable', label: 'الذمم المدينة', color: 'blue' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'prepaid_expenses_total', label: 'المصروفات المقدمة', color: 'blue' },
      { id: '8', type: 'operator', value: '+' }, { id: '9', type: 'variable', value: 'fixed_assets_net', label: 'صافي الأصول الثابتة', color: 'blue' },
      { id: '10', type: 'operator', value: '-' }, { id: '11', type: 'parenthesis', value: '(' },
      { id: '12', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
      { id: '13', type: 'operator', value: '+' }, { id: '14', type: 'variable', value: 'vat_payable', label: 'ضريبة القيمة المضافة المستحقة', color: 'red' },
      { id: '15', type: 'operator', value: '+' }, { id: '16', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
      { id: '17', type: 'operator', value: '+' }, { id: '18', type: 'variable', value: 'finance_lease_liability', label: 'التزامات الإيجار التمويلي', color: 'red' },
      { id: '19', type: 'operator', value: '+' }, { id: '20', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
      { id: '21', type: 'operator', value: '+' }, { id: '22', type: 'variable', value: 'statutory_reserve', label: 'الاحتياطي النظامي', color: 'indigo' },
      { id: '23', type: 'operator', value: '+' }, { id: '24', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
      { id: '25', type: 'operator', value: '+' }, { id: '26', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
      { id: '27', type: 'parenthesis', value: ')' },
    ] },
  ],
  cash_flow: [
    { key: 'cash_ending_balance', name: 'رصيد النقد نهاية الفترة', expression: [{ id: '1', type: 'variable', value: 'cash_and_banks', label: 'النقد والبنوك', color: 'blue' }] },
    { key: 'operating_cash_flow_indirect', name: 'التدفقات من التشغيل (طريقة غير مباشرة - قالب)', expression: [
      { id: '1', type: 'variable', value: 'net_profit', label: 'صافي الربح', color: 'green' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'employee_benefits', label: 'مخصص مكافأة نهاية الخدمة', color: 'red' },
      { id: '4', type: 'operator', value: '-' }, { id: '5', type: 'variable', value: 'accounts_receivable', label: 'الذمم المدينة', color: 'blue' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'accounts_payable', label: 'الذمم الدائنة', color: 'red' },
      { id: '8', type: 'operator', value: '-' }, { id: '9', type: 'variable', value: 'prepaid_expenses_total', label: 'المصروفات المقدمة', color: 'blue' },
    ] },
    { key: 'financing_cash_flow_simplified', name: 'تدفقات التمويل (قالب مبسط)', expression: [
      { id: '1', type: 'number', value: '0' },
      { id: '2', type: 'operator', value: '-' }, { id: '3', type: 'variable', value: 'financing_costs', label: 'تكاليف التمويل', color: 'red' },
    ] },
  ],
  trial_balance: [
    { key: 'total_revenue_tb', name: 'إجمالي الإيرادات (قالب)', expression: [
      { id: '1', type: 'variable', value: 'total_sales', label: 'إجمالي المبيعات', color: 'green' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'commissions_earned', label: 'العمولات المكتسبة', color: 'green' },
    ] },
    { key: 'total_expenses_tb', name: 'إجمالي المصروفات (قالب)', expression: [
      { id: '1', type: 'variable', value: 'car_expenses', label: 'مصاريف السيارات', color: 'red' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'payroll_total', label: 'إجمالي الرواتب والبدلات', color: 'red' },
      { id: '4', type: 'operator', value: '+' }, { id: '5', type: 'variable', value: 'rent_expenses', label: 'مصاريف الإيجار', color: 'red' },
      { id: '6', type: 'operator', value: '+' }, { id: '7', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية وإدارية', color: 'red' },
      { id: '8', type: 'operator', value: '+' }, { id: '9', type: 'variable', value: 'vat_expenses', label: 'ضريبة القيمة المضافة', color: 'red' },
      { id: '10', type: 'operator', value: '+' }, { id: '11', type: 'variable', value: 'financing_costs', label: 'تكاليف التمويل', color: 'red' },
    ] },
    { key: 'net_profit_tb_check', name: 'صافي الربح (تحقق - قالب)', expression: [
      { id: '1', type: 'parenthesis', value: '(' },
      { id: '2', type: 'variable', value: 'total_sales', label: 'إجمالي المبيعات', color: 'green' },
      { id: '3', type: 'operator', value: '+' }, { id: '4', type: 'variable', value: 'commissions_earned', label: 'العمولات المكتسبة', color: 'green' },
      { id: '5', type: 'parenthesis', value: ')' },
      { id: '6', type: 'operator', value: '-' }, { id: '7', type: 'parenthesis', value: '(' },
      { id: '8', type: 'variable', value: 'car_expenses', label: 'مصاريف السيارات', color: 'red' },
      { id: '9', type: 'operator', value: '+' }, { id: '10', type: 'variable', value: 'payroll_total', label: 'إجمالي الرواتب والبدلات', color: 'red' },
      { id: '11', type: 'operator', value: '+' }, { id: '12', type: 'variable', value: 'rent_expenses', label: 'مصاريف الإيجار', color: 'red' },
      { id: '13', type: 'operator', value: '+' }, { id: '14', type: 'variable', value: 'general_expenses', label: 'مصاريف عمومية وإدارية', color: 'red' },
      { id: '15', type: 'operator', value: '+' }, { id: '16', type: 'variable', value: 'vat_expenses', label: 'ضريبة القيمة المضافة', color: 'red' },
      { id: '17', type: 'operator', value: '+' }, { id: '18', type: 'variable', value: 'financing_costs', label: 'تكاليف التمويل', color: 'red' },
      { id: '19', type: 'parenthesis', value: ')' },
    ] },
  ],
  zakat: [
    { key: 'zakat_base', name: 'الوعاء الزكوي', expression: [
      { id: '1', type: 'variable', value: 'capital', label: 'رأس المال', color: 'indigo' },
      { id: '2', type: 'operator', value: '+' }, { id: '3', type: 'variable', value: 'retained_earnings', label: 'الأرباح المبقاة', color: 'indigo' },
      { id: '4', type: 'operator', value: '-' }, { id: '5', type: 'variable', value: 'fixed_assets_net', label: 'صافي الأصول الثابتة', color: 'blue' },
    ] },
    { key: 'zakat_due', name: 'الزكاة المستحقة', expression: [
      { id: '1', type: 'variable', value: 'zakat_base', label: 'الوعاء الزكوي', color: 'amber' },
      { id: '2', type: 'operator', value: '*' }, { id: '3', type: 'number', value: '0.025' },
    ] },
  ],
};
