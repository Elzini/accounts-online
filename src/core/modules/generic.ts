/**
 * Generic Trading Module (Default Fallback)
 * Handles any company type that doesn't have a dedicated module
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const GenericModule: IndustryModule = {
  id: 'generic',
  name: 'تجارة عامة',
  supportedTypes: ['general_trading'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    return { extra: {} };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'invoices', label: 'الفواتير', icon: 'FileText', path: '/invoices' },
      { id: 'customers', label: 'العملاء', icon: 'Users', path: '/customers' },
      { id: 'suppliers', label: 'الموردين', icon: 'Truck', path: '/suppliers' },
    ];
  },

  getCoaTemplate(): string {
    return 'general_trading';
  },

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'مشتريات - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'sales_cash',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'مبيعات - {reference} - {party}',
    },
  },

  labelOverrides: {
    'inv_item': 'الصنف',
    'inv_add_item': 'إضافة صنف',
    'inv_items': 'الأصناف',
    'purchases_title': 'المشتريات',
    'sales_title': 'المبيعات',
  },
};
