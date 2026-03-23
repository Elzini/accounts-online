import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from '@/services/companyContext';

export interface AdvancedStats {
  // Trend comparisons
  salesTrend: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  profitTrend: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  purchasesTrend: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  // Inventory analysis (general: counts from invoices; car dealership: car inventory)
  inventoryByStatus: {
    available: number;
    sold: number;
    transferred: number;
  };
  // Top performers
  topCustomers: Array<{
    id: string;
    name: string;
    phone: string;
    totalPurchases: number;
    totalAmount: number;
  }>;
  topSuppliers: Array<{
    id: string;
    name: string;
    totalCars: number;
    totalAmount: number;
  }>;
  // Top selling items (cars for dealerships, empty for general companies)
  topSellingCars: Array<{
    name: string;
    model: string;
    count: number;
    totalRevenue: number;
  }>;
  // Financial breakdown
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  // Performance metrics
  averageSalePrice: number;
  averageProfitMargin: number;
  inventoryTurnover: number;
  averageDaysToSell: number;
  // Recent activity
  recentSales: Array<{
    id: string;
    date: string;
    customerName: string;
    carName: string;
    amount: number;
    profit: number;
  }>;
}

export async function fetchAdvancedAnalytics(fiscalYearId?: string): Promise<AdvancedStats> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');
  const toDateOnly = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Get company type
  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();
  const companyType = companyRecord?.company_type;
  const isCarDealership = companyType === 'car_dealership';

  // Get fiscal year dates if provided
  let fiscalYearStart: string | null = null;
  let fiscalYearEnd: string | null = null;
  
  if (fiscalYearId) {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('id', fiscalYearId)
      .single();
    
    if (fiscalYear) {
      fiscalYearStart = fiscalYear.start_date;
      fiscalYearEnd = fiscalYear.end_date;
    }
  }

  const now = new Date();
  const thisMonthStart = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastMonthStart = toDateOnly(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thisMonthEnd = toDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const lastMonthEnd = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 0));

  // Build queries based on company type
  let customersQuery = supabase.from('customers').select('id, name, phone').eq('company_id', companyId);
  let suppliersQuery = supabase.from('suppliers').select('id, name').eq('company_id', companyId);

  if (isCarDealership) {
    // Car dealership: use cars + sales tables
    let allCarsQuery = supabase
      .from('cars')
      .select('id, name, model, status, purchase_price, purchase_date, created_at, supplier_id')
      .eq('company_id', companyId);
    
    let allSalesQuery = supabase
      .from('sales')
      .select(`
        id, sale_price, profit, sale_date, created_at,
        customer:customers(id, name, phone),
        car:cars(id, name, model, purchase_price, purchase_date)
      `)
      .eq('company_id', companyId)
      .order('sale_date', { ascending: false });

    let transfersQuery = supabase.from('car_transfers').select('id, car_id, status').eq('company_id', companyId);

    if (fiscalYearStart && fiscalYearEnd) {
      allCarsQuery = allCarsQuery
        .gte('purchase_date', fiscalYearStart)
        .lte('purchase_date', fiscalYearEnd);
      allSalesQuery = allSalesQuery
        .gte('sale_date', fiscalYearStart)
        .lte('sale_date', fiscalYearEnd);
    }

    const [allCars, allSales, customers, suppliers, transfers] = await Promise.all([
      allCarsQuery, allSalesQuery, customersQuery, suppliersQuery, transfersQuery
    ]);

    return buildCarDealershipAnalytics(
      allCars.data || [], allSales.data || [], customers.data || [],
      suppliers.data || [], transfers.data || [],
      thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd,
      fiscalYearStart, fiscalYearEnd, now
    );
  } else {
    // Non-car companies: use invoices table
    let salesInvoicesQuery = supabase
      .from('invoices')
      .select('id, subtotal, invoice_date, customer_id, supplier_id, status')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sales')
      .order('invoice_date', { ascending: false });

    let purchaseInvoicesQuery = supabase
      .from('invoices')
      .select('id, subtotal, invoice_date, supplier_id, status')
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase');

    if (fiscalYearStart && fiscalYearEnd) {
      salesInvoicesQuery = salesInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
      purchaseInvoicesQuery = purchaseInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
    }

    const [salesResult, purchasesResult, customers, suppliers] = await Promise.all([
      salesInvoicesQuery, purchaseInvoicesQuery, customersQuery, suppliersQuery
    ]);

    return buildInvoiceBasedAnalytics(
      salesResult.data || [], purchasesResult.data || [],
      customers.data || [], suppliers.data || [],
      thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd,
      fiscalYearStart, fiscalYearEnd, now
    );
  }
}

