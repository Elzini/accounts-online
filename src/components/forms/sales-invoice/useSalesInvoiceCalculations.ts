/**
 * Sales Invoice Calculations Hook
 * Extracted from useSalesInvoiceData.ts for maintainability
 */
import { useMemo } from 'react';
import { SelectedCarItem, SelectedInventoryItem, InvoiceFormData, StoredHeaderTotals } from './types';

interface CalcParams {
  selectedCars: SelectedCarItem[];
  selectedInventoryItems: SelectedInventoryItem[];
  invoiceData: InvoiceFormData;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  isCarDealership: boolean;
}

export function useSalesInvoiceCalculations({
  selectedCars, selectedInventoryItems, invoiceData, taxRate, discount, discountType, isCarDealership,
}: CalcParams) {
  return useMemo(() => {
    let subtotal = 0, totalVAT = 0;
    const commission = parseFloat(invoiceData.commission) || 0;
    const otherExpenses = parseFloat(invoiceData.other_expenses) || 0;

    const calcItem = (price: number, quantity: number, itemTaxRate?: number) => {
      const effectiveTaxRate = itemTaxRate ?? taxRate;
      let baseAmount: number, vatAmount: number, total: number;
      if (invoiceData.price_includes_tax && effectiveTaxRate > 0) {
        total = price * quantity; baseAmount = total / (1 + effectiveTaxRate / 100); vatAmount = total - baseAmount;
      } else {
        baseAmount = price * quantity; vatAmount = baseAmount * (effectiveTaxRate / 100); total = baseAmount + vatAmount;
      }
      subtotal += baseAmount; totalVAT += vatAmount;
      return { baseAmount, vatAmount, total };
    };

    const itemsWithCalc = selectedCars.map(car => {
      const price = parseFloat(car.sale_price) || 0;
      if (car.car_condition === 'used' && taxRate > 0) {
        const quantity = car.quantity || 1;
        const { calcCarTax } = require('@/utils/carTaxHelper');
        const result = calcCarTax(price * quantity, car.car_condition, 'sale', taxRate, car.purchase_price * quantity);
        subtotal += result.subtotal; totalVAT += result.taxAmount;
        return { ...car, baseAmount: result.subtotal, vatAmount: result.taxAmount, total: result.subtotal + result.taxAmount };
      } else {
        return { ...car, ...calcItem(price, car.quantity || 1) };
      }
    });

    const inventoryItemsWithCalc = selectedInventoryItems.map(item => {
      const price = parseFloat(item.sale_price) || 0;
      return { ...item, ...calcItem(price, item.quantity || 1) };
    });

    let discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const finalTotal = subtotalAfterDiscount + totalVAT;
    const totalPurchasePrice = isCarDealership
      ? selectedCars.reduce((sum, car) => sum + car.purchase_price, 0)
      : selectedInventoryItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
    const profit = subtotalAfterDiscount - totalPurchasePrice - commission - otherExpenses;
    const totalQuantity = isCarDealership ? selectedCars.length : selectedInventoryItems.reduce((sum, i) => sum + i.quantity, 0);

    return { items: itemsWithCalc, inventoryItems: inventoryItemsWithCalc, subtotal, discountAmount, subtotalAfterDiscount, totalVAT, finalTotal, roundedTotal: finalTotal, totalPurchasePrice, profit, quantity: totalQuantity };
  }, [selectedCars, selectedInventoryItems, invoiceData.price_includes_tax, invoiceData.commission, invoiceData.other_expenses, taxRate, discount, discountType, isCarDealership]);
}

export function useDisplayTotals(
  calculations: ReturnType<typeof useSalesInvoiceCalculations>,
  storedHeaderTotals: StoredHeaderTotals | null,
  isViewingExisting: boolean,
  isEditing: boolean,
) {
  return useMemo(() => {
    if (isViewingExisting && !isEditing && storedHeaderTotals && storedHeaderTotals.total > 0) {
      return {
        subtotal: storedHeaderTotals.subtotal, totalVAT: storedHeaderTotals.vat_amount,
        finalTotal: storedHeaderTotals.total, discountAmount: storedHeaderTotals.discount_amount,
        subtotalAfterDiscount: storedHeaderTotals.subtotal - storedHeaderTotals.discount_amount,
        roundedTotal: storedHeaderTotals.total, totalPurchasePrice: calculations.totalPurchasePrice,
        profit: calculations.profit, quantity: calculations.quantity,
      };
    }
    return calculations;
  }, [calculations, storedHeaderTotals, isViewingExisting, isEditing]);
}
