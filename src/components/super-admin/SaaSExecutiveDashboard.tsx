import { useQuery } from '@tanstack/react-query';
import { 
  Building2, TrendingUp, TrendingDown, Users, AlertTriangle,
  DollarSign, BarChart3, PieChart as PieChartIcon, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchSaaSKPIs } from '@/services/saasAdmin';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function SaaSExecutiveDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['saas-kpis'],
    queryFn: fetchSaaSKPIs,
    staleTime: 1000 * 60 * 5,
  });

  // Monthly growth data
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['saas-monthly-growth'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('created_at')
        .order('created_at');
      
      if (!data) return [];
      
      const monthMap: Record<string, number> = {};
      data.forEach(c => {
        const month = c.created_at.substring(0, 7); // YYYY-MM
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      let cumulative = 0;
      return Object.entries(monthMap).map(([month, count]) => {
        cumulative += count;
        return { month: month.substring(5), companies: cumulative, newCompanies: count };
      });
    },
  });

  // Plan distribution
  const { data: planDistribution = [] } = useQuery({
    queryKey: ['saas-plan-distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan_name, status');
      
      if (!data) return [];
      
      const planMap: Record<string, number> = {};
      data.forEach(s => {
        const name = s.plan_name || 'بدون باقة';
        planMap[name] = (planMap[name] || 0) + 1;
      });

      return Object.entries(planMap).map(([name, value]) => ({ name, value }));
    },
  });

  // Country distribution
  const { data: countryDistribution = [] } = useQuery({
    queryKey: ['saas-country-distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('country');
      
      if (!data) return [];
      
      const countryMap: Record<string, number> = {};
      data.forEach(c => {
        const country = (c as any).country || 'SA';
        countryMap[country] = (countryMap[country] || 0) + 1;
      });

      const countryNames: Record<string, string> = {
        SA: 'السعودية', AE: 'الإمارات', KW: 'الكويت', BH: 'البحرين',
        QA: 'قطر', OM: 'عمان', EG: 'مصر', JO: 'الأردن', IQ: 'العراق',
      };

      return Object.entries(countryMap)
        .map(([code, value]) => ({ name: countryNames[code] || code, value }))
        .sort((a, b) => b.value - a.value);
    },
  });

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { title: 'إجمالي الشركات', value: kpis?.totalCompanies || 0, icon: Building2, color: 'text-primary' },
    { title: 'الشركات النشطة', value: kpis?.activeCompanies || 0, icon: TrendingUp, color: 'text-green-500' },
    { title: 'الشركات المجمدة', value: kpis?.suspendedCompanies || 0, icon: AlertTriangle, color: 'text-destructive' },
    { title: 'الشركات التجريبية', value: kpis?.trialCompanies || 0, icon: Users, color: 'text-amber-500' },
    { title: 'الإيراد الشهري (MRR)', value: `${(kpis?.mrr || 0).toLocaleString()} ر.س`, icon: DollarSign, color: 'text-green-500' },
    { title: 'الإيراد السنوي (ARR)', value: `${(kpis?.arr || 0).toLocaleString()} ر.س`, icon: BarChart3, color: 'text-primary' },
    { title: 'معدل الإلغاء', value: `${kpis?.churnRate || 0}%`, icon: TrendingDown, color: 'text-destructive' },
    { title: 'معدل التحويل', value: `${kpis?.conversionRate || 0}%`, icon: TrendingUp, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">لوحة المؤشرات التنفيذية</h2>
        <p className="text-muted-foreground">نظرة شاملة على أداء النظام</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
                <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              نمو الشركات شهرياً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="companies" stroke="hsl(var(--primary))" name="إجمالي الشركات" strokeWidth={2} />
                <Line type="monotone" dataKey="newCompanies" stroke="hsl(var(--accent))" name="شركات جديدة" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              توزيع الباقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {planDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                لا توجد بيانات باقات بعد
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              نمو الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Bar dataKey="newCompanies" fill="hsl(var(--primary))" name="شركات جديدة" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              الدول الأكثر اشتراكاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="عدد الشركات" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                لا توجد بيانات بعد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
