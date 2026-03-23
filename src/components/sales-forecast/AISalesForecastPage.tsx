import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain, TrendingUp, Loader2, Sparkles, AlertTriangle, ArrowUpRight, CalendarDays, RefreshCw
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSalesForForecast } from '@/services/salesForecast';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export function AISalesForecastPage() {
  const { companyId } = useCompany();
  const { hasCarInventory } = useIndustryFeatures();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch historical sales - industry-aware
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['ai-forecast-sales', companyId, hasCarInventory],
    queryFn: () => fetchSalesForForecast(hasCarInventory),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Historical monthly
  const historical = useMemo(() => {
    const months: Record<string, { revenue: number; profit: number; count: number }> = {};
    sales.forEach((s: any) => {
      if (!s.sale_date) return;
      const d = new Date(s.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!months[key]) months[key] = { revenue: 0, profit: 0, count: 0 };
      months[key].revenue += s.sale_price || 0;
      months[key].profit += (s.sale_price || 0) - (s.purchase_price || 0);
      months[key].count += 1;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => {
      const [y, m] = key.split('-');
      return { key, month: `${MONTH_NAMES[parseInt(m)]} ${y}`, ...val };
    });
  }, [sales]);

  // Simple statistical forecast (moving average + trend)
  const forecast = useMemo(() => {
    if (historical.length < 3) return [];
    const last6 = historical.slice(-6);
    const avgRevenue = last6.reduce((s, m) => s + m.revenue, 0) / last6.length;
    const avgProfit = last6.reduce((s, m) => s + m.profit, 0) / last6.length;
    const avgCount = last6.reduce((s, m) => s + m.count, 0) / last6.length;

    // Calculate trend
    const revenueGrowth = last6.length >= 2
      ? (last6[last6.length - 1].revenue - last6[0].revenue) / (last6[0].revenue || 1) / last6.length
      : 0;

    const now = new Date();
    const months = [];
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const growthFactor = 1 + (revenueGrowth * i);
      months.push({
        key: `forecast-${i}`,
        month: `${MONTH_NAMES[futureDate.getMonth()]} ${futureDate.getFullYear()}`,
        revenue: Math.round(avgRevenue * growthFactor),
        profit: Math.round(avgProfit * growthFactor),
        count: Math.round(avgCount * growthFactor),
        isForecast: true,
      });
    }
    return months;
  }, [historical]);

  // Combined chart data
  const chartData = useMemo(() => [
    ...historical.slice(-8).map(m => ({ ...m, forecastRevenue: undefined })),
    ...forecast.map(m => ({ ...m, forecastRevenue: m.revenue, revenue: undefined })),
  ], [historical, forecast]);

  // AI Analysis
  const analyzeWithAI = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('يجب تسجيل الدخول');

      const historicalSummary = historical.slice(-12).map(m => `${m.month}: إيرادات ${m.revenue.toLocaleString()}, ربح ${m.profit.toLocaleString()}, ${m.count} صفقة`).join('\n');
      const forecastSummary = forecast.map(m => `${m.month}: إيرادات متوقعة ${m.revenue.toLocaleString()}, ربح متوقع ${m.profit.toLocaleString()}`).join('\n');

      const resp = await supabase.functions.invoke('ai-sales-forecast', {
        body: { historicalSummary, forecastSummary, companyId },
      });

      if (resp.error) throw resp.error;
      return resp.data?.analysis || 'لم يتم الحصول على تحليل';
    },
    onSuccess: (data) => {
      setAiAnalysis(data);
      setIsAnalyzing(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل التحليل');
      setIsAnalyzing(false);
    },
  });

  const totalForecastRevenue = forecast.reduce((s, m) => s + m.revenue, 0);
  const totalHistoricalRevenue = historical.slice(-6).reduce((s, m) => s + m.revenue, 0);
  const growthPct = totalHistoricalRevenue > 0 ? ((totalForecastRevenue - totalHistoricalRevenue) / totalHistoricalRevenue * 100).toFixed(1) : '0';

  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">توقعات المبيعات بالذكاء الاصطناعي</h1>
            <p className="text-muted-foreground">تنبؤات مبنية على بياناتك التاريخية مع تحليل AI</p>
          </div>
        </div>
        <Button onClick={() => analyzeWithAI.mutate()} disabled={isAnalyzing || historical.length < 3} className="gap-2">
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          تحليل AI متقدم
        </Button>
      </div>

      {historical.length < 3 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">بيانات غير كافية للتوقع</p>
          <p className="text-sm">يُشترط وجود 3 أشهر على الأقل من بيانات المبيعات</p>
        </CardContent></Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <p className="text-xl font-bold">{fmt(totalForecastRevenue)}</p>
              <p className="text-xs text-muted-foreground">إيرادات متوقعة (6 أشهر)</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <ArrowUpRight className={`w-6 h-6 mx-auto mb-1 ${Number(growthPct) >= 0 ? 'text-green-500' : 'text-destructive'}`} />
              <p className="text-xl font-bold">{growthPct}%</p>
              <p className="text-xs text-muted-foreground">نمو متوقع</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <CalendarDays className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-xl font-bold">{historical.length}</p>
              <p className="text-xs text-muted-foreground">أشهر بيانات تاريخية</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Brain className="w-6 h-6 mx-auto mb-1 text-purple-500" />
              <p className="text-xl font-bold">6</p>
              <p className="text-xs text-muted-foreground">أشهر توقعات</p>
            </CardContent></Card>
          </div>

          {/* Forecast Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">الإيرادات: فعلي + متوقع</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => fmt(v)} />
                  <Tooltip formatter={(v: number) => v?.toLocaleString('ar-SA') || '—'} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} name="فعلي" connectNulls={false} />
                  <Area type="monotone" dataKey="forecastRevenue" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" name="متوقع" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Forecast Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">التوقعات الشهرية التفصيلية</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2 px-3">الشهر</th>
                      <th className="text-center py-2 px-3">إيرادات متوقعة</th>
                      <th className="text-center py-2 px-3">ربح متوقع</th>
                      <th className="text-center py-2 px-3">صفقات متوقعة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map(m => (
                      <tr key={m.key} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{m.month}</td>
                        <td className="text-center py-2 px-3">{m.revenue.toLocaleString('ar-SA')}</td>
                        <td className="text-center py-2 px-3 text-green-600">{m.profit.toLocaleString('ar-SA')}</td>
                        <td className="text-center py-2 px-3">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <Card className="border-primary/30">
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">تحليل الذكاء الاصطناعي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none" dir="rtl">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
