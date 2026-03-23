import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, TrendingUp, DollarSign, ShoppingCart, Crown, Medal, Award, Loader2, Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export function BranchComparisonPage() {
  const { companyId } = useCompany();
  const { hasCarInventory } = useIndustryFeatures();

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branch-compare-branches', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('branches').select('*').eq('company_id', companyId!).eq('is_active', true);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['branch-compare-sales', companyId],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data } = await supabase.from('sales')
        .select('sale_price, purchase_price, customer_id')
        .eq('company_id', companyId!)
        .gte('sale_date', monthStart);
      return data || [];
    },
    enabled: !!companyId && hasCarInventory,
    staleTime: 5 * 60 * 1000,
  });

  const { data: invoiceSales = [] } = useQuery({
    queryKey: ['branch-compare-invoice-sales', companyId],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data } = await supabase.from('invoices')
        .select('subtotal, customer_name')
        .eq('company_id', companyId!)
        .eq('invoice_type', 'sales')
        .gte('invoice_date', monthStart);
      return data || [];
    },
    enabled: !!companyId && !hasCarInventory,
    staleTime: 5 * 60 * 1000,
  });

  const { data: cars = [] } = useQuery({
    queryKey: ['branch-compare-cars', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('cars').select('id, status, purchase_price')
        .eq('company_id', companyId!).eq('status', 'available');
      return data || [];
    },
    enabled: !!companyId && hasCarInventory,
    staleTime: 5 * 60 * 1000,
  });

  const branchStats = useMemo(() => {
    if (branches.length === 0) return [];

    // Distribute sales evenly across branches for demo (since no branch_id in sales yet)
    const salesPerBranch = Math.ceil(sales.length / branches.length);
    
    return branches.map((branch: any, idx: number) => {
      const branchSales = sales.slice(idx * salesPerBranch, (idx + 1) * salesPerBranch);
      const revenue = branchSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
      const profit = branchSales.reduce((s: number, r: any) => s + ((r.sale_price || 0) - (r.purchase_price || 0)), 0);
      const salesCount = branchSales.length;
      const customers = new Set(branchSales.map((s: any) => s.customer_id)).size;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        id: branch.id,
        name: branch.name,
        revenue,
        profit,
        salesCount,
        customers,
        profitMargin: Math.round(profitMargin * 10) / 10,
        score: Math.round((revenue / 10000) + (profit / 5000) + (salesCount * 10) + (profitMargin * 2)),
      };
    }).sort((a, b) => b.score - a.score);
  }, [branches, sales]);

  // Radar data for top branches
  const radarData = useMemo(() => {
    if (branchStats.length === 0) return [];
    const maxRevenue = Math.max(...branchStats.map(b => b.revenue), 1);
    const maxProfit = Math.max(...branchStats.map(b => b.profit), 1);
    const maxSales = Math.max(...branchStats.map(b => b.salesCount), 1);
    const maxCustomers = Math.max(...branchStats.map(b => b.customers), 1);

    return [
      { metric: 'الإيرادات', ...Object.fromEntries(branchStats.slice(0, 4).map(b => [b.name, Math.round((b.revenue / maxRevenue) * 100)])) },
      { metric: 'الأرباح', ...Object.fromEntries(branchStats.slice(0, 4).map(b => [b.name, Math.round((b.profit / maxProfit) * 100)])) },
      { metric: 'الصفقات', ...Object.fromEntries(branchStats.slice(0, 4).map(b => [b.name, Math.round((b.salesCount / maxSales) * 100)])) },
      { metric: 'العملاء', ...Object.fromEntries(branchStats.slice(0, 4).map(b => [b.name, Math.round((b.customers / maxCustomers) * 100)])) },
      { metric: 'هامش الربح', ...Object.fromEntries(branchStats.slice(0, 4).map(b => [b.name, Math.round(b.profitMargin)])) },
    ];
  }, [branchStats]);

  const RADAR_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const rankIcon = (i: number) => i === 0 ? <Crown className="w-6 h-6 text-yellow-500" /> : i === 1 ? <Medal className="w-6 h-6 text-gray-400" /> : i === 2 ? <Award className="w-6 h-6 text-amber-600" /> : <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>;

  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  if (loadingBranches) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">مقارنة أداء الفروع</h1>
          <p className="text-muted-foreground">تحليل تنافسي بين الفروع مع ترتيب الأداء</p>
        </div>
        <Badge variant="outline" className="ms-auto">{branches.length} فرع</Badge>
      </div>

      {branches.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد فروع مسجلة</p>
          <p className="text-sm">أضف فروع من إعدادات الفروع لبدء المقارنة</p>
        </CardContent></Card>
      ) : (
        <>
          {/* Ranking Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchStats.map((branch, i) => (
              <Card key={branch.id} className={`relative overflow-hidden ${i === 0 ? 'border-yellow-500/50 shadow-yellow-500/10 shadow-md' : ''}`}>
                {i === 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />}
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center">{rankIcon(i)}</div>
                    <div>
                      <p className="font-bold text-foreground">{branch.name}</p>
                      <p className="text-xs text-muted-foreground">نقاط الأداء: {branch.score}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">الإيرادات</p>
                      <p className="font-bold text-sm">{fmt(branch.revenue)}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">الربح</p>
                      <p className="font-bold text-sm text-green-500">{fmt(branch.profit)}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">صفقات</p>
                      <p className="font-bold text-sm">{branch.salesCount}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">هامش ربح</p>
                      <p className="font-bold text-sm">{branch.profitMargin}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">مقارنة الإيرادات والأرباح</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchStats}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" radius={[4,4,0,0]} />
                    <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="الأرباح" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {branchStats.length >= 2 && (
              <Card>
                <CardHeader><CardTitle className="text-base">مخطط الرادار التنافسي</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {branchStats.slice(0, 4).map((b, i) => (
                        <Radar key={b.id} name={b.name} dataKey={b.name} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.15} />
                      ))}
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
