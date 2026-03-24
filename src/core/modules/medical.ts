/**
 * Medical Module (Plugin)
 * Encapsulates medical supply/clinic-specific logic
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const MedicalModule: IndustryModule = {
  id: 'medical',
  name: 'القطاع الطبي',
  supportedTypes: ['medical'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    return { extra: {} };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'invoices', label: 'الفواتير', icon: 'FileText', path: '/invoices' },
      { id: 'inventory', label: 'المخزون الطبي', icon: 'Package', path: '/inventory' },
      { id: 'suppliers', label: 'الموردين', icon: 'Truck', path: '/suppliers' },
      { id: 'customers', label: 'العملاء', icon: 'Users', path: '/customers' },
    ];
  },

  getCoaTemplate(): string {
    return 'medical';
  },

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'مشتريات طبية - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'sales_cash',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'مبيعات طبية - {reference} - {party}',
    },
  },

  purchaseItemTypes: [
    {
      id: 'medical_supply',
      label: 'مستلزمات طبية',
      table: 'invoice_items',
      fields: [
        { key: 'item_name', label: 'اسم الصنف', type: 'text', required: true },
        { key: 'quantity', label: 'الكمية', type: 'number', required: true },
        { key: 'unit_price', label: 'سعر الوحدة', type: 'number', required: true },
      ],
    },
  ],

  labelOverrides: {
    'inv_item': 'الصنف الطبي',
    'inv_add_item': 'إضافة صنف طبي',
    'inv_items': 'الأصناف الطبية',
    'purchases_title': 'مشتريات طبية',
    'sales_title': 'مبيعات طبية',
    'inventory_title': 'المخزون الطبي',
  },
};
