/**
 * Export/Import Module (Plugin)
 * Encapsulates import/export trading-specific logic
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const ExportImportModule: IndustryModule = {
  id: 'export_import',
  name: 'الاستيراد والتصدير',
  supportedTypes: ['export_import'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    return { extra: {} };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'invoices', label: 'الفواتير', icon: 'FileText', path: '/invoices' },
      { id: 'suppliers', label: 'الموردين', icon: 'Truck', path: '/suppliers' },
      { id: 'customers', label: 'العملاء', icon: 'Users', path: '/customers' },
      { id: 'shipments', label: 'الشحنات', icon: 'Ship', path: '/shipments' },
    ];
  },

  getCoaTemplate(): string {
    return 'export_import';
  },

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'استيراد بضاعة - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'sales_cash',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'تصدير بضاعة - {reference} - {party}',
    },
  },

  purchaseItemTypes: [
    {
      id: 'imported_goods',
      label: 'بضاعة مستوردة',
      table: 'invoice_items',
      fields: [
        { key: 'item_name', label: 'اسم الصنف', type: 'text', required: true },
        { key: 'quantity', label: 'الكمية', type: 'number', required: true },
        { key: 'unit_price', label: 'سعر الوحدة', type: 'number', required: true },
      ],
    },
  ],

  labelOverrides: {
    'inv_item': 'الصنف',
    'inv_add_item': 'إضافة صنف',
    'inv_items': 'الأصناف',
    'purchases_title': 'فواتير الاستيراد',
    'sales_title': 'فواتير التصدير',
    'inventory_title': 'المخزون',
  },
};
