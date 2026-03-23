/**
 * Real Estate Module
 * Provides real estate-specific dashboard stats and menu items
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';
import { supabase } from '@/integrations/supabase/client';

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
};
