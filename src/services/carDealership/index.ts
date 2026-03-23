/**
 * Car Dealership - Barrel Export (Facade)
 */
export type { Car, CarInsert, CarUpdate, Sale, SaleInsert, SaleUpdate, PurchaseBatch, PurchaseBatchInsert, SaleItem, SaleItemInsert, CarWithSaleInfo, MultiCarSaleData } from './types';
export { fetchCars, addCar, updateCar, deleteCar, updateCarStatus } from './cars';
export { recalculateSalesProfitForCar, recalculateCompanySalesProfits } from './profitCalculations';
export { fetchSales, addSale, updateSale, updateSaleWithItems, deleteSale, reverseSale, addMultiCarSale, approveSale, fetchSalesWithItems, deleteMultiCarSale } from './sales';
export { addPurchaseBatch, fetchPurchaseBatches } from './purchaseBatches';
