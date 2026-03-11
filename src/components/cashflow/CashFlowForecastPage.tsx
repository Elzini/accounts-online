import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calculator, Loader2, DollarSign, AlertTriangle, CheckCircle, Settings2
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export function CashFlowForecastPage() {
  const { companyId } = useCompany();

  // What-If parameters
  const [salesGrowth, setSalesGrowth] = useState(5);
  const [expenseChange, setExpenseChange] = useState(0);
  const [newInvestment, setNewInvestment] = useState(0);
  const [expectedCollection, setExpectedCollection] = useState(85);

  // Fetch historical sales
  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['cf-sales', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('sales').select('sale_date, sale_price, purchase_price')
        .eq('company_id', companyId!).order('sale_date', { ascending: true });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['cf-expenses', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('expense_date, amount')
        .eq('company_id', companyId!).order('expense_date', { ascending: true });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch installments (future cash inflow)
  const { data: installments = [] } = useQuery({
    queryKey: ['cf-installments', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('installments').select('due_date, amount, status')
        .eq('company_id', companyId!).eq('status', 'pending');
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch checks (future payments)
  const { data: checks = [] } = useQuery({
    queryKey: ['cf-checks', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('checks').select('due_date, amount, check_type, status')
        .eq('company_id', companyId!).in('status', ['pending', 'active']);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Historical monthly data
  const historicalMonthly = useMemo(() => {
    const months: Record<string, { inflow: number; outflow: number }> = {};

    sales.forEach((s: any) => {
      if (!s.sale_date) return;
      const d = new Date(s.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!months[key]) months[key] = { inflow: 0, outflow: 0 };
      months[key].inflow += s.sale_price || 0;
      months[key].outflow += s.purchase_price || 0;
    });

    expenses.forEach((e: any) => {
      if (!e.expense_date) return;
      const d = new Date(e.expense_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!months[key]) months[key] = { inflow: 0, outflow: 0 };
      months[key].outflow += e.amount || 0;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => {
        const [, m] = key.split('-');
        return { month: MONTH_NAMES[parseInt(m)], ...val, net: val.inflow - val.outflow, type: 'actual' as const };
      });
  }, [sales, expenses]);

  // Average monthly metrics for forecasting
  const avgMetrics = useMemo(() => {
    if (historicalMonthly.length === 0) return { avgInflow: 0, avgOutflow: 0 };
    const avgInflow = historicalMonthly.reduce((s, m) => s + m.inflow, 0) / historicalMonthly.length;
    const avgOutflow = historicalMonthly.reduce((s, m) => s + m.outflow, 0) / historicalMonthly.length;
    return { avgInflow, avgOutflow };
  }, [historicalMonthly]);

  // Future scheduled cash flows
  const scheduledFlows = useMemo(() => {
    const futureMonths: Record<string, { scheduled_in: number; scheduled_out: number }> = {};
    const now = new Date();

    installments.forEach((inst: any) => {
      if (!inst.due_date) return;
      const d = new Date(inst.due_date);
      if (d <= now) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!futureMonths[key]) futureMonths[key] = { scheduled_in: 0, scheduled_out: 0 };
      futureMonths[key].scheduled_in += (inst.amount || 0) * (expectedCollection / 100);
    });

    checks.forEach((ch: any) => {
      if (!ch.due_date) return;
      const d = new Date(ch.due_date);
      if (d <= now) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!futureMonths[key]) futureMonths[key] = { scheduled_in: 0, scheduled_out: 0 };
      if (ch.check_type === 'received') futureMonths[key].scheduled_in += ch.amount || 0;
      else futureMonths[key].scheduled_out += ch.amount || 0;
    });

    return futureMonths;
  }, [installments, checks, expectedCollection]);

  // Forecast (next 6 months)
  const forecastData = useMemo(() => {
    const now = new Date();
    const months: typeof historicalMonthly = [];

    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${futureDate.getFullYear()}-${String(futureDate.getMonth()).padStart(2, '0')}`;
      const scheduled = scheduledFlows[key] || { scheduled_in: 0, scheduled_out: 0 };

      const growthMultiplier = 1 + (salesGrowth / 100) * i;
      const expenseMultiplier = 1 + (expenseChange / 100);

      const projectedInflow = (avgMetrics.avgInflow * growthMultiplier) + scheduled.scheduled_in;
      const projectedOutflow = (avgMetrics.avgOutflow * expenseMultiplier) + scheduled.scheduled_out + (i === 1 ? newInvestment : 0);

      months.push({
        month: MONTH_NAMES[futureDate.getMonth()],
        inflow: Math.round(projectedInflow),
        outflow: Math.round(projectedOutflow),
        net: Math.round(projectedInflow - projectedOutflow),
        type: 'forecast' as const,
      });
    }
    return months;
  }, [avgMetrics, salesGrowth, expenseChange, newInvestment, scheduledFlows]);

  // Combined chart data
  const combinedData = useMemo(() => [
    ...historicalMonthly.map(m => ({ ...m, forecastNet: undefined })),
    ...forecastData.map(m => ({ ...m, forecastNet: m.net, net: undefined })),
  ], [historicalMonthly, forecastData]);

  // Summary KPIs
  const summary = useMemo(() => {
    const totalForecastInflow = forecastData.reduce((s, m) => s + m.inflow, 0);
    const totalForecastOutflow = forecastData.reduce((s, m) => s + m.outflow, 0);
    const totalForecastNet = totalForecastInflow - totalForecastOutflow;
    const pendingInstallments = installments.reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const pendingChecksOut = checks.filter((c: any) => c.check_type === 'issued').reduce((s: number, c: any) => s + (c.amount || 0), 0);
    const riskLevel = totalForecastNet < 0 ? 'high' : totalForecastNet < avgMetrics.avgInflow ? 'medium' : 'low';
    return { totalForecastInflow, totalForecastOutflow, totalForecastNet, pendingInstallments, pendingChecksOut, riskLevel };
  }, [forecastData, installments, checks, avgMetrics]);

  const fmt = (n: number) => Math.abs(n) >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  if (loadingSales) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">توقعات التدفق النقدي</h1>
            <p className="text-muted-foreground">تحليل وتوقع التدفقات النقدية المستقبلية مع سيناريوهات What-If</p>
          </div>
        </div>
        <Badge variant={summary.riskLevel === 'high' ? 'destructive' : summary.riskLevel === 'medium' ? 'secondary' : 'outline'} className="gap-1">
          {summary.riskLevel === 'high' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
          {summary.riskLevel === 'high' ? 'مخاطر عالية' : summary.riskLevel === 'medium' ? 'متوسط' : 'وضع جيد'}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'تدفقات واردة متوقعة', value: fmt(summary.totalForecastInflow), icon: ArrowUpRight, color: 'text-green-500' },
          { label: 'تدفقات صادرة متوقعة', value: fmt(summary.totalForecastOutflow), icon: ArrowDownRight, color: 'text-red-500' },
          { label: 'صافي التدفق المتوقع', value: fmt(summary.totalForecastNet), icon: summary.totalForecastNet >= 0 ? TrendingUp : TrendingDown, color: summary.totalForecastNet >= 0 ? 'text-green-500' : 'text-red-500' },
          { label: 'أقساط معلقة', value: fmt(summary.pendingInstallments), icon: DollarSign, color: 'text-blue-500' },
          { label: 'شيكات مستحقة', value: fmt(summary.pendingChecksOut), icon: DollarSign, color: 'text-orange-500' },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 text-center">
              <card.icon className={`w-6 h-6 mx-auto mb-1 ${card.color}`} />
              <p className="text-lg font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="forecast">
        <TabsList>
          <TabsTrigger value="forecast" className="gap-2"><TrendingUp className="w-4 h-4" />التوقعات</TabsTrigger>
          <TabsTrigger value="waterfall" className="gap-2"><BarChart className="w-4 h-4" />التدفقات الشهرية</TabsTrigger>
          <TabsTrigger value="whatif" className="gap-2"><Settings2 className="w-4 h-4" />سيناريوهات What-If</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">التدفق النقدي: فعلي + متوقع (6 أشهر)</CardTitle></CardHeader>
            <CardContent>
              {combinedData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات كافية للتوقع</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => v?.toLocaleString('ar-SA') || '—'} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="net" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} name="فعلي" connectNulls={false} />
                    <Area type="monotone" dataKey="forecastNet" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" name="متوقع" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waterfall" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">التدفقات الواردة مقابل الصادرة (متوقع)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                  <Bar dataKey="inflow" fill="hsl(var(--chart-2))" name="واردة" radius={[4,4,0,0]} />
                  <Bar dataKey="outflow" fill="hsl(var(--destructive))" name="صادرة" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatif" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="w-4 h-4" />متغيرات السيناريو</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm">نمو المبيعات الشهري: <span className="font-bold text-primary">{salesGrowth}%</span></Label>
                  <Slider value={[salesGrowth]} onValueChange={([v]) => setSalesGrowth(v)} min={-20} max={30} step={1} className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm">تغير المصروفات: <span className="font-bold text-primary">{expenseChange > 0 ? '+' : ''}{expenseChange}%</span></Label>
                  <Slider value={[expenseChange]} onValueChange={([v]) => setExpenseChange(v)} min={-30} max={30} step={1} className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm">نسبة التحصيل المتوقعة: <span className="font-bold text-primary">{expectedCollection}%</span></Label>
                  <Slider value={[expectedCollection]} onValueChange={([v]) => setExpectedCollection(v)} min={50} max={100} step={5} className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm">استثمار جديد (شهر قادم)</Label>
                  <Input type="number" value={newInvestment} onChange={e => setNewInvestment(Number(e.target.value))} className="mt-1" placeholder="0" />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSalesGrowth(5); setExpenseChange(0); setNewInvestment(0); setExpectedCollection(85); }}>
                  إعادة تعيين الافتراضي
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">نتيجة السيناريو</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="net" stroke={summary.totalForecastNet >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} fill={summary.totalForecastNet >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} fillOpacity={0.15} strokeWidth={2} name="صافي التدفق" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">إجمالي وارد</p>
                    <p className="text-lg font-bold text-green-500">{fmt(summary.totalForecastInflow)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">إجمالي صادر</p>
                    <p className="text-lg font-bold text-red-500">{fmt(summary.totalForecastOutflow)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">الصافي</p>
                    <p className={`text-lg font-bold ${summary.totalForecastNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmt(summary.totalForecastNet)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
