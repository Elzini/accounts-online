/**
 * Restaurant Module (Plugin)
 * Encapsulates restaurant-specific logic: stats, menus, posting rules, labels
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const RestaurantModule: IndustryModule = {
  id: 'restaurant',
  name: 'المطاعم والكافيهات',
  supportedTypes: ['restaurant'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    return { extra: {} };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'invoices', label: 'الفواتير', icon: 'FileText', path: '/invoices' },
      { id: 'inventory', label: 'المخزون', icon: 'Package', path: '/inventory' },
      { id: 'suppliers', label: 'الموردين', icon: 'Truck', path: '/suppliers' },
      { id: 'customers', label: 'العملاء', icon: 'Users', path: '/customers' },
    ];
  },

  getCoaTemplate(): string {
    return 'restaurant';
  },

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'مشتريات مواد غذائية - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'sales_cash',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'مبيعات مطعم - {reference} - {party}',
    },
  },

  purchaseItemTypes: [
    {
      id: 'food_material',
      label: 'مواد غذائية',
      table: 'invoice_items',
      fields: [
        { key: 'item_name', label: 'اسم الصنف', type: 'text', required: true },
        { key: 'quantity', label: 'الكمية', type: 'number', required: true },
        { key: 'unit_price', label: 'سعر الوحدة', type: 'number', required: true },
      ],
    },
  ],

  dashboardCards: [
    { id: 'daily-sales', title: 'مبيعات اليوم', icon: 'TrendingUp', valueKey: 'todayTransactions', format: 'currency' },
  ],

  labelOverrides: {
    'inv_item': 'الصنف',
    'inv_add_item': 'إضافة صنف',
    'inv_items': 'الأصناف',
    'purchases_title': 'مشتريات المطعم',
    'sales_title': 'مبيعات المطعم',
    'inventory_title': 'مخزون المطعم',
  },
};
