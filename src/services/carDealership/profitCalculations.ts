/**
 * Car Dealership - Profit Recalculation Logic
 */
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/services/companyContext';

export async function recalculateSalesProfitForCar(carId: string, newPurchasePrice: number) {
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('id, sale_id, sale_price')
    .eq('car_id', carId);

  for (const item of saleItems || []) {
    const newProfit = Number(item.sale_price) - newPurchasePrice;
    await supabase.from('sale_items').update({ profit: newProfit }).eq('id', item.id);
  }

  const { data: directSales } = await supabase
    .from('sales')
    .select('id, sale_price, commission, other_expenses')
    .eq('car_id', carId);

  for (const sale of directSales || []) {
    const commission = Number(sale.commission) || 0;
    const otherExpenses = Number(sale.other_expenses) || 0;
    const newProfit = Number(sale.sale_price) - newPurchasePrice - commission - otherExpenses;
    await supabase.from('sales').update({ profit: newProfit }).eq('id', sale.id);
  }

  const uniqueSaleIds = [...new Set((saleItems || []).map(item => item.sale_id))];
  for (const saleId of uniqueSaleIds) {
    const { data: allItems } = await supabase.from('sale_items').select('profit').eq('sale_id', saleId);
    if (allItems && allItems.length > 0) {
      const totalItemsProfit = allItems.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
      const { data: saleData } = await supabase
        .from('sales')
        .select('commission, other_expenses')
        .eq('id', saleId)
        .single();
      const commission = Number(saleData?.commission) || 0;
      const otherExpenses = Number(saleData?.other_expenses) || 0;
      await supabase.from('sales').update({ profit: totalItemsProfit - commission - otherExpenses }).eq('id', saleId);
    }
  }
}

export async function recalculateCompanySalesProfits(): Promise<{ salesUpdated: number; itemsUpdated: number }> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');

  const { data: sales, error } = await supabase
    .from('sales')
    .select(`id, sale_price, commission, other_expenses, car_id, car:cars(purchase_price), sale_items:sale_items(id, car_id, sale_price, car:cars(purchase_price))`)
    .eq('company_id', companyId);

  if (error) throw error;

  let salesUpdated = 0;
  let itemsUpdated = 0;

  for (const sale of sales || []) {
    const commission = Number((sale as any).commission) || 0;
    const otherExpenses = Number((sale as any).other_expenses) || 0;
    const saleItems: Array<any> = (sale as any).sale_items || [];

    if (saleItems.length > 0) {
      let totalItemsProfit = 0;
      for (const item of saleItems) {
        const purchasePrice = Number(item?.car?.purchase_price) || 0;
        const itemSalePrice = Number(item.sale_price) || 0;
        const itemProfit = itemSalePrice - purchasePrice;
        totalItemsProfit += itemProfit;
        const { error: itemErr } = await supabase.from('sale_items').update({ profit: itemProfit }).eq('id', item.id);
        if (itemErr) throw itemErr;
        itemsUpdated += 1;
      }
      const finalProfit = totalItemsProfit - commission - otherExpenses;
      const { error: saleErr } = await supabase.from('sales').update({ profit: finalProfit }).eq('id', (sale as any).id);
      if (saleErr) throw saleErr;
      salesUpdated += 1;
    } else {
      const purchasePrice = Number((sale as any).car?.purchase_price) || 0;
      const salePrice = Number((sale as any).sale_price) || 0;
      const profit = salePrice - purchasePrice - commission - otherExpenses;
      const { error: saleErr } = await supabase.from('sales').update({ profit }).eq('id', (sale as any).id);
      if (saleErr) throw saleErr;
      salesUpdated += 1;
    }
  }

  return { salesUpdated, itemsUpdated };
}
