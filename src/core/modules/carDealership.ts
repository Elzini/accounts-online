/**
 * Car Dealership Module
 * Registered as an industry module in the Core Engine
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';

export const CarDealershipModule: IndustryModule = {
  id: 'car_dealership',
  name: 'معارض السيارات',
  supportedTypes: ['car_dealership'],

  async getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>> {
    // This delegates to the existing carDealership service
    // but returns data in the unified DashboardStats format
    const { fetchCarDealershipDashboard } = await import('@/services/carDealership');
    try {
      const stats = await fetchCarDealershipDashboard(companyId, fiscalYearId);
      return {
        extra: {
          availableNewCars: stats?.availableNewCars || 0,
          availableUsedCars: stats?.availableUsedCars || 0,
          availableCars: stats?.availableCars || 0,
        },
      };
    } catch {
      return { extra: {} };
    }
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
