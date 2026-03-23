/**
 * Car Dealership - Thin Facade (backward compatibility)
 * All logic has been decomposed into src/services/carDealership/
 */
export type { CarWithSaleInfo, MultiCarSaleData } from './carDealership/index';
export {
  fetchCars, addCar, updateCar, deleteCar, updateCarStatus,
  recalculateCompanySalesProfits,
  fetchSales, addSale, updateSale, updateSaleWithItems, deleteSale, reverseSale,
  addMultiCarSale, approveSale, fetchSalesWithItems, deleteMultiCarSale,
  addPurchaseBatch, fetchPurchaseBatches,
} from './carDealership/index';
