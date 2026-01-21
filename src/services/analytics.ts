import { supabase } from "@/integrations/supabase/client";

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
  // Inventory analysis
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

export async function fetchAdvancedAnalytics(): Promise<AdvancedStats> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  // Parallel fetches for better performance
  const [
    salesThisMonth,
    salesLastMonth,
    allCars,
    allSales,
    customers,
    suppliers,
    transfers
  ] = await Promise.all([
    // This month's sales
    supabase
      .from('sales')
      .select('sale_price, profit')
      .gte('created_at', thisMonthStart),
    // Last month's sales
    supabase
      .from('sales')
      .select('sale_price, profit')
      .gte('created_at', lastMonthStart)
      .lt('created_at', thisMonthEnd),
    // All cars
    supabase
      .from('cars')
      .select('id, name, model, status, purchase_price, purchase_date, created_at, supplier_id'),
    // All sales with details
    supabase
      .from('sales')
      .select(`
        id,
        sale_price,
        profit,
        created_at,
        customer:customers(id, name, phone),
        car:cars(id, name, model, purchase_price, purchase_date)
      `)
      .order('created_at', { ascending: false }),
    // Customers
    supabase
      .from('customers')
      .select('id, name, phone'),
    // Suppliers
    supabase
      .from('suppliers')
      .select('id, name'),
    // Transfers
    supabase
      .from('car_transfers')
      .select('id, car_id, status')
  ]);

  // Calculate trends
  const thisMonthSalesTotal = (salesThisMonth.data || []).reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const lastMonthSalesTotal = (salesLastMonth.data || []).reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const thisMonthProfit = (salesThisMonth.data || []).reduce((sum, s) => sum + (s.profit || 0), 0);
  const lastMonthProfit = (salesLastMonth.data || []).reduce((sum, s) => sum + (s.profit || 0), 0);

  const salesPercentChange = lastMonthSalesTotal > 0 
    ? ((thisMonthSalesTotal - lastMonthSalesTotal) / lastMonthSalesTotal) * 100 
    : 0;
  const profitPercentChange = lastMonthProfit > 0 
    ? ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100 
    : 0;

  // Purchases trends
  const carsThisMonth = (allCars.data || []).filter(c => c.created_at >= thisMonthStart);
  const carsLastMonth = (allCars.data || []).filter(c => c.created_at >= lastMonthStart && c.created_at < thisMonthEnd);
  const purchasesThisMonth = carsThisMonth.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
  const purchasesLastMonth = carsLastMonth.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
  const purchasesPercentChange = purchasesLastMonth > 0 
    ? ((purchasesThisMonth - purchasesLastMonth) / purchasesLastMonth) * 100 
    : 0;

  // Inventory by status
  const availableCars = (allCars.data || []).filter(c => c.status === 'available').length;
  const soldCars = (allCars.data || []).filter(c => c.status === 'sold').length;
  const transferredCars = (transfers.data || []).filter(t => t.status === 'pending').length;

  // Top customers
  const customerSales: Record<string, { total: number; count: number }> = {};
  (allSales.data || []).forEach(sale => {
    if (sale.customer?.id) {
      if (!customerSales[sale.customer.id]) {
        customerSales[sale.customer.id] = { total: 0, count: 0 };
      }
      customerSales[sale.customer.id].total += sale.sale_price || 0;
      customerSales[sale.customer.id].count += 1;
    }
  });

  const topCustomers = Object.entries(customerSales)
    .map(([id, data]) => {
      const customer = (allSales.data || []).find(s => s.customer?.id === id)?.customer;
      return {
        id,
        name: customer?.name || '',
        phone: customer?.phone || '',
        totalPurchases: data.count,
        totalAmount: data.total
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  // Top suppliers
  const supplierCars: Record<string, { count: number; total: number }> = {};
  (allCars.data || []).forEach(car => {
    if (car.supplier_id) {
      if (!supplierCars[car.supplier_id]) {
        supplierCars[car.supplier_id] = { count: 0, total: 0 };
      }
      supplierCars[car.supplier_id].count += 1;
      supplierCars[car.supplier_id].total += car.purchase_price || 0;
    }
  });

  const topSuppliers = Object.entries(supplierCars)
    .map(([id, data]) => {
      const supplier = (suppliers.data || []).find(s => s.id === id);
      return {
        id,
        name: supplier?.name || '',
        totalCars: data.count,
        totalAmount: data.total
      };
    })
    .sort((a, b) => b.totalCars - a.totalCars)
    .slice(0, 5);

  // Top selling cars (by model)
  const carModelSales: Record<string, { count: number; revenue: number }> = {};
  (allSales.data || []).forEach(sale => {
    if (sale.car) {
      const key = `${sale.car.name} ${sale.car.model || ''}`.trim();
      if (!carModelSales[key]) {
        carModelSales[key] = { count: 0, revenue: 0 };
      }
      carModelSales[key].count += 1;
      carModelSales[key].revenue += sale.sale_price || 0;
    }
  });

  const topSellingCars = Object.entries(carModelSales)
    .map(([key, data]) => ({
      name: key.split(' ')[0] || '',
      model: key.split(' ').slice(1).join(' ') || '',
      count: data.count,
      totalRevenue: data.revenue
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Revenue by month (last 6 months)
  const monthlyData: Record<string, { revenue: number; cost: number; profit: number }> = {};
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = { revenue: 0, cost: 0, profit: 0 };
  }

  (allSales.data || []).forEach(sale => {
    const saleDate = new Date(sale.created_at);
    const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].revenue += sale.sale_price || 0;
      monthlyData[monthKey].profit += sale.profit || 0;
      monthlyData[monthKey].cost += (sale.sale_price || 0) - (sale.profit || 0);
    }
  });

  const revenueByMonth = Object.entries(monthlyData).map(([key, data]) => {
    const [year, month] = key.split('-');
    return {
      month: arabicMonths[parseInt(month) - 1],
      ...data
    };
  });

  // Performance metrics
  const totalSales = allSales.data?.length || 0;
  const totalRevenue = (allSales.data || []).reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const totalProfit = (allSales.data || []).reduce((sum, s) => sum + (s.profit || 0), 0);

  const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
  const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Inventory turnover (sold cars / average inventory)
  const totalCars = allCars.data?.length || 0;
  const inventoryTurnover = totalCars > 0 ? (soldCars / totalCars) * 100 : 0;

  // Average days to sell
  let totalDaysToSell = 0;
  let soldCount = 0;
  (allSales.data || []).forEach(sale => {
    if (sale.car?.purchase_date) {
      const purchaseDate = new Date(sale.car.purchase_date);
      const saleDate = new Date(sale.created_at);
      const days = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) {
        totalDaysToSell += days;
        soldCount += 1;
      }
    }
  });
  const averageDaysToSell = soldCount > 0 ? Math.round(totalDaysToSell / soldCount) : 0;

  // Recent sales
  const recentSales = (allSales.data || []).slice(0, 5).map(sale => ({
    id: sale.id,
    date: sale.created_at,
    customerName: sale.customer?.name || 'غير محدد',
    carName: sale.car ? `${sale.car.name} ${sale.car.model || ''}`.trim() : 'غير محدد',
    amount: sale.sale_price || 0,
    profit: sale.profit || 0
  }));

  return {
    salesTrend: {
      thisMonth: thisMonthSalesTotal,
      lastMonth: lastMonthSalesTotal,
      percentChange: salesPercentChange
    },
    profitTrend: {
      thisMonth: thisMonthProfit,
      lastMonth: lastMonthProfit,
      percentChange: profitPercentChange
    },
    purchasesTrend: {
      thisMonth: purchasesThisMonth,
      lastMonth: purchasesLastMonth,
      percentChange: purchasesPercentChange
    },
    inventoryByStatus: {
      available: availableCars,
      sold: soldCars,
      transferred: transferredCars
    },
    topCustomers,
    topSuppliers,
    topSellingCars,
    revenueByMonth,
    averageSalePrice,
    averageProfitMargin,
    inventoryTurnover,
    averageDaysToSell,
    recentSales
  };
}
