import { supabase } from '@/integrations/supabase/client';

export interface VATReturnSales {
  standardRatedAmount: number;
  standardRatedVAT: number;
  citizenServicesAmount: number;
  citizenServicesVAT: number;
  zeroRatedAmount: number;
  exportsAmount: number;
  exemptAmount: number;
  totalAmount: number;
  totalVAT: number;
}

export interface VATReturnPurchases {
  standardRatedAmount: number;
  standardRatedVAT: number;
  importsAmount: number;
  importsVAT: number;
  reverseChargeAmount: number;
  reverseChargeVAT: number;
  zeroRatedAmount: number;
  exemptAmount: number;
  totalAmount: number;
  totalVAT: number;
}

export interface VATReturnReport {
  sales: VATReturnSales;
  purchases: VATReturnPurchases;
  corrections: number;
  netVAT: number;
  status: 'payable' | 'receivable' | 'settled';
  period: {
    startDate: string;
    endDate: string;
  };
}

export async function getVATReturnReport(
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<VATReturnReport> {
  // Get tax rate
  const { data: taxSettings } = await supabase
    .from('tax_settings')
    .select('tax_rate')
    .eq('company_id', companyId)
    .maybeSingle();

  const taxRate = taxSettings?.tax_rate || 15;

  // Fetch sales data - must match exactly what's shown in sales table
  // Sales table shows: sale_price (base amount before VAT)
  let salesQuery = supabase
    .from('sales')
    .select('id, sale_price, sale_date, car_id')
    .eq('company_id', companyId);

  if (startDate) {
    salesQuery = salesQuery.gte('sale_date', startDate);
  }
  if (endDate) {
    salesQuery = salesQuery.lte('sale_date', endDate);
  }

  const { data: salesData, error: salesError } = await salesQuery;
  if (salesError) throw salesError;

  // Fetch car purchases - must match exactly what's shown in purchases table
  // Purchases table shows cars with: purchase_price (base amount before VAT)
  let purchasesQuery = supabase
    .from('cars')
    .select('id, purchase_price, purchase_date')
    .eq('company_id', companyId);

  if (startDate) {
    purchasesQuery = purchasesQuery.gte('purchase_date', startDate);
  }
  if (endDate) {
    purchasesQuery = purchasesQuery.lte('purchase_date', endDate);
  }

  const { data: purchasesData, error: purchasesError } = await purchasesQuery;
  if (purchasesError) throw purchasesError;

  // Fetch expenses with VAT invoices (للمصاريف التي لها فواتير ضريبية فقط)
  let expensesQuery = supabase
    .from('expenses')
    .select('id, amount, expense_date, has_vat_invoice')
    .eq('company_id', companyId)
    .eq('has_vat_invoice', true); // فقط المصاريف التي لها فواتير ضريبية

  if (startDate) {
    expensesQuery = expensesQuery.gte('expense_date', startDate);
  }
  if (endDate) {
    expensesQuery = expensesQuery.lte('expense_date', endDate);
  }

  const { data: expensesData, error: expensesError } = await expensesQuery;
  if (expensesError) throw expensesError;

  // Calculate sales totals
  // All car sales are standard rated (15% VAT)
  // ملاحظة: الأسعار المخزنة هي المبلغ الأساسي (قبل الضريبة)
  // الضريبة تُحسب كـ: المبلغ الأساسي × نسبة الضريبة
  const totalSalesAmount = (salesData || []).reduce((sum, sale) => {
    const salePrice = Number(sale.sale_price) || 0;
    return sum + salePrice;
  }, 0);

  const totalSalesVAT = (salesData || []).reduce((sum, sale) => {
    const salePrice = Number(sale.sale_price) || 0;
    const vat = salePrice * (taxRate / 100);
    return sum + vat;
  }, 0);

  // Calculate purchases totals (car inventory purchases)
  const totalCarPurchasesAmount = (purchasesData || []).reduce((sum, car) => {
    const purchasePrice = Number(car.purchase_price) || 0;
    return sum + purchasePrice;
  }, 0);

  const totalCarPurchasesVAT = (purchasesData || []).reduce((sum, car) => {
    const purchasePrice = Number(car.purchase_price) || 0;
    const vat = purchasePrice * (taxRate / 100);
    return sum + vat;
  }, 0);

  // Calculate expenses with VAT invoices (مصاريف لها فواتير ضريبية)
  const totalVatExpensesAmount = (expensesData || []).reduce((sum, exp) => {
    return sum + (Number(exp.amount) || 0);
  }, 0);

  const totalVatExpensesVAT = (expensesData || []).reduce((sum, exp) => {
    const amount = Number(exp.amount) || 0;
    const vat = amount * (taxRate / 100);
    return sum + vat;
  }, 0);

  // Total purchases = car purchases + expenses with VAT invoices
  const totalPurchasesAmount = totalCarPurchasesAmount + totalVatExpensesAmount;
  const totalPurchasesVAT = totalCarPurchasesVAT + totalVatExpensesVAT;

  // Build the report structure
  const sales: VATReturnSales = {
    standardRatedAmount: totalSalesAmount,
    standardRatedVAT: totalSalesVAT,
    citizenServicesAmount: 0, // Not applicable for car sales
    citizenServicesVAT: 0,
    zeroRatedAmount: 0,
    exportsAmount: 0,
    exemptAmount: 0,
    totalAmount: totalSalesAmount,
    totalVAT: totalSalesVAT,
  };

  const purchases: VATReturnPurchases = {
    standardRatedAmount: totalPurchasesAmount,
    standardRatedVAT: totalPurchasesVAT,
    importsAmount: 0, // Can be extended for imported cars
    importsVAT: 0,
    reverseChargeAmount: 0,
    reverseChargeVAT: 0,
    zeroRatedAmount: 0,
    exemptAmount: 0,
    totalAmount: totalPurchasesAmount,
    totalVAT: totalPurchasesVAT,
  };

  // Net VAT = Output VAT (sales) - Input VAT (purchases)
  const netVAT = sales.totalVAT - purchases.totalVAT;

  let status: 'payable' | 'receivable' | 'settled' = 'settled';
  if (netVAT > 0.01) {
    status = 'payable';
  } else if (netVAT < -0.01) {
    status = 'receivable';
  }

  return {
    sales,
    purchases,
    corrections: 0,
    netVAT,
    status,
    period: {
      startDate: startDate || '',
      endDate: endDate || '',
    },
  };
}
