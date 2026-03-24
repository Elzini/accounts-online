/**
 * Bookkeeping Office Module (Plugin)
 * Encapsulates accounting office-specific logic
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const BookkeepingModule: IndustryModule = {
  id: 'bookkeeping',
  name: 'مكتب محاسبة',
  supportedTypes: ['bookkeeping'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    return { extra: {} };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'clients', label: 'العملاء', icon: 'Users', path: '/bookkeeping/clients' },
      { id: 'tasks', label: 'المهام', icon: 'CheckSquare', path: '/bookkeeping/tasks' },
      { id: 'invoices', label: 'الفواتير', icon: 'FileText', path: '/invoices' },
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
      descriptionTemplate: 'مشتريات مكتب - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'sales_cash',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'أتعاب محاسبية - {reference} - {party}',
    },
  },

  labelOverrides: {
    'inv_item': 'الخدمة',
    'inv_add_item': 'إضافة خدمة',
    'inv_items': 'الخدمات',
    'purchases_title': 'مشتريات المكتب',
    'sales_title': 'أتعاب العملاء',
  },
};
