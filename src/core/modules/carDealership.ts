/**
 * Car Dealership Module
 * Provides car-specific dashboard stats and menu items
 */

import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';
import { supabase } from '@/integrations/supabase/client';

export const CarDealershipModule: IndustryModule = {
  id: 'car_dealership',
  name: 'معارض السيارات',
  supportedTypes: ['car_dealership'],

  async getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>> {
    // Fetch car-specific stats
    const [carsRes, salesRes, transfersRes] = await Promise.all([
      supabase.from('cars').select('id, status, purchase_price').eq('company_id', companyId),
      supabase.from('sales').select('id, selling_price, sale_date').eq('company_id', companyId),
      supabase.from('car_transfers').select('id, status').eq('company_id', companyId),
    ]);

    const cars = carsRes.data || [];
    const sales = salesRes.data || [];
    const transfers = transfersRes.data || [];

    const availableCars = cars.filter(c => c.status === 'available').length;
    const soldCars = cars.filter(c => c.status === 'sold').length;
    const activeTransfers = transfers.filter(t => t.status === 'transferred').length;

    return {
      extra: {
        availableCars,
        soldCars,
        totalCars: cars.length,
        activeTransfers,
        totalTransfers: transfers.length,
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'cars', label: 'المخزون', icon: 'Car', path: '/cars' },
      { id: 'partner-dealerships', label: 'المعارض الشريكة', icon: 'Building2', path: '/partner-dealerships' },
      { id: 'car-transfers', label: 'تحويلات السيارات', icon: 'ArrowLeftRight', path: '/car-transfers' },
    ];
  },

  getCoaTemplate(): string {
    return 'car_dealership';
  },
};
