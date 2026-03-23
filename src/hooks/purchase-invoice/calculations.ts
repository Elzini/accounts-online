/**
 * Purchase Invoice - Calculation utilities (pure functions)
 */
import { CarItem, PurchaseInventoryItem } from '@/components/forms/purchase-invoice/types';

export interface PurchaseCalcResult {
  items: (CarItem & { baseAmount: number; vatAmount: number; total: number })[];
  inventoryItems: (PurchaseInventoryItem & { baseAmount: number; vatAmount: number; total: number })[];
  subtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  totalVAT: number;
  finalTotal: number;
  roundedTotal: number;
}

export function calculatePurchaseInvoice(
  cars: CarItem[],
  inventoryItems: PurchaseInventoryItem[],
  priceIncludesTax: boolean,
  taxRate: number,
  discount: number,
  discountType: 'percentage' | 'amount',
): PurchaseCalcResult {
  let subtotal = 0;
  let totalVAT = 0;

  const calcItem = (price: number, quantity: number, itemTaxRate?: number) => {
    const effectiveTaxRate = itemTaxRate ?? taxRate;
    let baseAmount: number, vatAmount: number, total: number;
    if (priceIncludesTax && effectiveTaxRate > 0) {
      total = price * quantity;
      baseAmount = total / (1 + effectiveTaxRate / 100);
      vatAmount = total - baseAmount;
    } else {
      baseAmount = price * quantity;
      vatAmount = baseAmount * (effectiveTaxRate / 100);
      total = baseAmount + vatAmount;
    }
    subtotal += baseAmount;
    totalVAT += vatAmount;
    return { baseAmount, vatAmount, total };
  };

  const items = cars.map(car => {
    const price = parseFloat(car.purchase_price) || 0;
    const effectiveTaxRate = car.car_condition === 'used' ? 0 : taxRate;
    const result = calcItem(price, car.quantity || 1, effectiveTaxRate);
    return { ...car, ...result };
  });

  const inventoryItemsWithCalc = inventoryItems.map(item => {
    const price = parseFloat(item.purchase_price) || 0;
    const result = calcItem(price, item.quantity || 1);
    return { ...item, ...result };
  });

  const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const finalTotal = subtotalAfterDiscount + totalVAT;

  return {
    items,
    inventoryItems: inventoryItemsWithCalc,
    subtotal, discountAmount, subtotalAfterDiscount, totalVAT, finalTotal,
    roundedTotal: finalTotal,
  };
}
