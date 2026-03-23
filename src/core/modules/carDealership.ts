/**
 * Car Dealership Module
 * Registered as an industry module in the Core Engine
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const CarDealershipModule: IndustryModule = {
  id: 'car_dealership',
  name: 'معارض السيارات',
  supportedTypes: ['car_dealership'],

  async getDashboardStats(): Promise<Partial<DashboardStats>> {
    // Car dealership stats are fetched separately in database.ts
    // This module just provides the extra metadata
    return {
      extra: {
        moduleType: 'car_dealership',
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'cars', label: 'المخزون', icon: 'Car', path: '/cars' },
      { id: 'sales', label: 'المبيعات', icon: 'ShoppingCart', path: '/sales' },
      { id: 'transfers', label: 'التحويلات', icon: 'ArrowLeftRight', path: '/transfers' },
    ];
  },

  getCoaTemplate(): string {
    return 'car_dealership';
  },
};