// Analytics for non-car companies (invoice-based)
function buildInvoiceBasedAnalytics(
  salesInvoices: any[], purchaseInvoices: any[],
  customers: any[], suppliers: any[],
  thisMonthStart: string, thisMonthEnd: string,
  lastMonthStart: string, lastMonthEnd: string,
  fiscalYearStart: string | null, fiscalYearEnd: string | null,
  now: Date
): AdvancedStats {
  const isWithinFiscalYear = (dateStr: string) => {
    if (!fiscalYearStart || !fiscalYearEnd) return true;
    return dateStr >= fiscalYearStart && dateStr <= fiscalYearEnd;
  };

  const salesThisMonth = salesInvoices.filter(inv =>
    inv.invoice_date >= thisMonthStart && inv.invoice_date <= thisMonthEnd && isWithinFiscalYear(inv.invoice_date)
  );
  const salesLastMonth = salesInvoices.filter(inv =>
    inv.invoice_date >= lastMonthStart && inv.invoice_date <= lastMonthEnd && isWithinFiscalYear(inv.invoice_date)
  );

  const thisMonthTotal = salesThisMonth.reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
  const lastMonthTotal = salesLastMonth.reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
  const salesPercentChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const purchasesThisMonth = purchaseInvoices.filter(inv =>
    inv.invoice_date >= thisMonthStart && inv.invoice_date <= thisMonthEnd
  ).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
  const purchasesLastMonth = purchaseInvoices.filter(inv =>
    inv.invoice_date >= lastMonthStart && inv.invoice_date <= lastMonthEnd
  ).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
  const purchasesPercentChange = purchasesLastMonth > 0
    ? ((purchasesThisMonth - purchasesLastMonth) / purchasesLastMonth) * 100 : 0;

  // Top customers from sales invoices
  const customerSales: Record<string, { total: number; count: number }> = {};
  salesInvoices.forEach(inv => {
    if (inv.customer_id) {
      if (!customerSales[inv.customer_id]) customerSales[inv.customer_id] = { total: 0, count: 0 };
      customerSales[inv.customer_id].total += Number(inv.subtotal) || 0;
      customerSales[inv.customer_id].count += 1;
    }
  });

  const topCustomers = Object.entries(customerSales)
    .map(([id, data]) => ({
      id,
      name: customers.find((c: any) => c.id === id)?.name || '',
      phone: customers.find((c: any) => c.id === id)?.phone || '',
      totalPurchases: data.count,
      totalAmount: data.total
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  // Top suppliers from purchase invoices
  const supplierPurchases: Record<string, { count: number; total: number }> = {};
  purchaseInvoices.forEach(inv => {
    if (inv.supplier_id) {
      if (!supplierPurchases[inv.supplier_id]) supplierPurchases[inv.supplier_id] = { count: 0, total: 0 };
      supplierPurchases[inv.supplier_id].count += 1;
      supplierPurchases[inv.supplier_id].total += Number(inv.subtotal) || 0;
    }
  });

  const topSuppliers = Object.entries(supplierPurchases)
    .map(([id, data]) => ({
      id,
      name: suppliers.find((s: any) => s.id === id)?.name || '',
      totalCars: data.count,
      totalAmount: data.total
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  // Revenue by month
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthlyData: Record<string, { revenue: number; cost: number; profit: number }> = {};

  if (fiscalYearStart && fiscalYearEnd) {
    const startDate = new Date(fiscalYearStart);
    const endDate = new Date(fiscalYearEnd);
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
    }
  }

  salesInvoices.forEach(inv => {
    const date = new Date(inv.invoice_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].revenue += Number(inv.subtotal) || 0;
      monthlyData[monthKey].profit += Number(inv.subtotal) || 0;
    }
  });

  const revenueByMonth = Object.entries(monthlyData).map(([key, data]) => {
    const [, month] = key.split('-');
    return { month: arabicMonths[parseInt(month) - 1], ...data };
  });

  const totalRevenue = salesInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
  const totalPurchasesAmount = purchaseInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);

  return {
    salesTrend: { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, percentChange: salesPercentChange },
    profitTrend: { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, percentChange: salesPercentChange },
    purchasesTrend: { thisMonth: purchasesThisMonth, lastMonth: purchasesLastMonth, percentChange: purchasesPercentChange },
    inventoryByStatus: { available: 0, sold: salesInvoices.length, transferred: 0 },
    topCustomers,
    topSuppliers,
    topSellingCars: [],
    revenueByMonth,
    averageSalePrice: salesInvoices.length > 0 ? totalRevenue / salesInvoices.length : 0,
    averageProfitMargin: totalRevenue > 0 ? ((totalRevenue - totalPurchasesAmount) / totalRevenue) * 100 : 0,
    inventoryTurnover: 0,
    averageDaysToSell: 0,
    recentSales: salesInvoices.slice(0, 5).map(inv => ({
      id: inv.id,
      date: inv.invoice_date,
      customerName: customers.find((c: any) => c.id === inv.customer_id)?.name || 'غير محدد',
      carName: '',
      amount: Number(inv.subtotal) || 0,
      profit: Number(inv.subtotal) || 0,
    })),
  };
}

// Analytics for car dealerships (original logic)
function buildCarDealershipAnalytics(
  allCarsData: any[], allSalesData: any[],
  customersData: any[], suppliersData: any[], transfersData: any[],
  thisMonthStart: string, thisMonthEnd: string,
  lastMonthStart: string, lastMonthEnd: string,
  fiscalYearStart: string | null, fiscalYearEnd: string | null,
  now: Date
): AdvancedStats {

  const isWithinFiscalYear = (dateStr: string) => {
    if (!fiscalYearStart || !fiscalYearEnd) return true;
    return dateStr >= fiscalYearStart && dateStr <= fiscalYearEnd;
  };

  const salesThisMonthData = allSalesData.filter(s => {
    const saleDate = s.sale_date || s.created_at.split('T')[0];
    return saleDate >= thisMonthStart && saleDate <= thisMonthEnd && isWithinFiscalYear(saleDate);
  });

  const salesLastMonthData = allSalesData.filter(s => {
    const saleDate = s.sale_date || s.created_at.split('T')[0];
    return saleDate >= lastMonthStart && saleDate <= lastMonthEnd && isWithinFiscalYear(saleDate);
  });

  const thisMonthSalesTotal = salesThisMonthData.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const lastMonthSalesTotal = salesLastMonthData.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const thisMonthProfit = salesThisMonthData.reduce((sum, s) => sum + (s.profit || 0), 0);
  const lastMonthProfit = salesLastMonthData.reduce((sum, s) => sum + (s.profit || 0), 0);

  const salesPercentChange = lastMonthSalesTotal > 0 
    ? ((thisMonthSalesTotal - lastMonthSalesTotal) / lastMonthSalesTotal) * 100 : 0;
  const profitPercentChange = lastMonthProfit > 0 
    ? ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0;

  const carsThisMonth = allCarsData.filter(c => c.purchase_date >= thisMonthStart && c.purchase_date <= thisMonthEnd);
  const carsLastMonth = allCarsData.filter(c => c.purchase_date >= lastMonthStart && c.purchase_date <= lastMonthEnd);
  const purchasesThisMonth = carsThisMonth.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
  const purchasesLastMonth = carsLastMonth.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
  const purchasesPercentChange = purchasesLastMonth > 0 
    ? ((purchasesThisMonth - purchasesLastMonth) / purchasesLastMonth) * 100 : 0;

  const availableCars = allCarsData.filter(c => c.status === 'available').length;
  const soldCars = allCarsData.filter(c => c.status === 'sold').length;
  const transferredCars = transfersData.filter(t => t.status === 'pending').length;

  const customerSales: Record<string, { total: number; count: number }> = {};
  allSalesData.forEach(sale => {
    if (sale.customer?.id) {
      if (!customerSales[sale.customer.id]) customerSales[sale.customer.id] = { total: 0, count: 0 };
      customerSales[sale.customer.id].total += sale.sale_price || 0;
      customerSales[sale.customer.id].count += 1;
    }
  });

  const topCustomers = Object.entries(customerSales)
    .map(([id, data]) => {
      const customer = allSalesData.find(s => s.customer?.id === id)?.customer;
      return { id, name: customer?.name || '', phone: customer?.phone || '', totalPurchases: data.count, totalAmount: data.total };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const supplierCars: Record<string, { count: number; total: number }> = {};
  allCarsData.forEach(car => {
    if (car.supplier_id) {
      if (!supplierCars[car.supplier_id]) supplierCars[car.supplier_id] = { count: 0, total: 0 };
      supplierCars[car.supplier_id].count += 1;
      supplierCars[car.supplier_id].total += car.purchase_price || 0;
    }
  });

  const topSuppliers = Object.entries(supplierCars)
    .map(([id, data]) => {
      const supplier = suppliersData.find(s => s.id === id);
      return { id, name: supplier?.name || '', totalCars: data.count, totalAmount: data.total };
    })
    .sort((a, b) => b.totalCars - a.totalCars)
    .slice(0, 5);

  const carModelSales: Record<string, { count: number; revenue: number }> = {};
  allSalesData.forEach(sale => {
    if (sale.car) {
      const key = `${sale.car.name} ${sale.car.model || ''}`.trim();
      if (!carModelSales[key]) carModelSales[key] = { count: 0, revenue: 0 };
      carModelSales[key].count += 1;
      carModelSales[key].revenue += sale.sale_price || 0;
    }
  });

  const topSellingCars = Object.entries(carModelSales)
    .map(([key, data]) => ({
      name: key.split(' ')[0] || '', model: key.split(' ').slice(1).join(' ') || '',
      count: data.count, totalRevenue: data.revenue
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const monthlyData: Record<string, { revenue: number; cost: number; profit: number }> = {};
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  if (fiscalYearStart && fiscalYearEnd) {
    const startDate = new Date(fiscalYearStart);
    const endDate = new Date(fiscalYearEnd);
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
    }
  }

  allSalesData.forEach(sale => {
    const saleDate = new Date(sale.sale_date || sale.created_at);
    const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].revenue += sale.sale_price || 0;
      monthlyData[monthKey].profit += sale.profit || 0;
      monthlyData[monthKey].cost += (sale.sale_price || 0) - (sale.profit || 0);
    }
  });

  const revenueByMonth = Object.entries(monthlyData).map(([key, data]) => {
    const [, month] = key.split('-');
    return { month: arabicMonths[parseInt(month) - 1], ...data };
  });

  const totalSales = allSalesData.length;
  const totalRevenue = allSalesData.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const totalProfit = allSalesData.reduce((sum, s) => sum + (s.profit || 0), 0);
  const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
  const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalCars = allCarsData.length;
  const inventoryTurnover = totalCars > 0 ? (soldCars / totalCars) * 100 : 0;

  let totalDaysToSell = 0;
  let soldCount = 0;
  allSalesData.forEach(sale => {
    if (sale.car?.purchase_date) {
      const purchaseDate = new Date(sale.car.purchase_date);
      const saleDate = new Date(sale.sale_date || sale.created_at);
      const days = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) { totalDaysToSell += days; soldCount += 1; }
    }
  });
  const averageDaysToSell = soldCount > 0 ? Math.round(totalDaysToSell / soldCount) : 0;

  const recentSales = allSalesData.slice(0, 5).map(sale => ({
    id: sale.id,
    date: sale.sale_date || sale.created_at,
    customerName: sale.customer?.name || 'غير محدد',
    carName: sale.car ? `${sale.car.name} ${sale.car.model || ''}`.trim() : 'غير محدد',
    amount: sale.sale_price || 0,
    profit: sale.profit || 0
  }));

  return {
    salesTrend: { thisMonth: thisMonthSalesTotal, lastMonth: lastMonthSalesTotal, percentChange: salesPercentChange },
    profitTrend: { thisMonth: thisMonthProfit, lastMonth: lastMonthProfit, percentChange: profitPercentChange },
    purchasesTrend: { thisMonth: purchasesThisMonth, lastMonth: purchasesLastMonth, percentChange: purchasesPercentChange },
    inventoryByStatus: { available: availableCars, sold: soldCars, transferred: transferredCars },
    topCustomers, topSuppliers, topSellingCars, revenueByMonth,
    averageSalePrice, averageProfitMargin, inventoryTurnover, averageDaysToSell, recentSales
  };
}
