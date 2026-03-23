/**
 * Real Estate Module
 * Registered as an industry module in the Core Engine
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const RealEstateModule: IndustryModule = {
  id: 'real_estate',
  name: 'التطوير العقاري',
  supportedTypes: ['real_estate'],

  async getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>> {
    // Extend core stats with real estate specifics
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: projects } = await supabase
      .from('re_projects')
      .select('id, name, status')
      .eq('company_id', companyId);

    const activeProjects = (projects || []).filter(
      p => !['completed', 'cancelled', 'canceled'].includes((p.status || '').toLowerCase())
    );

    return {
      extra: {
        activeProjects: activeProjects.length,
        activeProjectNames: activeProjects.map(p => p.name),
        totalProjects: (projects || []).length,
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 're-projects', label: 'المشاريع', icon: 'Building', path: '/real-estate/projects' },
      { id: 're-units', label: 'الوحدات', icon: 'Home', path: '/real-estate/units' },
      { id: 're-contractors', label: 'المقاولين', icon: 'HardHat', path: '/real-estate/contractors' },
      { id: 're-crm', label: 'إدارة العملاء', icon: 'Users', path: '/real-estate/crm' },
    ];
  },

  getCoaTemplate(): string {
    return 'real_estate';
  },
};
