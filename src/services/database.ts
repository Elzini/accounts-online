/**
 * Database Service - Facade
 * 
 * This file re-exports from modular services for backward compatibility.
 * New code should import directly from the specific service modules.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import type { Database } from '@/integrations/supabase/types';
import { requireCompanyId, toDateOnly } from '@/services/companyContext';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';

// ── Re-exports from modular services ──
// Car dealership
export {
  fetchCars, addCar, updateCar, deleteCar, updateCarStatus,
  fetchSales, addSale, updateSale, updateSaleWithItems, deleteSale, reverseSale,
  addPurchaseBatch, fetchPurchaseBatches,
  addMultiCarSale, approveSale, fetchSalesWithItems, deleteMultiCarSale,
  recalculateCompanySalesProfits,
} from '@/services/carDealership';
export type { CarWithSaleInfo, MultiCarSaleData } from '@/services/carDealership';

// Customers (delegated to dedicated module)
export { fetchCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customers';

// Suppliers (delegated to dedicated module)
export { fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } from '@/services/suppliers';

// ============================================
// Stats - delegated to StatsEngine
// ============================================
export { fetchDashboardStats as fetchStats, fetchAllTimeDashboardStats as fetchAllTimeStats, fetchMonthlyChartData } from '@/services/statsEngine';
