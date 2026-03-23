/**
 * Generic Trading Module (Default)
 * Handles general_trading, construction, restaurant, export_import, medical
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const GenericModule: IndustryModule = {
  id: 'generic',
  name: 'تجارة عامة',
  supportedTypes: ['general_trading', 'restaurant', 'export_import', 'medical'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    // Generic companies use core stats only — no extra data needed
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
};
