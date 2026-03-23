/**
 * Built-In Reports - Data Definitions
 * Extracted from BuiltInReportsConfig.tsx to reduce file size (~290 lines → separate data file)
 */
import {
  FileText, BarChart3, ShoppingCart, Package, Users, Truck,
  DollarSign, Receipt, ArrowRightLeft, Building2,
  Calculator, BookOpen, ClipboardList, TrendingUp,
  Wallet, Scale,
} from 'lucide-react';
import React from 'react';

export interface ReportColumnConfig {
  field: string;
  label: string;
  defaultLabel: string;
  visible: boolean;
  order: number;
}

export interface BuiltInReportConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'sales' | 'purchases' | 'inventory' | 'financial' | 'accounting' | 'other';
  columns: ReportColumnConfig[];
  enabled: boolean;
}

export const BUILT_IN_REPORTS: Omit<BuiltInReportConfig, 'icon'>[] = [
  {
    key: 'sales_report', name: 'تقرير المبيعات', description: 'تفاصيل عمليات البيع والإيرادات',
    category: 'sales', enabled: true,
    columns: [
      { field: 'sale_number', label: 'رقم البيع', defaultLabel: 'رقم البيع', visible: true, order: 0 },
      { field: 'sale_date', label: 'تاريخ البيع', defaultLabel: 'تاريخ البيع', visible: true, order: 1 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 2 },
      { field: 'customer_name', label: 'العميل', defaultLabel: 'العميل', visible: true, order: 3 },
      { field: 'sale_price', label: 'سعر البيع', defaultLabel: 'سعر البيع', visible: true, order: 4 },
      { field: 'purchase_price', label: 'سعر الشراء', defaultLabel: 'سعر الشراء', visible: true, order: 5 },
      { field: 'profit', label: 'الربح', defaultLabel: 'الربح', visible: true, order: 6 },
      { field: 'commission', label: 'العمولة', defaultLabel: 'العمولة', visible: true, order: 7 },
      { field: 'seller_name', label: 'البائع', defaultLabel: 'البائع', visible: true, order: 8 },
      { field: 'payment_method', label: 'طريقة الدفع', defaultLabel: 'طريقة الدفع', visible: true, order: 9 },
    ],
  },
  {
    key: 'commissions_report', name: 'تقرير العمولات', description: 'تفاصيل عمولات البائعين',
    category: 'sales', enabled: true,
    columns: [
      { field: 'seller_name', label: 'البائع', defaultLabel: 'البائع', visible: true, order: 0 },
      { field: 'sale_date', label: 'تاريخ البيع', defaultLabel: 'تاريخ البيع', visible: true, order: 1 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 2 },
      { field: 'sale_price', label: 'سعر البيع', defaultLabel: 'سعر البيع', visible: true, order: 3 },
      { field: 'commission', label: 'العمولة', defaultLabel: 'العمولة', visible: true, order: 4 },
    ],
  },
  {
    key: 'purchases_report', name: 'تقرير المشتريات', description: 'تفاصيل عمليات الشراء',
    category: 'purchases', enabled: true,
    columns: [
      { field: 'inventory_number', label: 'رقم المخزون', defaultLabel: 'رقم المخزون', visible: true, order: 0 },
      { field: 'name', label: 'اسم السيارة', defaultLabel: 'اسم السيارة', visible: true, order: 1 },
      { field: 'chassis_number', label: 'رقم الشاسيه', defaultLabel: 'رقم الشاسيه', visible: true, order: 2 },
      { field: 'model', label: 'الموديل', defaultLabel: 'الموديل', visible: true, order: 3 },
      { field: 'color', label: 'اللون', defaultLabel: 'اللون', visible: true, order: 4 },
      { field: 'supplier_name', label: 'المورد', defaultLabel: 'المورد', visible: true, order: 5 },
      { field: 'purchase_price', label: 'سعر الشراء', defaultLabel: 'سعر الشراء', visible: true, order: 6 },
      { field: 'purchase_date', label: 'تاريخ الشراء', defaultLabel: 'تاريخ الشراء', visible: true, order: 7 },
      { field: 'payment_method', label: 'طريقة الدفع', defaultLabel: 'طريقة الدفع', visible: true, order: 8 },
    ],
  },
  {
    key: 'inventory_report', name: 'تقرير المخزون', description: 'حالة السيارات في المخزون',
    category: 'inventory', enabled: true,
    columns: [
      { field: 'inventory_number', label: 'رقم المخزون', defaultLabel: 'رقم المخزون', visible: true, order: 0 },
      { field: 'name', label: 'اسم السيارة', defaultLabel: 'اسم السيارة', visible: true, order: 1 },
      { field: 'chassis_number', label: 'رقم الشاسيه', defaultLabel: 'رقم الشاسيه', visible: true, order: 2 },
      { field: 'model', label: 'الموديل', defaultLabel: 'الموديل', visible: true, order: 3 },
      { field: 'color', label: 'اللون', defaultLabel: 'اللون', visible: true, order: 4 },
      { field: 'purchase_price', label: 'سعر الشراء', defaultLabel: 'سعر الشراء', visible: true, order: 5 },
      { field: 'purchase_date', label: 'تاريخ الشراء', defaultLabel: 'تاريخ الشراء', visible: true, order: 6 },
      { field: 'status', label: 'الحالة', defaultLabel: 'الحالة', visible: true, order: 7 },
    ],
  },
  {
    key: 'profit_report', name: 'تقرير الأرباح', description: 'تفاصيل الأرباح والمصاريف',
    category: 'financial', enabled: true,
    columns: [
      { field: 'sale_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 0 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 1 },
      { field: 'sale_price', label: 'سعر البيع', defaultLabel: 'سعر البيع', visible: true, order: 2 },
      { field: 'gross_profit', label: 'الربح الإجمالي', defaultLabel: 'الربح الإجمالي', visible: true, order: 3 },
      { field: 'car_expenses', label: 'مصروفات السيارة', defaultLabel: 'مصروفات السيارة', visible: true, order: 4 },
      { field: 'net_profit', label: 'صافي الربح', defaultLabel: 'صافي الربح', visible: true, order: 5 },
    ],
  },
  {
    key: 'customers_report', name: 'تقرير العملاء', description: 'بيانات وإحصائيات العملاء',
    category: 'other', enabled: true,
    columns: [
      { field: 'name', label: 'اسم العميل', defaultLabel: 'اسم العميل', visible: true, order: 0 },
      { field: 'phone', label: 'الهاتف', defaultLabel: 'الهاتف', visible: true, order: 1 },
      { field: 'id_number', label: 'رقم الهوية', defaultLabel: 'رقم الهوية', visible: true, order: 2 },
      { field: 'address', label: 'العنوان', defaultLabel: 'العنوان', visible: true, order: 3 },
      { field: 'total_purchases', label: 'إجمالي المشتريات', defaultLabel: 'إجمالي المشتريات', visible: true, order: 4 },
      { field: 'cars_count', label: 'عدد السيارات', defaultLabel: 'عدد السيارات', visible: true, order: 5 },
    ],
  },
  {
    key: 'suppliers_report', name: 'تقرير الموردين', description: 'بيانات وإحصائيات الموردين',
    category: 'other', enabled: true,
    columns: [
      { field: 'name', label: 'اسم المورد', defaultLabel: 'اسم المورد', visible: true, order: 0 },
      { field: 'phone', label: 'الهاتف', defaultLabel: 'الهاتف', visible: true, order: 1 },
      { field: 'id_number', label: 'رقم الهوية', defaultLabel: 'رقم الهوية', visible: true, order: 2 },
      { field: 'address', label: 'العنوان', defaultLabel: 'العنوان', visible: true, order: 3 },
      { field: 'total_supplies', label: 'إجمالي التوريدات', defaultLabel: 'إجمالي التوريدات', visible: true, order: 4 },
      { field: 'cars_count', label: 'عدد السيارات', defaultLabel: 'عدد السيارات', visible: true, order: 5 },
    ],
  },
  {
    key: 'transfers_report', name: 'تقرير التحويلات', description: 'تحويلات السيارات بين المعارض',
    category: 'other', enabled: true,
    columns: [
      { field: 'transfer_date', label: 'تاريخ التحويل', defaultLabel: 'تاريخ التحويل', visible: true, order: 0 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 1 },
      { field: 'partner_name', label: 'المعرض الشريك', defaultLabel: 'المعرض الشريك', visible: true, order: 2 },
      { field: 'transfer_type', label: 'نوع التحويل', defaultLabel: 'نوع التحويل', visible: true, order: 3 },
      { field: 'status', label: 'الحالة', defaultLabel: 'الحالة', visible: true, order: 4 },
      { field: 'commission', label: 'العمولة', defaultLabel: 'العمولة', visible: true, order: 5 },
    ],
  },
  {
    key: 'partner_report', name: 'تقرير المعارض الشريكة', description: 'إحصائيات المعارض الشريكة',
    category: 'other', enabled: true,
    columns: [
      { field: 'name', label: 'اسم المعرض', defaultLabel: 'اسم المعرض', visible: true, order: 0 },
      { field: 'contact_person', label: 'جهة الاتصال', defaultLabel: 'جهة الاتصال', visible: true, order: 1 },
      { field: 'phone', label: 'الهاتف', defaultLabel: 'الهاتف', visible: true, order: 2 },
      { field: 'total_transfers', label: 'إجمالي التحويلات', defaultLabel: 'إجمالي التحويلات', visible: true, order: 3 },
      { field: 'total_commission', label: 'إجمالي العمولات', defaultLabel: 'إجمالي العمولات', visible: true, order: 4 },
    ],
  },
  {
    key: 'account_movement_report', name: 'تقرير حركة الحسابات', description: 'حركة الحسابات المحاسبية',
    category: 'accounting', enabled: true,
    columns: [
      { field: 'entry_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 0 },
      { field: 'entry_number', label: 'رقم القيد', defaultLabel: 'رقم القيد', visible: true, order: 1 },
      { field: 'description', label: 'البيان', defaultLabel: 'البيان', visible: true, order: 2 },
      { field: 'debit', label: 'مدين', defaultLabel: 'مدين', visible: true, order: 3 },
      { field: 'credit', label: 'دائن', defaultLabel: 'دائن', visible: true, order: 4 },
      { field: 'balance', label: 'الرصيد', defaultLabel: 'الرصيد', visible: true, order: 5 },
    ],
  },
  {
    key: 'account_statement_report', name: 'كشف حساب مفصل', description: 'كشف حساب تفصيلي لكل حساب',
    category: 'accounting', enabled: true,
    columns: [
      { field: 'entry_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 0 },
      { field: 'entry_number', label: 'رقم القيد', defaultLabel: 'رقم القيد', visible: true, order: 1 },
      { field: 'reference_type', label: 'نوع المرجع', defaultLabel: 'نوع المرجع', visible: true, order: 2 },
      { field: 'description', label: 'البيان', defaultLabel: 'البيان', visible: true, order: 3 },
      { field: 'debit', label: 'مدين', defaultLabel: 'مدين', visible: true, order: 4 },
      { field: 'credit', label: 'دائن', defaultLabel: 'دائن', visible: true, order: 5 },
      { field: 'balance', label: 'الرصيد', defaultLabel: 'الرصيد', visible: true, order: 6 },
    ],
  },
  {
    key: 'trial_balance_report', name: 'ميزان المراجعة', description: 'ميزان المراجعة للحسابات',
    category: 'accounting', enabled: true,
    columns: [
      { field: 'account_code', label: 'رقم الحساب', defaultLabel: 'رقم الحساب', visible: true, order: 0 },
      { field: 'account_name', label: 'اسم الحساب', defaultLabel: 'اسم الحساب', visible: true, order: 1 },
      { field: 'opening_debit', label: 'رصيد أول مدين', defaultLabel: 'رصيد أول مدين', visible: true, order: 2 },
      { field: 'opening_credit', label: 'رصيد أول دائن', defaultLabel: 'رصيد أول دائن', visible: true, order: 3 },
      { field: 'movement_debit', label: 'حركة مدين', defaultLabel: 'حركة مدين', visible: true, order: 4 },
      { field: 'movement_credit', label: 'حركة دائن', defaultLabel: 'حركة دائن', visible: true, order: 5 },
      { field: 'closing_debit', label: 'رصيد ختامي مدين', defaultLabel: 'رصيد ختامي مدين', visible: true, order: 6 },
      { field: 'closing_credit', label: 'رصيد ختامي دائن', defaultLabel: 'رصيد ختامي دائن', visible: true, order: 7 },
    ],
  },
  {
    key: 'vouchers_report', name: 'تقرير السندات', description: 'سندات القبض والصرف',
    category: 'financial', enabled: true,
    columns: [
      { field: 'voucher_number', label: 'رقم السند', defaultLabel: 'رقم السند', visible: true, order: 0 },
      { field: 'voucher_type', label: 'نوع السند', defaultLabel: 'نوع السند', visible: true, order: 1 },
      { field: 'voucher_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 2 },
      { field: 'amount', label: 'المبلغ', defaultLabel: 'المبلغ', visible: true, order: 3 },
      { field: 'description', label: 'الوصف', defaultLabel: 'الوصف', visible: true, order: 4 },
      { field: 'beneficiary', label: 'المستفيد', defaultLabel: 'المستفيد', visible: true, order: 5 },
    ],
  },
  {
    key: 'journal_entries_report', name: 'تقرير القيود', description: 'قيود اليومية المحاسبية',
    category: 'accounting', enabled: true,
    columns: [
      { field: 'entry_number', label: 'رقم القيد', defaultLabel: 'رقم القيد', visible: true, order: 0 },
      { field: 'entry_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 1 },
      { field: 'description', label: 'البيان', defaultLabel: 'البيان', visible: true, order: 2 },
      { field: 'total_debit', label: 'إجمالي المدين', defaultLabel: 'إجمالي المدين', visible: true, order: 3 },
      { field: 'total_credit', label: 'إجمالي الدائن', defaultLabel: 'إجمالي الدائن', visible: true, order: 4 },
      { field: 'reference_type', label: 'نوع المرجع', defaultLabel: 'نوع المرجع', visible: true, order: 5 },
      { field: 'status', label: 'الحالة', defaultLabel: 'الحالة', visible: true, order: 6 },
    ],
  },
  {
    key: 'vat_return_report', name: 'إقرار ضريبة القيمة المضافة', description: 'تقرير الإقرار الضريبي',
    category: 'financial', enabled: true,
    columns: [
      { field: 'description', label: 'البند', defaultLabel: 'البند', visible: true, order: 0 },
      { field: 'amount', label: 'المبلغ', defaultLabel: 'المبلغ', visible: true, order: 1 },
      { field: 'vat_amount', label: 'مبلغ الضريبة', defaultLabel: 'مبلغ الضريبة', visible: true, order: 2 },
      { field: 'adjustment', label: 'التعديل', defaultLabel: 'التعديل', visible: true, order: 3 },
    ],
  },
];

export const REPORT_ICONS: Record<string, React.ReactNode> = {
  sales_report: React.createElement(BarChart3, { className: 'w-5 h-5' }),
  commissions_report: React.createElement(Wallet, { className: 'w-5 h-5' }),
  purchases_report: React.createElement(ShoppingCart, { className: 'w-5 h-5' }),
  inventory_report: React.createElement(Package, { className: 'w-5 h-5' }),
  profit_report: React.createElement(TrendingUp, { className: 'w-5 h-5' }),
  customers_report: React.createElement(Users, { className: 'w-5 h-5' }),
  suppliers_report: React.createElement(Truck, { className: 'w-5 h-5' }),
  transfers_report: React.createElement(ArrowRightLeft, { className: 'w-5 h-5' }),
  partner_report: React.createElement(Building2, { className: 'w-5 h-5' }),
  account_movement_report: React.createElement(BookOpen, { className: 'w-5 h-5' }),
  account_statement_report: React.createElement(ClipboardList, { className: 'w-5 h-5' }),
  trial_balance_report: React.createElement(Scale, { className: 'w-5 h-5' }),
  vouchers_report: React.createElement(Receipt, { className: 'w-5 h-5' }),
  journal_entries_report: React.createElement(Calculator, { className: 'w-5 h-5' }),
  vat_return_report: React.createElement(DollarSign, { className: 'w-5 h-5' }),
};

export const CATEGORY_LABELS: Record<string, string> = {
  sales: 'المبيعات', purchases: 'المشتريات', inventory: 'المخزون',
  financial: 'المالية', accounting: 'المحاسبة', other: 'أخرى',
};

export const CATEGORY_COLORS: Record<string, string> = {
  sales: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  purchases: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  inventory: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  financial: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  accounting: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};
