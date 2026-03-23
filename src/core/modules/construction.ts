/**
 * Construction Module (Plugin)
 * Encapsulates construction-specific logic
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';
import { supabase } from '@/hooks/modules/useMiscServices';

export const ConstructionModule: IndustryModule = {
  id: 'construction',
  name: 'المقاولات',
  supportedTypes: ['construction'],

  async getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>> {
    const [projectsRes] = await Promise.all([
      supabase.from('advanced_projects').select('id, status, budget, spent').eq('company_id', companyId),
    ]);

    const projects = projectsRes.data || [];
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;

    return {
      extra: {
        activeProjects,
        totalProjects: projects.length,
        totalBudget: projects.reduce((s, p) => s + (Number(p.budget) || 0), 0),
        totalSpent: projects.reduce((s, p) => s + (Number(p.spent) || 0), 0),
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'projects', label: 'المشاريع', icon: 'HardHat', path: '/projects' },
      { id: 'contracts', label: 'العقود', icon: 'FileText', path: '/contracts' },
      { id: 'progress-billings', label: 'المستخلصات', icon: 'Receipt', path: '/progress-billings' },
    ];
  },

  getCoaTemplate(): string {
    return 'construction';
  },

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'مشتريات مشروع - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'customers',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'مستخلص مشروع - {reference} - {party}',
    },
  },

  purchaseItemTypes: [
    {
      id: 'material',
      label: 'مواد بناء',
      table: 'invoice_items',
      fields: [
        { key: 'item_name', label: 'اسم الصنف', type: 'text', required: true },
        { key: 'quantity', label: 'الكمية', type: 'number', required: true },
        { key: 'unit_price', label: 'سعر الوحدة', type: 'number', required: true },
      ],
    },
  ],

  dashboardCards: [
    { id: 'active-projects', title: 'مشاريع نشطة', icon: 'HardHat', valueKey: 'activeProjects', format: 'number' },
    { id: 'total-budget', title: 'إجمالي الميزانيات', icon: 'Wallet', valueKey: 'totalBudget', format: 'currency' },
  ],

  labelOverrides: {
    'inv_item': 'المادة',
    'inv_add_item': 'إضافة مادة',
    'purchases_title': 'مشتريات المشاريع',
    'sales_title': 'المستخلصات',
  },
};
