/**
 * Real Estate Module (Plugin)
 * Fully encapsulates real-estate-specific logic: stats, menus, posting rules, reports, labels
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';
import { supabase } from '@/hooks/modules/useMiscServices';

export const RealEstateModule: IndustryModule = {
  id: 'real_estate',
  name: 'التطوير العقاري',
  supportedTypes: ['real_estate'],

  async getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>> {
    const [projectsRes, unitsRes] = await Promise.all([
      supabase.from('re_projects').select('id, name, status, total_budget, total_spent').eq('company_id', companyId),
      supabase.from('re_units').select('id, status, sale_price').eq('company_id', companyId),
    ]);

    const projects = projectsRes.data || [];
    const units = unitsRes.data || [];

    const activeProjects = projects.filter(
      p => !['completed', 'cancelled', 'canceled'].includes((p.status || '').toLowerCase())
    );
    const soldUnits = units.filter(u => u.status === 'sold').length;
    const availableUnits = units.filter(u => u.status === 'available').length;

    return {
      extra: {
        activeProjects: activeProjects.length,
        totalProjects: projects.length,
        activeProjectNames: activeProjects.map(p => p.name),
        soldUnits,
        availableUnits,
        totalUnits: units.length,
        totalBudget: projects.reduce((s, p) => s + (Number(p.total_budget) || 0), 0),
        totalSpent: projects.reduce((s, p) => s + (Number(p.total_spent) || 0), 0),
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 're-projects', label: 'المشاريع', icon: 'Building', path: '/real-estate/projects' },
      { id: 're-units', label: 'الوحدات', icon: 'Home', path: '/real-estate/units' },
      { id: 're-contractors', label: 'المقاولين', icon: 'HardHat', path: '/real-estate/contractors' },
      { id: 're-crm', label: 'إدارة العملاء', icon: 'Users', path: '/real-estate/crm' },
      { id: 're-after-sales', label: 'خدمات ما بعد البيع', icon: 'Wrench', path: '/real-estate/after-sales' },
    ];
  },

  getCoaTemplate(): string {
    return 'real_estate';
  },

  // === Extended Plugin Properties ===

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
      descriptionTemplate: 'بيع وحدة - {reference} - {party}',
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

  reports: [
    {
      id: 're-project-profitability',
      title: 'ربحية المشاريع',
      subtitle: 'تحليل إيرادات ومصروفات كل مشروع',
      table: 're_projects',
      columns: [
        { header: 'المشروع', key: 'name', type: 'text' },
        { header: 'الميزانية', key: 'total_budget', type: 'currency' },
        { header: 'المصروف', key: 'total_spent', type: 'currency' },
        { header: 'الحالة', key: 'status', type: 'status' },
      ],
      statusOptions: [
        { value: 'active', label: 'نشط' },
        { value: 'completed', label: 'مكتمل' },
        { value: 'on_hold', label: 'معلق' },
      ],
    },
  ],

  dashboardCards: [
    { id: 'active-projects', title: 'مشاريع نشطة', icon: 'Building', valueKey: 'activeProjects', format: 'number' },
    { id: 'sold-units', title: 'وحدات مباعة', icon: 'Home', valueKey: 'soldUnits', format: 'number' },
    { id: 'available-units', title: 'وحدات متاحة', icon: 'Key', valueKey: 'availableUnits', format: 'number' },
  ],

  labelOverrides: {
    'inv_item': 'المادة',
    'inv_add_item': 'إضافة مادة',
    'inv_items': 'المواد',
    'purchases_title': 'مشتريات المشاريع',
    'sales_title': 'مبيعات الوحدات',
    'inventory_title': 'الوحدات العقارية',
  },
};
