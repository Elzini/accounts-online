/**
 * System Control - Constants & Configuration Data
 */

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

export const STATEMENT_TYPES = [
  { type: 'balance_sheet', label: 'الميزانية العمومية' },
  { type: 'income_statement', label: 'قائمة الدخل' },
  { type: 'cash_flow', label: 'قائمة التدفقات النقدية' },
  { type: 'trial_balance', label: 'ميزان المراجعة' },
  { type: 'vat_return', label: 'إقرار ضريبة القيمة المضافة' },
  { type: 'zakat', label: 'إقرار الزكاة' },
];

export const TRIGGER_TYPES = [
  { type: 'sale', label: 'عند البيع' },
  { type: 'purchase', label: 'عند الشراء' },
  { type: 'expense', label: 'عند تسجيل مصروف' },
  { type: 'voucher', label: 'عند إنشاء سند' },
  { type: 'payroll', label: 'عند صرف الرواتب' },
  { type: 'prepaid_expense', label: 'عند إطفاء مصروف مقدم' },
];
