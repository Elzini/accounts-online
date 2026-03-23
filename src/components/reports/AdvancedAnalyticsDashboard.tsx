import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  Download, FileText, Calendar, ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { supabase } from '@/hooks/modules/useReportsServices';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdvancedAnalyticsDashboard() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const companyId = useCompanyId();
  const { hasCarInventory } = useIndustryFeatures();
  const [period, setPeriod] = useState('monthly');
  const [compareMode, setCompareMode] = useState(false);

  // Fetch sales data - industry-aware
  const { data: salesData = [] } = useQuery({
    queryKey: ['analytics-sales', companyId, hasCarInventory],
    queryFn: async () => {
      if (!companyId) return [];
      if (hasCarInventory) {
        const { data } = await supabase
          .from('sales')
          .select('sale_price, sale_date, profit, commission')
          .eq('company_id', companyId)
          .order('sale_date', { ascending: true });
        return (data || []).map((s: any) => ({
          sale_price: s.sale_price, sale_date: s.sale_date,
          profit: s.profit, commission: s.commission,
        }));
      } else {
        const { data } = await supabase
          .from('invoices')
          .select('total, subtotal, invoice_date, vat_amount')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sales')
          .neq('status', 'draft')
          .order('invoice_date', { ascending: true });
        return (data || []).map((inv: any) => ({
          sale_price: Number(inv.total) || 0,
          sale_date: inv.invoice_date,
          profit: (Number(inv.subtotal) || 0) * 0.3, // estimated margin
          commission: 0,
        }));
      }
    },
    enabled: !!companyId,
  });

  // Fetch expenses
  const { data: expensesData = [] } = useQuery({
    queryKey: ['analytics-expenses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('expenses')
        .select('amount, expense_date, category')
        .eq('company_id', companyId)
        .order('expense_date', { ascending: true });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Process monthly trends
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; expenses: number; profit: number; invoices: number }> = {};
    const monthNames = isRtl 
      ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Sales revenue
    salesData.forEach((s: any) => {
      const d = new Date(s.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, revenue: 0, expenses: 0, profit: 0, invoices: 0 };
      months[key].revenue += Number(s.sale_price) || 0;
      months[key].profit += Number(s.profit) || 0;
    });

    // Note: salesData now already contains unified data from either sales or invoices table
    // based on the industry type, so no separate invoicesData processing needed
    // Expenses
    expensesData.forEach((e: any) => {
      const d = new Date(e.expense_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, revenue: 0, expenses: 0, profit: 0, invoices: 0 };
      months[key].expenses += Number(e.amount) || 0;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => ({ ...v, net: v.revenue - v.expenses }));
  }, [salesData, invoicesData, expensesData, isRtl]);

  // Period comparison
  const periodComparison = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const thisMonthSales = salesData.filter((s: any) => {
      const d = new Date(s.sale_date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((sum: number, s: any) => sum + (Number(s.sale_price) || 0), 0);

    const lastMonthSales = salesData.filter((s: any) => {
      const d = new Date(s.sale_date);
      return d.getMonth() === (thisMonth - 1 + 12) % 12 && (thisMonth === 0 ? d.getFullYear() === thisYear - 1 : d.getFullYear() === thisYear);
    }).reduce((sum: number, s: any) => sum + (Number(s.sale_price) || 0), 0);

    const thisMonthExpenses = expensesData.filter((e: any) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const lastMonthExpenses = expensesData.filter((e: any) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === (thisMonth - 1 + 12) % 12;
    }).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    const salesChange = lastMonthSales ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100) : 0;
    const expenseChange = lastMonthExpenses ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100) : 0;

    return {
      thisMonthSales, lastMonthSales, salesChange,
      thisMonthExpenses, lastMonthExpenses, expenseChange,
      thisMonthProfit: thisMonthSales - thisMonthExpenses,
      lastMonthProfit: lastMonthSales - lastMonthExpenses,
    };
  }, [salesData, expensesData]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    expensesData.forEach((e: any) => {
      const cat = e.category || (isRtl ? 'أخرى' : 'Other');
      cats[cat] = (cats[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [expensesData, isRtl]);

  // Invoice status breakdown
  const invoiceStatus = useMemo(() => {
    const statuses: Record<string, number> = {};
    invoicesData.forEach((inv: any) => {
      const s = inv.status || 'draft';
      statuses[s] = (statuses[s] || 0) + 1;
    });
    const labels: Record<string, string> = isRtl 
      ? { draft: 'مسودة', approved: 'معتمدة', paid: 'مدفوعة', overdue: 'متأخرة', cancelled: 'ملغية' }
      : { draft: 'Draft', approved: 'Approved', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' };
    return Object.entries(statuses).map(([name, value]) => ({ name: labels[name] || name, value }));
  }, [invoicesData, isRtl]);

  const totalRevenue = salesData.reduce((s: number, d: any) => s + (Number(d.sale_price) || 0), 0) +
    invoicesData.filter((i: any) => i.invoice_type === 'sale').reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalExpenses = expensesData.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const exportCSV = () => {
    const headers = ['Month', 'Revenue', 'Expenses', 'Net Profit'];
    const rows = monthlyTrends.map(m => [m.month, m.revenue, m.expenses, m.net]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analytics-report.csv';
    link.click();
    toast.success(isRtl ? 'تم التصدير' : 'Exported');
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h2 className="text-2xl font-bold">{isRtl ? 'التقارير التحليلية المتقدمة' : 'Advanced Analytics'}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 me-1" /> {isRtl ? 'تصدير CSV' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* KPI Cards with Period Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'الإيرادات' : 'Revenue', value: totalRevenue, change: periodComparison.salesChange, icon: DollarSign, color: 'text-green-600' },
          { label: isRtl ? 'المصروفات' : 'Expenses', value: totalExpenses, change: periodComparison.expenseChange, icon: ShoppingCart, color: 'text-red-600' },
          { label: isRtl ? 'صافي الربح' : 'Net Profit', value: totalProfit, change: periodComparison.thisMonthProfit && periodComparison.lastMonthProfit ? ((periodComparison.thisMonthProfit - periodComparison.lastMonthProfit) / Math.abs(periodComparison.lastMonthProfit || 1) * 100) : 0, icon: TrendingUp, color: 'text-blue-600' },
          { label: isRtl ? 'الفواتير' : 'Invoices', value: invoicesData.length, change: 0, icon: FileText, color: 'text-purple-600' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                {kpi.change !== 0 && (
                  <Badge variant={kpi.change > 0 ? 'default' : 'destructive'} className="text-xs">
                    {kpi.change > 0 ? <ArrowUpRight className="h-3 w-3 me-1" /> : <ArrowDownRight className="h-3 w-3 me-1" />}
                    {Math.abs(kpi.change).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{typeof kpi.value === 'number' && kpi.value > 100 ? kpi.value.toLocaleString() : kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isRtl ? 'مقارنة الشهر الحالي بالسابق' : 'Current vs Previous Month'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: isRtl ? 'المبيعات' : 'Sales', current: periodComparison.thisMonthSales, previous: periodComparison.lastMonthSales, change: periodComparison.salesChange },
              { label: isRtl ? 'المصروفات' : 'Expenses', current: periodComparison.thisMonthExpenses, previous: periodComparison.lastMonthExpenses, change: periodComparison.expenseChange },
              { label: isRtl ? 'الربح' : 'Profit', current: periodComparison.thisMonthProfit, previous: periodComparison.lastMonthProfit, change: periodComparison.lastMonthProfit ? ((periodComparison.thisMonthProfit - periodComparison.lastMonthProfit) / Math.abs(periodComparison.lastMonthProfit || 1) * 100) : 0 },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.current.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{isRtl ? 'السابق:' : 'Prev:'} {item.previous.toLocaleString()}</span>
                  {item.change !== 0 && (
                    <Badge variant={item.change > 0 ? 'default' : 'destructive'} className="text-xs">
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">{isRtl ? 'الاتجاهات' : 'Trends'}</TabsTrigger>
          <TabsTrigger value="breakdown">{isRtl ? 'التوزيع' : 'Breakdown'}</TabsTrigger>
          <TabsTrigger value="invoices">{isRtl ? 'الفواتير' : 'Invoices'}</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>{isRtl ? 'الإيرادات والمصروفات الشهرية' : 'Monthly Revenue & Expenses'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name={isRtl ? 'الإيرادات' : 'Revenue'} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name={isRtl ? 'المصروفات' : 'Expenses'} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="net" stroke="hsl(var(--chart-3))" strokeWidth={2} name={isRtl ? 'صافي' : 'Net'} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{isRtl ? 'توزيع المصروفات' : 'Expense Breakdown'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{isRtl ? 'حالة الفواتير' : 'Invoice Status'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={invoiceStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {invoiceStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle>{isRtl ? 'اتجاه الفواتير الشهرية' : 'Monthly Invoice Trend'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="invoices" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" name={isRtl ? 'عدد الفواتير' : 'Invoices'} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
