import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, PieChart, TrendingUp, Target, Activity, 
  CheckCircle, DollarSign, Users, ShoppingCart, Car, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function BIAnalyticsPluginPage() {
  const { companyId } = useCompany();
  const { hasCarInventory } = useIndustryFeatures();
  const [period, setPeriod] = useState<'6' | '12'>('6');

  // Fetch sales data
  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['bi-sales', companyId, hasCarInventory],
    queryFn: async () => {
      if (hasCarInventory) {
        const { data } = await supabase.from('sales').select('sale_date, sale_price, purchase_price, status, customer_id')
          .eq('company_id', companyId!);
        return data || [];
      }
      const { data } = await supabase.from('invoices').select('invoice_date, subtotal, customer_name, status')
        .eq('company_id', companyId!).eq('invoice_type', 'sales');
      return (data || []).map((inv: any) => ({
        sale_date: inv.invoice_date, sale_price: inv.subtotal, purchase_price: 0, status: inv.status, customer_id: inv.customer_name,
      }));
    },
    enabled: !!companyId,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['bi-customers', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('customers').select('id, name, created_at')
        .eq('company_id', companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch inventory (cars only for car dealerships)
  const { data: cars = [] } = useQuery({
    queryKey: ['bi-cars', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('cars').select('id, status, purchase_price, purchase_date')
        .eq('company_id', companyId!);
      return data || [];
    },
    enabled: !!companyId && hasCarInventory,
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['bi-expenses', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount, expense_date, category')
        .eq('company_id', companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const isLoading = loadingSales;

  // KPI calculations
  const kpis = useMemo(() => {
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0);
    const totalProfit = sales.reduce((sum: number, s: any) => sum + ((s.sale_price || 0) - (s.purchase_price || 0)), 0);
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const availableCars = cars.filter((c: any) => c.status === 'available').length;
    const activeCustomers = new Set(sales.map((s: any) => s.customer_id)).size;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';
    
    return { totalRevenue, totalProfit, totalExpenses, availableCars, activeCustomers, profitMargin };
  }, [sales, expenses, cars]);

  // Monthly revenue/expense chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; expenses: number; profit: number }> = {};
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    sales.forEach((s: any) => {
      if (!s.sale_date) return;
      const d = new Date(s.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!months[key]) months[key] = { revenue: 0, expenses: 0, profit: 0 };
      months[key].revenue += s.sale_price || 0;
      months[key].profit += (s.sale_price || 0) - (s.purchase_price || 0);
    });
    
    expenses.forEach((e: any) => {
      if (!e.expense_date) return;
      const d = new Date(e.expense_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!months[key]) months[key] = { revenue: 0, expenses: 0, profit: 0 };
      months[key].expenses += e.amount || 0;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-parseInt(period))
      .map(([key, val]) => {
        const [, m] = key.split('-');
        return { month: monthNames[parseInt(m)], ...val };
      });
  }, [sales, expenses, period]);

  // Category distribution (expense categories)
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category || 'أخرى';
      cats[cat] = (cats[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Sales trend by week (last 8 weeks)
  const trendData = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; sales: number; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekSales = sales.filter((s: any) => {
        const d = new Date(s.sale_date);
        return d >= weekStart && d < weekEnd;
      });
      
      weeks.push({
        label: `أسبوع ${8 - i}`,
        sales: weekSales.reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0),
        count: weekSales.length,
      });
    }
    return weeks;
  }, [sales]);

  // Top customers
  const topCustomers = useMemo(() => {
    const custTotals: Record<string, number> = {};
    sales.forEach((s: any) => {
      if (s.customer_id) custTotals[s.customer_id] = (custTotals[s.customer_id] || 0) + (s.sale_price || 0);
    });
    return Object.entries(custTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, total]) => {
        const cust = customers.find((c: any) => c.id === id);
        return { name: cust?.name || 'غير معروف', total };
      });
  }, [sales, customers]);

  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">تحليلات الأعمال BI</h1>
            <p className="text-muted-foreground">لوحات تحليل متقدمة مبنية على بياناتك الفعلية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: '6' | '12') => setPeriod(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">آخر 6 أشهر</SelectItem>
              <SelectItem value="12">آخر 12 شهر</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="gap-1"><CheckCircle className="w-3 h-3 text-green-500" />بيانات حية</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: DollarSign, label: 'إجمالي الإيرادات', value: fmt(kpis.totalRevenue), color: 'text-green-500', bg: 'bg-green-500/10' },
          { icon: TrendingUp, label: 'صافي الربح', value: fmt(kpis.totalProfit), color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: ShoppingCart, label: 'المصروفات', value: fmt(kpis.totalExpenses), color: 'text-red-500', bg: 'bg-red-500/10' },
          { icon: Target, label: 'هامش الربح', value: `${kpis.profitMargin}%`, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { icon: Users, label: 'عملاء نشطين', value: kpis.activeCustomers.toString(), color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { icon: Car, label: 'مخزون متاح', value: kpis.availableCars.toString(), color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 text-center">
              <div className={`w-10 h-10 mx-auto rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2"><BarChart3 className="w-4 h-4" />الإيرادات</TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2"><PieChart className="w-4 h-4" />التوزيع</TabsTrigger>
          <TabsTrigger value="trends" className="gap-2"><Activity className="w-4 h-4" />الاتجاهات</TabsTrigger>
          <TabsTrigger value="customers" className="gap-2"><Users className="w-4 h-4" />العملاء</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">الإيرادات مقابل المصروفات والأرباح</CardTitle></CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات كافية لعرض الرسم البياني</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" radius={[4,4,0,0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="المصروفات" radius={[4,4,0,0]} />
                    <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="الربح" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">توزيع المصروفات حسب الفئة</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {categoryData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات مصروفات</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <RPieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                  </RPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">اتجاه المبيعات الأسبوعي (آخر 8 أسابيع)</CardTitle></CardHeader>
            <CardContent>
              {trendData.every(t => t.sales === 0) ? (
                <p className="text-center text-muted-foreground py-12">لا توجد مبيعات في الفترة الأخيرة</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} name="المبيعات" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">أفضل 5 عملاء من حيث المشتريات</CardTitle></CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات عملاء</p>
              ) : (
                <div className="space-y-4">
                  {topCustomers.map((c, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{c.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(c.total / (topCustomers[0]?.total || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold">{c.total.toLocaleString('ar-SA')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
